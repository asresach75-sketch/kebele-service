const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware');
const ServiceRequest = require('../models/ServiceRequest');
const Feedback = require('../models/Feedback');
const createDocumentPdf = require('../utils/documentPdf');
const sendSMS = require('../utils/sendSMS');
const sendEmail = require('../utils/sendEmail');
const { getDuplicateIdentityFilters } = require('../utils/applicationIdentity');
const { verifyToken, verifyAdmin, verifyRole } = require('../middleware/authMiddleware');

const getOptionalUserId = (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return '';
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret').id || '';
  } catch {
    return '';
  }
};

const getDefaultPayment = (serviceType) => {
  const fees = {
    NEW_ID_CARD: 200,
    ID_RENEWAL: 150,
    BIRTH_REGISTRATION: 80,
    MARRIAGE_REGISTRATION: 120,
    DIVORCE_REGISTRATION: 120,
    DEATH_REGISTRATION: 70
  };
  return fees[serviceType] || 150;
};

const isValidDateOfBirth = (value) => {
  const birthDate = new Date(`${String(value || '').trim()}T00:00:00`);
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return false;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 && age <= 120;
};

const findActiveDuplicate = async (serviceType, body) => {
  const filters = getDuplicateIdentityFilters(serviceType, body);
  if (!serviceType || !filters.length) return null;

  return ServiceRequest.findOne({
    serviceType,
    status: { $nin: ['COMPLETED', 'REJECTED', 'Approved', 'Rejected'] },
    $or: filters
  }).sort({ createdAt: -1 });
};

const WORKFLOW_STATUSES = ['PENDING_OFFICER', 'APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'APPROVED_BY_FINANCE', 'COMPLETED', 'REJECTED'];

const createRequest = async (req, res) => {
  try {
    const newRequest = new ServiceRequest(req.body);
    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendApplicationEmail = async ({ to, subject, text, html }) => {
  if (!to || !(process.env.EMAIL_USER || process.env.SMTP_USER) || !(process.env.EMAIL_PASS || process.env.SMTP_PASS)) {
    console.warn('Email notification skipped: recipient or SMTP credentials are missing.');
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    await sendEmail({
      email: to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { sent: false, reason: error.message };
  }
};

router.post('/feedbacks', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required.' });
    }

    const feedback = await Feedback.create({ name, email, subject, message });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 1. handleStatusUpdate ፋንክሽኑን ከራውቶች በፊት ከፍ አድርገን እናስቀምጣለን
// ==========================================
const handleStatusUpdate = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const normalizedStatus = status.toLowerCase();

    if (req.user.role === 'officer' && ['pending', 'pending_officer'].includes(String(request.status).toLowerCase()) && ['approved', 'approved_by_officer'].includes(normalizedStatus)) {
      request.status = 'APPROVED_BY_OFFICER';
      request.paymentStatus = 'Pending';
      await sendSMS(
        request.phoneNumber || request.phone,
        `Hello ${request.fullName || 'Applicant'}; your ${request.serviceType} application ${request.applicationId} was approved by the officer. Please pay through Chapa or Telebirr in the E-Kebele Tracker.`
      );
      if (request.email) {
        await sendApplicationEmail({
          to: request.email,
          subject: 'Your E-Kebele application has been approved',
          text: `Hello ${request.fullName || 'Applicant'},\n\nYour application ${request.applicationId} has been approved by the officer. Please complete the payment to continue the process.`,
          html: `<p>Hello ${request.fullName || 'Applicant'},</p><p>Your application <strong>${request.applicationId}</strong> has been approved by the officer.</p><p>Please complete the payment to continue the process.</p>`
        });
      }
    } else if (req.user.role === 'finance') {
      if (request.status !== 'PAID_PENDING_FINANCE' && request.status !== 'Payment Verified') {
        return res.status(400).json({ success: false, message: 'Only paid applications can be approved by finance.' });
      }
      if (!['payment verified', 'approved_by_finance'].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: 'Finance can only verify payments.' });
      }
      request.status = 'APPROVED_BY_FINANCE';
      request.paymentStatus = 'Verified';
      request.paymentVerifiedAt = new Date();
      request.paymentVerifiedBy = req.user.email;
      await sendSMS(
        request.phoneNumber || request.phone,
        `Congratulations ${request.fullName || 'Applicant'}; payment for application ${request.applicationId} was verified by Finance. Print or collect your document from the E-Kebele Tracker.`
      );
      if (request.email) {
        await sendApplicationEmail({
          to: request.email,
          subject: 'Payment verified for your E-Kebele application',
          text: `Hello ${request.fullName || 'Applicant'},\n\nYour payment for application ${request.applicationId} has been verified. The next stage is being processed and your document will be prepared.`,
          html: `<p>Hello ${request.fullName || 'Applicant'},</p><p>Your payment for application <strong>${request.applicationId}</strong> has been verified.</p><p>The next stage is being processed and your document will be prepared.</p>`
        });
      }
    } else if (req.user.role === 'admin' && ['completed', 'complete'].includes(normalizedStatus)) {
      if (request.status !== 'APPROVED_BY_FINANCE' && request.status !== 'Payment Verified') {
        return res.status(400).json({ success: false, message: 'Only finance-approved applications can be completed.' });
      }
      request.status = 'COMPLETED';
      request.completedAt = new Date();
      request.completedBy = req.user.email;
    } else {
      const requestedStatus = status.toUpperCase().replaceAll(' ', '_');
      if (!WORKFLOW_STATUSES.includes(requestedStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid workflow status.' });
      }
      request.status = requestedStatus;
    }

    if (req.user.role === 'verifier' && !['NEW_ID_CARD', 'ID_RENEWAL'].includes(request.serviceType)) {
      return res.status(403).json({ success: false, message: 'Verifier can only approve new ID or renewal applications.' });
    }

    if (req.user.role === 'vital' && !['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'].includes(request.serviceType)) {
      return res.status(403).json({ success: false, message: 'Vital role can only approve vital event records.' });
    }

    const updatedRequest = await request.save();

    if (updatedRequest.status === 'COMPLETED') {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, `${updatedRequest.applicationId}.pdf`);
      const pdfBuffer = await createDocumentPdf(updatedRequest);
      fs.writeFileSync(filePath, pdfBuffer);
    }

    if (status && ['approved', 'payment verified', 'approved_by_officer', 'approved_by_finance'].includes(normalizedStatus)) {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `${updatedRequest.applicationId}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const pdfBuffer = await createDocumentPdf(updatedRequest);
      fs.writeFileSync(filePath, pdfBuffer);
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/payment/initiate', verifyToken, async (req, res) => {
  try {
    const { applicationId, email, amount } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required.' });
    }

    const request = await ServiceRequest.findOne({ applicationId });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (request.status !== 'APPROVED_BY_OFFICER') {
      return res.status(400).json({ success: false, message: 'Payment is available only after officer approval.' });
    }

    const paymentAmount = Number(amount || request.paymentAmount || 0);
    const payerEmail = email || request.email || 'user@gmail.com';
    const txRef = `EKB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY || 'CHASECK-TEST-SECRET'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(paymentAmount),
        currency: 'ETB',
        email: payerEmail,
        first_name: request.fullName?.split(' ')[0] || 'Applicant',
        last_name: request.fullName?.split(' ').slice(1).join(' ') || 'User',
        tx_ref: txRef,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/services/payment/verify`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-status`,
        customization: {
          title: 'E-Kebele Service Payment',
          description: `Payment for ${request.applicationId}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data || !data.data.checkout_url) {
      return res.status(400).json({
        success: false,
        message: data.message || 'Unable to initialize payment.',
        details: data,
      });
    }

    request.paymentRef = txRef;
    request.paymentStatus = 'Initiated';
    request.status = 'PAID_PENDING_FINANCE';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully.',
      data: {
        checkoutUrl: data.data.checkout_url,
        txRef,
        amount: paymentAmount,
      },
    });
  } catch (error) {
    console.error('Payment init error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initialization failed.' });
  }
});

router.post('/payment/simulate', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const request = await ServiceRequest.findOne({ applicationId });

    if (!request) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (String(request.userId) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'You can only pay for your own application.' });
    if (request.status !== 'APPROVED_BY_OFFICER') return res.status(400).json({ success: false, message: 'Payment is available only after officer approval.' });

    request.paymentRef = `CHAPA-SIM-${Date.now()}`;
    request.paymentMethod = 'Chapa (Simulated)';
    request.paymentStatus = 'Initiated';
    request.status = 'PAID_PENDING_FINANCE';
    await request.save();

    res.status(200).json({ success: true, message: 'Demo payment completed and sent to Finance.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Demo payment failed.' });
  }
});

router.put(['/workflow/pay/:id', '/pay/:id'], verifyToken, async (req, res) => {
  try {
    const { paymentMethod, paymentPhone, paymentTxRef, amount } = req.body;
    const method = String(paymentMethod || '').trim();
    const reference = String(paymentTxRef || '').trim();
    const paymentAmount = Number(amount);
    const request = mongoose.isValidObjectId(req.params.id)
      ? await ServiceRequest.findById(req.params.id)
      : await ServiceRequest.findOne({ applicationId: req.params.id });

    if (!request) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (String(request.userId) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'You can only pay for your own application.' });
    if (!['Chapa', 'Telebirr'].includes(method)) return res.status(400).json({ success: false, message: 'Payment method must be Chapa or Telebirr.' });
    if (method === 'Telebirr' && !/^(09|07)\d{8}$/.test(String(paymentPhone || '').trim())) {
      return res.status(400).json({ success: false, message: 'A valid Telebirr phone number starting with 09 or 07 is required.' });
    }
    if (!reference) return res.status(400).json({ success: false, message: 'Payment transaction reference is required.' });
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    if (request.status !== 'APPROVED_BY_OFFICER') return res.status(400).json({ success: false, message: 'Payment is available only after officer approval.' });

    request.paymentMethod = `${method} (Simulated)`;
    request.paymentPhone = paymentPhone ? String(paymentPhone).trim() : '';
    request.paymentRef = reference;
    request.amountPaid = paymentAmount;
    request.paymentStatus = 'Initiated';
    request.currency = 'ETB';
    request.status = 'PAID_PENDING_FINANCE';
    await request.save();

    res.status(200).json({ success: true, message: 'Payment recorded and sent to Finance for review.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Payment recording failed.' });
  }
});

router.post('/payment/verify', async (req, res) => {
  try {
    const { tx_ref, status, amount, currency } = req.body;

    if (!tx_ref) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required.' });
    }

    if (status !== 'success') {
      return res.status(400).json({ success: false, message: 'Payment was not successful.' });
    }

    const request = await ServiceRequest.findOne({ paymentRef: tx_ref });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Payment transaction not found.' });
    }

    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY || 'CHASECK-TEST-SECRET'}`,
      },
    });

    const verification = await response.json();
    const isVerified = response.ok && verification && verification.status === 'success';

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Chapa verification failed.', details: verification });
    }

    request.status = 'APPROVED_BY_FINANCE';
    request.paymentStatus = 'Verified';
    request.paymentVerifiedAt = new Date();
    request.amountPaid = Number(amount || request.paymentAmount || 0);
    request.currency = currency || 'ETB';
    await request.save();

    if (request.email) {
      await sendApplicationEmail({
        to: request.email,
        subject: 'Payment success for your E-Kebele request',
        text: `Hello ${request.fullName || 'Applicant'},\n\nYour payment for application ${request.applicationId} is now verified. Your request will move to the final processing stage.`,
        html: `<p>Hello ${request.fullName || 'Applicant'},</p><p>Your payment for application <strong>${request.applicationId}</strong> is now verified.</p><p>Your request will move to the final processing stage.</p>`,
      });
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully.', data: request });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
});

// ==========================================
// 2. ራውቶች (Routes)
// ==========================================

router.post('/submit-application', verifyToken, upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'deathCertificate', maxCount: 1 },
  { name: 'applicantPhoto', maxCount: 1 },
  { name: 'divorceDocument', maxCount: 1 },
  { name: 'marriageCertificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'emergencyBirthCertificate', maxCount: 1 },
  { name: 'residenceProof', maxCount: 1 },
  { name: 'husbandPhoto', maxCount: 1 },
  { name: 'wifePhoto', maxCount: 1 },
  { name: 'webcamPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('--- /submit-application incoming request ---');
    console.log('Service type:', req.body.serviceType);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files:', Object.keys(req.files || {}));

    const svc = (req.body.serviceType || '').toUpperCase();
    const applicantEmail = String(req.body.email || '').trim();
    if (applicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
      return res.status(400).json({ success: false, message: 'If you provide an email, it must be a valid email address.' });
    }
    if (['NEW_ID_CARD', 'ID_RENEWAL'].includes(svc)) {
      const requiredIdentityFields = ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'placeOfBirth', 'phoneNumber'];
      if (requiredIdentityFields.some((field) => !String(req.body[field] || '').trim())) {
        return res.status(400).json({ success: false, message: 'First name, middle name, last name, gender, date of birth, place of birth, and phone number are required.' });
      }
      const identityNames = [req.body.firstName, req.body.middleName, req.body.lastName];
      if (identityNames.some((name) => !/^[a-zA-Z\u1200-\u137F\s]+$/.test(String(name).trim()))) {
        return res.status(400).json({ success: false, message: 'Names may contain letters and spaces only.' });
      }
      if (!isValidDateOfBirth(req.body.dateOfBirth)) {
        return res.status(400).json({ success: false, message: 'Date of birth must be valid and produce an age between 0 and 120 years.' });
      }
    }
    if (svc === 'BIRTH_REGISTRATION') {
      if (!req.body.childFullName || !req.body.gender || !req.body.dob || !req.body.pob || !req.body.fatherFullName || !req.body.motherFullName || !req.body.parentIDNumber || !req.body.phone) {
        return res.status(400).json({ success: false, message: 'Missing required birth registration fields' });
      }
      if (!req.files.webcamPhoto) {
        return res.status(400).json({ success: false, message: 'Child photo is required' });
      }
      const birthDate = new Date(req.body.dob);
      const birthNames = [req.body.childFullName, req.body.fatherFullName, req.body.motherFullName];
      if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future' });
      }
      if (birthNames.some((name) => String(name).trim().split(/\s+/).length < 2 || !/^[a-zA-Z\u1200-\u137F\s]+$/.test(String(name).trim()))) {
        return res.status(400).json({ success: false, message: 'Child and parent names must contain at least two letters-only words' });
      }
      if (!/^(09|07)\d{8}$/.test(String(req.body.phone).trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Ethiopian phone number' });
      }
    }
    if (svc === 'MARRIAGE_REGISTRATION') {
      if (!req.body.husbandName || !req.body.wifeName || !req.body.husbandId || !req.body.wifeId || !req.body.marriageDate) {
        return res.status(400).json({ success: false, message: 'Missing required marriage registration fields' });
      }
    }
    if (svc === 'DEATH_REGISTRATION') {
      const requiredDeathFields = ['reporterName', 'phone', 'deceasedName', 'dateOfDeath', 'placeOfDeath', 'region', 'zone', 'woreda', 'kebele'];
      if (requiredDeathFields.some((field) => !String(req.body[field] || '').trim())) {
        return res.status(400).json({ success: false, message: 'Missing required death registration fields' });
      }
      const deathDate = new Date(req.body.dateOfDeath);
      if (Number.isNaN(deathDate.getTime()) || deathDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of death cannot be in the future' });
      }
      if (!/^(09|07)\d{8}$/.test(String(req.body.phone).trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Ethiopian phone number' });
      }
    }
    if (svc === 'DIVORCE_REGISTRATION') {
      const requiredDivorceFields = ['applicantName', 'phoneNumber', 'spouseName', 'spouseIdNumber', 'divorceDate', 'placeOfDivorce', 'region', 'zone', 'woreda', 'kebele'];
      if (requiredDivorceFields.some((field) => !String(req.body[field] || '').trim())) {
        return res.status(400).json({ success: false, message: 'Missing required divorce registration fields' });
      }
      if (!req.files.divorceDocument || !req.files.marriageCertificate) {
        return res.status(400).json({ success: false, message: 'Divorce document and marriage certificate are required' });
      }
      if (new Date(req.body.divorceDate) > new Date() || Number.isNaN(new Date(req.body.divorceDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Divorce date cannot be in the future' });
      }
      if (!/^(09|07)\d{8}$/.test(String(req.body.phoneNumber).trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Ethiopian phone number' });
      }
      if ([req.files.divorceDocument[0], req.files.marriageCertificate[0]].some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype) || file.size > 5 * 1024 * 1024)) {
        return res.status(400).json({ success: false, message: 'Divorce documents must be JPG, PNG, or PDF and smaller than 5 MB.' });
      }
    }

    const activeDuplicate = await findActiveDuplicate(svc, req.body);
    if (activeDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'An active application with the same identification details already exists. Please use the tracker to check its status.',
        applicationId: activeDuplicate.applicationId
      });
    }

    if (['NEW_ID_CARD', 'ID_RENEWAL'].includes(svc)) {
      const identityFilters = getDuplicateIdentityFilters(svc, req.body);
      if (identityFilters.length) {
        const recentDuplicate = await ServiceRequest.findOne({
          serviceType: svc,
          $or: identityFilters,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (recentDuplicate) {
          return res.status(409).json({ success: false, message: 'A matching application was already submitted recently.', applicationId: recentDuplicate.applicationId });
        }
      }
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const applicationId = `EKB-${new Date().getFullYear()}-${randomNum}`;
    const serviceType = svc || 'NEW_ID_CARD';
    const nationalId = req.body.nationalId || req.body.nationalIdOrResidenceNumber || '';

    const newRequest = new ServiceRequest({
      ...req.body,
      fullName: req.body.fullName || req.body.childFullName || req.body.childName || req.body.deceasedName || req.body.reporterName || req.body.applicantName || '',
      phoneNumber: req.body.phoneNumber || req.body.phone || '',
      dateOfBirth: req.body.dateOfBirth || req.body.deceasedDob || '',
      placeOfBirth: req.body.placeOfBirth || req.body.pob || '',
      placeOfBirthRegion: req.body.placeOfBirthRegion || req.body.placeOfBirthRegion || '',
      placeOfBirthZone: req.body.placeOfBirthZone || '',
      placeOfBirthWoreda: req.body.placeOfBirthWoreda || '',
      placeOfBirthKebele: req.body.placeOfBirthKebele || '',
      previousResidenceRegion: req.body.previousResidenceRegion || '',
      previousResidenceZone: req.body.previousResidenceZone || '',
      previousResidenceWoreda: req.body.previousResidenceWoreda || '',
      previousResidenceKebele: req.body.previousResidenceKebele || '',
      previousResidenceAddress: req.body.previousResidenceAddress || '',
      occupation: req.body.occupation || '',
      nationalId,
      userId: String(req.user.id),
      applicationId,
      paymentAmount: getDefaultPayment(serviceType),
      paymentStatus: 'Unpaid',
      status: 'PENDING_OFFICER',
      passportPhoto: req.files['passportPhoto'] ? req.files['passportPhoto'][0].path : '',
      birthCertificate: req.files['birthCertificate'] ? req.files['birthCertificate'][0].path : '',
      deathCertificate: req.files['deathCertificate'] ? req.files['deathCertificate'][0].path : '',
      applicantPhoto: req.files['applicantPhoto'] ? req.files['applicantPhoto'][0].path : '',
      divorceDocument: req.files['divorceDocument'] ? req.files['divorceDocument'][0].path : '',
      marriageCertificate: req.files['marriageCertificate'] ? req.files['marriageCertificate'][0].path : '',
      emergencyBirthCertificate: req.files['emergencyBirthCertificate'] ? req.files['emergencyBirthCertificate'][0].path : '',
      residenceProof: req.files['residenceProof'] ? req.files['residenceProof'][0].path : '',
      husbandPhoto: req.files['husbandPhoto'] ? req.files['husbandPhoto'][0].path : '',
      wifePhoto: req.files['wifePhoto'] ? req.files['wifePhoto'][0].path : '',
      webcamPhoto: req.files['webcamPhoto'] ? req.files['webcamPhoto'][0].path : (req.files.photo ? req.files.photo[0].path : '')
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'ማመልከቻዎ በተሳካ ሁኔታ ተልኳል!',
      applicationId
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ success: false, error: 'Network Error ወይም ሲስተም ላይ ችግር ተፈጥሯል' });
  }
});

router.post('/', createRequest);
router.post('/add', createRequest);

const trackHandler = async (req, res) => {
  try {
    const rawQuery = (req.params.query || req.query.query || req.query.search || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number or application ID.' });
    }

    const query = rawQuery.replace(/^#/, '');
    const phoneVariants = [rawQuery, query];
    if (/^0\d+$/.test(query)) phoneVariants.push(query.slice(1));
    if (/^\d+$/.test(query)) phoneVariants.push(Number(query));

    const filters = [
      { applicationId: rawQuery },
      { applicationId: query },
      { appId: rawQuery },
      { appId: query },
      { accountId: rawQuery },
      { accountId: query },
      { phoneNumber: { $in: phoneVariants } },
      { phone: { $in: phoneVariants } },
      { husbandPhone: { $in: phoneVariants } },
      { wifePhone: { $in: phoneVariants } },
      { nationalId: { $in: phoneVariants } }
    ];
    if (mongoose.isValidObjectId(query)) filters.push({ _id: query });

    const request = await ServiceRequest.findOne({ $or: filters });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get('/track', trackHandler);
router.get('/track/:query', trackHandler);

router.get('/search', async (req, res) => {
  try {
    const rawQuery = (req.query.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, message: 'Query parameter is required.' });
    }

    const query = rawQuery.replace(/^#/, '');
    const phoneVariants = [rawQuery, query];
    if (/^0\d+$/.test(query)) phoneVariants.push(query.slice(1));
    if (/^\d+$/.test(query)) phoneVariants.push(Number(query));
    const filters = [
      { phoneNumber: { $in: phoneVariants } },
      { phone: { $in: phoneVariants } },
      { husbandPhone: { $in: phoneVariants } },
      { wifePhone: { $in: phoneVariants } },
      { nationalId: { $in: phoneVariants } },
      { applicationId: rawQuery },
      { applicationId: query },
      { appId: rawQuery },
      { appId: query },
      { accountId: rawQuery },
      { accountId: query }
    ];

    if (mongoose.isValidObjectId(query)) {
      filters.push({ _id: query });
    }

    const request = await ServiceRequest.findOne({ $or: filters });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/application/:applicationId', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({ applicationId: req.params.applicationId });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/all', verifyRole('admin', 'officer', 'finance', 'verifier', 'vital'), async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    let filteredRequests = requests;

    if (req.user.role === 'verifier') {
      filteredRequests = requests.filter((request) =>
        ['NEW_ID_CARD', 'ID_RENEWAL'].includes(request.serviceType)
      );
    }

    if (req.user.role === 'vital') {
      filteredRequests = requests.filter((request) =>
        ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'].includes(request.serviceType)
      );
    }

    res.status(200).json(filteredRequests);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vital-requests', verifyRole('admin', 'vital'), async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      serviceType: { $in: ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'] }
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// አሁን handleStatusUpdate ከላይ ስለተገለጸ ከዚህ በታች ያሉት ራውቶች በትክክል ይሠሩበታል
router.put('/vital-status/:id', verifyRole('admin', 'vital'), handleStatusUpdate);

router.get('/feedbacks', verifyRole('admin', 'support'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', verifyAdmin, async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format.' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyRole('admin', 'officer', 'finance', 'verifier', 'vital'), handleStatusUpdate);
router.put('/update-status/:id', verifyRole('admin', 'officer', 'finance', 'verifier', 'vital'), handleStatusUpdate);

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedRequest = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!deletedRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.status(200).json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;