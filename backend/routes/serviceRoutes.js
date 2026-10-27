const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware');
const validateUploadContent = require('../middleware/validateUploadContent');
const ServiceRequest = require('../models/ServiceRequest');
const UserNotification = require('../models/UserNotification');
const Feedback = require('../models/Feedback');
const createDocumentPdf = require('../utils/documentPdf');
const createDigitalIdCardPdf = require('../utils/digitalIdCardPdf');
const sendSMS = require('../utils/sendSMS');
const sendEmail = require('../utils/sendEmail');
const {
  applicationSubmitted,
  applicationStatusUpdated,
} = require('../utils/applicationEmailNotifications');
const getAllowedNextStatus = require('../utils/workflowTransitions');
const assignIssuedNationalId = require('../utils/issuedNationalId');
const writeAuditLog = require('../utils/writeAuditLog');
const { getConfiguredServiceFee } = require('../utils/serviceFees');
const QRCode = require('qrcode');
const { getDocumentVerificationUrl } = require('../utils/documentVerification');
const { getJwtSecret } = require('../utils/securityConfig');
const { getDuplicateIdentityFilters } = require('../utils/applicationIdentity');
const validateIdApplicationDocuments = require('../utils/idDocumentValidation');
const { validateBirthRegistration } = require('../utils/birthRegistrationValidation');
const { isValidEthiopianPhoneNumber, isValidIdApplicantName } = require('../utils/idApplicationInputValidation');
const verifyRenewalId = require('../utils/renewalIdVerification');
const { getRenewalEligibilityError } = require('../utils/renewalEligibility');
const { validateDivorceRegistration } = require('../utils/divorceRegistrationValidation');
const countPortalStatistics = require('../utils/portalStatistics');
const User = require('../models/User');
const { verifyToken, verifyAdmin, verifyRole } = require('../middleware/authMiddleware');

const getOptionalUserId = (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return '';
  try {
    return jwt.verify(token, getJwtSecret()).id || '';
  } catch {
    return '';
  }
};

const notifyApplicantStatus = async (request) => {
  let notificationRequest = request;
  if (!String(notificationRequest.email || '').trim() && mongoose.isValidObjectId(notificationRequest.userId)) {
    try {
      const applicant = await User.findById(notificationRequest.userId).select('email').lean();
      if (applicant?.email) {
        notificationRequest = { ...request.toObject(), email: applicant.email };
      }
    } catch (error) {
      console.error(`Could not resolve recipient email for application ${request.applicationId || request._id}:`, error.message);
    }
  }
  return applicationStatusUpdated(notificationRequest);
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

const recordStatusHistory = (request, status, actorRole, reason = '') => {
  if (!Array.isArray(request.statusHistory)) request.statusHistory = [];
  request.statusHistory.push({ status, changedAt: new Date(), actorRole, reason });
};

const createRequest = async (req, res) => {
  try {
    const newRequest = new ServiceRequest(req.body);
    await newRequest.save();
    await applicationSubmitted(newRequest);
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/feedbacks', async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (name.length > 120 || email.length > 254 || subject.length > 200 || message.length > 5000) {
    return res.status(400).json({ success: false, message: 'Feedback fields exceed the allowed length.' });
  }

  try {
    const feedback = await Feedback.create({ name, email, subject, message });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error('Feedback submission failed:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Please check the feedback details and try again.' });
    }
    return res.status(500).json({ success: false, message: 'Unable to save your feedback right now. Please try again.' });
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

    if (req.user.role === 'verifier' && !['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT'].includes(request.serviceType)) {
      return res.status(403).json({ success: false, message: 'Verifier can only review new ID or renewal applications.' });
    }
    if (req.user.role === 'vital' && !['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'].includes(request.serviceType)) {
      return res.status(403).json({ success: false, message: 'Vital role can only review vital event records.' });
    }

    const previousStatus = request.status;
    let smsNotification = null;
    const normalizedStatus = status.toLowerCase();
    const nextStatus = getAllowedNextStatus({
      role: req.user.role,
      currentStatus: previousStatus,
      requestedStatus: status,
      serviceType: request.serviceType,
    });
    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'This status transition is not allowed for your role or the application current status.' });
    }

    if (req.user.role === 'officer' && ['pending', 'pending_officer'].includes(String(request.status).toLowerCase())) {
      if (nextStatus === 'APPROVED_BY_OFFICER') {
        request.status = nextStatus;
        request.paymentStatus = 'Pending';
        request.correctionReason = '';
        assignIssuedNationalId(request);
        smsNotification = `Hello ${request.fullName || 'Applicant'}; your ${request.serviceType} application ${request.applicationId} was approved by the officer. Please pay through Chapa or Telebirr in the E-Kebele Tracker.`;
      } else if (['needs_correction', 'rejected'].includes(normalizedStatus)) {
        const reason = String(req.body.reason || '').trim();
        if (!reason) {
          return res.status(400).json({ success: false, message: 'A review reason is required.' });
        }
        if (reason.length > 1000) {
          return res.status(400).json({ success: false, message: 'Review reasons must be 1000 characters or fewer.' });
        }
        request.status = nextStatus;
        request.correctionReason = reason;
      } else {
        return res.status(400).json({ success: false, message: 'Officers can only approve, request corrections, or reject pending applications.' });
      }
    } else if (req.user.role === 'finance') {
      if (request.status !== 'PAID_PENDING_FINANCE' && request.status !== 'Payment Verified') {
        return res.status(400).json({ success: false, message: 'Only paid applications can be approved by finance.' });
      }
      if (!['payment verified', 'approved_by_finance'].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: 'Finance can only verify payments.' });
      }
      request.status = nextStatus;
      request.paymentStatus = 'Verified';
      request.paymentVerifiedAt = new Date();
      request.paymentVerifiedBy = req.user.fullName || req.user.email;
      if (nextStatus === 'COMPLETED') {
        request.completedAt = new Date();
        request.completedBy = req.user.fullName || req.user.email;
      }
      smsNotification = nextStatus === 'COMPLETED'
        ? `Congratulations ${request.fullName || 'Applicant'}; your birth registration application ${request.applicationId} is complete. Your birth certificate is ready in the E-Kebele Tracker.`
        : `Congratulations ${request.fullName || 'Applicant'}; payment for application ${request.applicationId} was verified by Finance. The Kebele office will prepare your document.`;
    } else if (req.user.role === 'admin' && ['completed', 'complete'].includes(normalizedStatus)) {
      if (request.status !== 'APPROVED_BY_FINANCE' && request.status !== 'Payment Verified') {
        return res.status(400).json({ success: false, message: 'Only finance-approved applications can be completed.' });
      }
      request.status = nextStatus;
      request.completedAt = new Date();
      request.completedBy = req.user.fullName || req.user.email;
    } else {
      request.status = nextStatus;
      if (nextStatus === 'APPROVED_BY_OFFICER') {
        request.paymentStatus = 'Pending';
        request.correctionReason = '';
      } else if (nextStatus === 'REJECTED') {
        request.correctionReason = String(req.body.reason || '').trim();
      }
    }

    if (request.status !== previousStatus) {
      recordStatusHistory(request, request.status, req.user.role, req.body.reason || '');
    }
    const updatedRequest = await request.save();
    if (smsNotification) {
      await sendSMS(updatedRequest.phoneNumber || updatedRequest.phone, smsNotification, {
        userId: updatedRequest.userId,
        applicationId: updatedRequest.applicationId,
      });
    }
    if (updatedRequest.status !== previousStatus) {
      await writeAuditLog({
        req,
        actor: req.user,
        action: `APPLICATION_${updatedRequest.status}`,
        entityType: 'application',
        entityId: updatedRequest.applicationId || updatedRequest._id,
        details: `Status changed from ${previousStatus} to ${updatedRequest.status}${req.body.reason ? `; review note: ${String(req.body.reason).trim()}` : ''}`,
      });
    }

    if (updatedRequest.status === 'COMPLETED') {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, `${updatedRequest.applicationId}.pdf`);
      const pdfBuffer = await createDocumentPdf(updatedRequest);
      fs.writeFileSync(filePath, pdfBuffer);
    }

    if (updatedRequest.status !== previousStatus) {
      await notifyApplicantStatus(updatedRequest);
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('User notification retrieval failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load your notifications.' });
  }
});

router.post('/payment/initiate', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required.' });
    }

    const request = await ServiceRequest.findOne({ applicationId });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (String(request.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own application.' });
    }

    if (request.status !== 'APPROVED_BY_OFFICER') {
      return res.status(400).json({ success: false, message: 'Payment is available only after officer approval.' });
    }

    const paymentAmount = Number(request.paymentAmount || 0);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid service fee is not configured for this application.' });
    }
    const payerEmail = request.email || req.user.email;
    if (!payerEmail) return res.status(400).json({ success: false, message: 'An email address is required to initialize payment.' });
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
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?query=${encodeURIComponent(request.applicationId)}`,
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
    request.paymentMethod = 'Chapa';
    request.paymentStatus = 'Initiated';
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
    recordStatusHistory(request, request.status, 'citizen');
    await request.save();
    await notifyApplicantStatus(request);

    res.status(200).json({ success: true, message: 'Demo payment completed and sent to Finance.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Demo payment failed.' });
  }
});

router.put(['/workflow/pay/:id', '/pay/:id'], verifyToken, async (req, res) => {
  try {
    const { paymentMethod, paymentPhone, paymentTxRef } = req.body;
    const method = String(paymentMethod || '').trim();
    const reference = String(paymentTxRef || '').trim();
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
    if (request.status !== 'APPROVED_BY_OFFICER') return res.status(400).json({ success: false, message: 'Payment is available only after officer approval.' });
    const paymentAmount = Number(request.paymentAmount || 0);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return res.status(400).json({ success: false, message: 'A valid service fee is not configured for this application.' });

    request.paymentMethod = `${method} (Simulated)`;
    request.paymentPhone = paymentPhone ? String(paymentPhone).trim() : '';
    request.paymentRef = reference;
    request.amountPaid = paymentAmount;
    request.paymentStatus = 'Initiated';
    request.currency = 'ETB';
    request.status = 'PAID_PENDING_FINANCE';
    recordStatusHistory(request, request.status, 'citizen');
    await request.save();
    await notifyApplicantStatus(request);

    res.status(200).json({ success: true, message: 'Payment recorded and sent to Finance for review.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Payment recording failed.' });
  }
});

router.get('/digital-id/:applicationId.pdf', verifyToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      applicationId: req.params.applicationId,
      serviceType: 'NEW_ID_CARD',
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'New ID application not found.' });
    }
    if (String(request.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only download your own digital ID.' });
    }
    if (!['APPROVED_BY_FINANCE', 'COMPLETED'].includes(request.status) || request.paymentStatus !== 'Verified') {
      return res.status(403).json({ success: false, message: 'The digital ID is available after Finance verifies payment.' });
    }

    const service = request.toObject();
    const verifier = String(service.paymentVerifiedBy || '').trim();
    if (verifier.includes('@')) {
      const financeUser = await User.findOne({ email: verifier.toLowerCase() }).select('fullName').lean();
      service.verifiedByName = financeUser?.fullName || 'Finance Office';
    } else {
      service.verifiedByName = verifier || 'Finance Office';
    }

    const pdf = await createDigitalIdCardPdf(service);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="E-Kebele-Digital-ID-${request.applicationId}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('Digital ID PDF generation failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to generate the digital ID PDF.' });
  }
});

router.post('/payment/verify', async (req, res) => {
  try {
    const { tx_ref, status } = req.body;

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
    const alreadyVerified = request.status === 'APPROVED_BY_FINANCE' && request.paymentStatus === 'Verified';
    const alreadySubmittedForFinance = request.status === 'PAID_PENDING_FINANCE'
      && request.paymentStatus === 'Paid - Pending Finance Verification';
    if (!alreadyVerified && !alreadySubmittedForFinance
      && !(['APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE'].includes(request.status)
        && request.paymentStatus === 'Initiated')) {
      return res.status(409).json({ success: false, message: 'Payment cannot be verified from the application current status.' });
    }

    if (alreadyVerified || alreadySubmittedForFinance) {
      return res.status(200).json({
        success: true,
        message: alreadyVerified ? 'Payment was already verified by Finance.' : 'Payment is already waiting for Finance verification.',
      });
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
    const verifiedAmount = Number(verification.data?.amount);
    if (!Number.isFinite(verifiedAmount) || Math.abs(verifiedAmount - Number(request.paymentAmount)) > 0.01) {
      return res.status(400).json({ success: false, message: 'The verified Chapa amount does not match the application service fee.' });
    }
    if (verification.data?.currency && verification.data.currency !== 'ETB') {
      return res.status(400).json({ success: false, message: 'The verified payment currency does not match ETB.' });
    }
    request.status = 'PAID_PENDING_FINANCE';
    request.paymentStatus = 'Paid - Pending Finance Verification';
    request.amountPaid = verifiedAmount;
    request.currency = verification.data?.currency || 'ETB';
    recordStatusHistory(request, request.status, 'payment-gateway');
    await request.save();

    await notifyApplicantStatus(request);

    res.status(200).json({ success: true, message: 'Payment was confirmed by Chapa and sent to Finance for verification.', data: request });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
  }
});

// ==========================================
// 2. ራውቶች (Routes)
// ==========================================

router.post('/submit-application', verifyToken, validateUploadContent(upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'childPhoto', maxCount: 1 },
  { name: 'previousIdDocument', maxCount: 1 },
  { name: 'policeReport', maxCount: 1 },
  { name: 'damagedIdDocument', maxCount: 1 },
  { name: 'releaseLetter', maxCount: 1 },
  { name: 'housingProof', maxCount: 1 },
  { name: 'localLeaderVerification', maxCount: 1 },
  { name: 'policeClearance', maxCount: 1 },
  { name: 'employmentLetter', maxCount: 1 },
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
])), async (req, res) => {
  try {
    console.log('--- /submit-application incoming request ---');
    console.log('Service type:', req.body.serviceType);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files:', Object.keys(req.files || {}));

    const svc = (req.body.serviceType || '').toUpperCase();
    let identityVerificationStatus = 'NOT_REQUIRED';
    const submittedEmail = String(req.body.email || '').trim();
    const requiresApplicantEmail = ['NEW_ID_CARD', 'ID_RENEWAL'].includes(svc);
    if (requiresApplicantEmail && !submittedEmail) {
      return res.status(400).json({ success: false, message: 'An email address is required for an ID application.' });
    }
    if (submittedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) {
      return res.status(400).json({ success: false, message: 'If you provide an email, it must be a valid email address.' });
    }
    if (['NEW_ID_CARD', 'ID_RENEWAL'].includes(svc)) {
      const requiredIdentityFields = ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber'];
      if (svc === 'NEW_ID_CARD') requiredIdentityFields.push('placeOfBirth');
      if (requiredIdentityFields.some((field) => !String(req.body[field] || '').trim())) {
        return res.status(400).json({ success: false, message: 'First name, middle name, last name, gender, date of birth, and phone number are required. New ID applications also require place of birth.' });
      }
      const identityNames = [req.body.firstName, req.body.middleName, req.body.lastName];
      if (identityNames.some((name) => !isValidIdApplicantName(name))) {
        return res.status(400).json({ success: false, message: 'Each name must contain at least 3 letters and may contain letters and spaces only.' });
      }
      if (!isValidEthiopianPhoneNumber(req.body.phoneNumber)) {
        return res.status(400).json({ success: false, message: 'Phone number must be a valid Ethiopian number starting with 09, 07, +2519, or +2517.' });
      }
      const emergencyContactName = String(req.body.emergencyContactName || '').trim();
      const emergencyPhone = String(req.body.emergencyPhone || '').trim();
      if (emergencyContactName && !isValidIdApplicantName(emergencyContactName)) {
        return res.status(400).json({ success: false, message: 'Emergency contact name must contain at least 3 letters in each name part and may contain letters and spaces only.' });
      }
      if (emergencyPhone && !isValidEthiopianPhoneNumber(emergencyPhone)) {
        return res.status(400).json({ success: false, message: 'Emergency phone must be a valid Ethiopian number starting with 09, 07, +2519, or +2517.' });
      }
      if (!isValidDateOfBirth(req.body.dateOfBirth)) {
        return res.status(400).json({ success: false, message: 'Date of birth must be valid and produce an age between 0 and 120 years.' });
      }
      const documentValidationError = validateIdApplicationDocuments(
        svc,
        req.files,
        String(req.body.isTransfer || '').toLowerCase() === 'true',
        Boolean(String(req.body.nationalId || '').trim()),
        String(req.body.renewalReason || '').trim().toUpperCase()
      );
      if (documentValidationError) {
        await Promise.all(Object.values(req.files || {}).flat().map(async (file) => {
          try {
            await fs.promises.unlink(file.path);
          } catch (cleanupError) {
            if (cleanupError.code !== 'ENOENT') {
              console.error('Failed to remove invalid ID application upload:', cleanupError.message);
            }
          }
        }));
        return res.status(400).json({ success: false, message: documentValidationError });
      }
      if (svc === 'ID_RENEWAL') {
        const previousNationalId = String(req.body.nationalId || '').trim();
        if (previousNationalId.length > 64) {
          return res.status(400).json({ success: false, message: 'Previous national ID number is too long.' });
        }
        const identityCheck = await verifyRenewalId(ServiceRequest, {
          nationalId: previousNationalId,
          fullName: [req.body.firstName, req.body.middleName, req.body.lastName].join(' '),
          dateOfBirth: req.body.dateOfBirth,
        });
        if (identityCheck.status === 'MISMATCH') {
          await Promise.all(Object.values(req.files || {}).flat().map(async (file) => {
            try {
              await fs.promises.unlink(file.path);
            } catch (cleanupError) {
              if (cleanupError.code !== 'ENOENT') {
                console.error('Failed to remove rejected renewal upload:', cleanupError.message);
              }
            }
          }));
          return res.status(400).json({
            success: false,
            message: 'The previous ID number does not match the applicant name and date of birth.'
          });
        }
        const renewalEligibilityError = getRenewalEligibilityError({
          reason: String(req.body.renewalReason || '').trim().toUpperCase(),
          providedExpiryDate: req.body.idExpiryDate,
          registeredExpiryDate: identityCheck.idExpiryDate,
        });
        if (renewalEligibilityError) {
          await Promise.all(Object.values(req.files || {}).flat().map(async (file) => {
            try {
              await fs.promises.unlink(file.path);
            } catch (cleanupError) {
              if (cleanupError.code !== 'ENOENT') {
                console.error('Failed to remove ineligible renewal upload:', cleanupError.message);
              }
            }
          }));
          return res.status(400).json({ success: false, message: renewalEligibilityError });
        }
        identityVerificationStatus = identityCheck.status;
      }
    }
    if (svc === 'BIRTH_REGISTRATION') {
      const files = Object.values(req.files || {}).flat();
      const rejectBirthRequest = async (message) => {
        await Promise.all(files.map(async (file) => {
          try {
            await fs.promises.unlink(file.path);
          } catch (cleanupError) {
            if (cleanupError.code !== 'ENOENT') {
              console.error('Failed to remove rejected birth registration upload:', cleanupError.message);
            }
          }
        }));
        return res.status(400).json({ success: false, message });
      };
      if (!req.body.childFullName || !req.body.gender || !req.body.dob || !req.body.pob
        || !req.body.fatherFullName || !req.body.fatherDob
        || !req.body.motherFullName || !req.body.motherDob
        || !req.body.parentIDNumber || !req.body.phone) {
        return rejectBirthRequest('Missing required birth registration fields');
      }
      const birthPhoto = req.files.webcamPhoto?.[0] || req.files.childPhoto?.[0];
      if (!birthPhoto) {
        return rejectBirthRequest('Child photo is required');
      }
      const birthNames = [req.body.childFullName, req.body.fatherFullName, req.body.motherFullName];
      if (birthNames.some((name) => String(name).trim().split(/\s+/).length < 2 || !/^[a-zA-Z\u1200-\u137F\s]+$/.test(String(name).trim()))) {
        return rejectBirthRequest('Child and parent names must contain at least two letters-only words');
      }
      if (!/^(09|07)\d{8}$/.test(String(req.body.phone).trim())) {
        return rejectBirthRequest('Please provide a valid Ethiopian phone number');
      }
      const hospitalDocument = req.files.birthCertificate?.[0];
      const childPhoto = birthPhoto;
      if (hospitalDocument && (
        !['application/pdf', 'image/jpeg', 'image/png'].includes(hospitalDocument.mimetype)
        || hospitalDocument.size > 5 * 1024 * 1024
      )) {
        return rejectBirthRequest('Birth notification must be PDF, JPG, or PNG and no larger than 5 MB.');
      }
      if (!['image/jpeg', 'image/png'].includes(childPhoto.mimetype) || childPhoto.size > 2 * 1024 * 1024) {
        return rejectBirthRequest('Child photo must be JPG or PNG and no larger than 2 MB.');
      }
      const birthValidationError = await validateBirthRegistration(ServiceRequest, {
        childFullName: req.body.childFullName,
        fatherFullName: req.body.fatherFullName,
        fatherDob: req.body.fatherDob,
        motherFullName: req.body.motherFullName,
        motherDob: req.body.motherDob,
        parentIDNumber: req.body.parentIDNumber,
        dateOfBirth: req.body.dob,
      });
      if (birthValidationError) {
        return rejectBirthRequest(birthValidationError);
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
      const divorceFiles = Object.values(req.files || {}).flat();
      const rejectDivorceRequest = async (message) => {
        await Promise.all(divorceFiles.map(async (file) => {
          try {
            await fs.promises.unlink(file.path);
          } catch (cleanupError) {
            if (cleanupError.code !== 'ENOENT') {
              console.error('Failed to remove rejected divorce registration upload:', cleanupError.message);
            }
          }
        }));
        return res.status(400).json({ success: false, message });
      };
      const requiredDivorceFields = ['applicantName', 'phoneNumber', 'spouseName', 'spouseIdNumber', 'divorceDate', 'placeOfDivorce', 'region', 'zone', 'woreda', 'kebele'];
      if (requiredDivorceFields.some((field) => !String(req.body[field] || '').trim())) {
        return rejectDivorceRequest('Missing required divorce registration fields');
      }
      if (!req.files.divorceDocument?.[0]) {
        return rejectDivorceRequest('A court divorce decision document is required.');
      }
      if (!req.files.marriageCertificate?.[0] && !String(req.body.marriageRegistrationNumber || '').trim()) {
        return rejectDivorceRequest('Upload the marriage certificate or enter its registration number.');
      }
      if (!/^(09|07)\d{8}$/.test(String(req.body.phoneNumber).trim())) {
        return rejectDivorceRequest('Please provide a valid Ethiopian phone number');
      }
      if (divorceFiles.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype) || file.size > 5 * 1024 * 1024)) {
        return rejectDivorceRequest('Divorce documents must be JPG, PNG, or PDF and smaller than 5 MB.');
      }
      const divorceValidationError = await validateDivorceRegistration(ServiceRequest, req.body);
      if (divorceValidationError) {
        return rejectDivorceRequest(divorceValidationError);
      }
    }

    const activeDuplicate = await findActiveDuplicate(svc, req.body);
    if (activeDuplicate) {
      await Promise.all(Object.values(req.files || {}).flat().map(async (file) => {
        try {
          await fs.promises.unlink(file.path);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') {
            console.error('Failed to remove duplicate application upload:', cleanupError.message);
          }
        }
      }));
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
    const applicant = await User.findById(req.user.id).select('email');
    const authenticatedEmail = String(applicant?.email || req.user.email || '').trim().toLowerCase();

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
      identityVerificationStatus,
      email: submittedEmail ? submittedEmail.toLowerCase() : authenticatedEmail,
      userId: String(req.user.id),
      applicationId,
      paymentAmount: await getConfiguredServiceFee(serviceType),
      paymentStatus: 'Unpaid',
      status: 'PENDING_OFFICER',
      passportPhoto: req.files['passportPhoto'] ? req.files['passportPhoto'][0].path : '',
      previousIdDocument: req.files['previousIdDocument'] ? req.files['previousIdDocument'][0].path : '',
      policeReport: req.files['policeReport'] ? req.files['policeReport'][0].path : '',
      damagedIdDocument: req.files['damagedIdDocument'] ? req.files['damagedIdDocument'][0].path : '',
      releaseLetter: req.files['releaseLetter'] ? req.files['releaseLetter'][0].path : '',
      housingProof: req.files['housingProof'] ? req.files['housingProof'][0].path : '',
      localLeaderVerification: req.files['localLeaderVerification'] ? req.files['localLeaderVerification'][0].path : '',
      policeClearance: req.files['policeClearance'] ? req.files['policeClearance'][0].path : '',
      employmentLetter: req.files['employmentLetter'] ? req.files['employmentLetter'][0].path : '',
      birthCertificate: req.files['birthCertificate'] ? req.files['birthCertificate'][0].path : '',
      deathCertificate: req.files['deathCertificate'] ? req.files['deathCertificate'][0].path : '',
      applicantPhoto: req.files['applicantPhoto'] ? req.files['applicantPhoto'][0].path : '',
      divorceDocument: req.files['divorceDocument'] ? req.files['divorceDocument'][0].path : '',
      marriageCertificate: req.files['marriageCertificate'] ? req.files['marriageCertificate'][0].path : '',
      emergencyBirthCertificate: req.files['emergencyBirthCertificate'] ? req.files['emergencyBirthCertificate'][0].path : '',
      residenceProof: req.files['residenceProof'] ? req.files['residenceProof'][0].path : '',
      husbandPhoto: req.files['husbandPhoto'] ? req.files['husbandPhoto'][0].path : '',
      wifePhoto: req.files['wifePhoto'] ? req.files['wifePhoto'][0].path : '',
      webcamPhoto: req.files['webcamPhoto'] ? req.files['webcamPhoto'][0].path
        : (req.files.childPhoto ? req.files.childPhoto[0].path : (req.files.photo ? req.files.photo[0].path : ''))
    });

    await newRequest.save();
    await applicationSubmitted(newRequest);

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

router.put('/correction/:applicationId', verifyToken, validateUploadContent(upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'previousIdDocument', maxCount: 1 },
  { name: 'webcamPhoto', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'residenceProof', maxCount: 1 },
  { name: 'releaseLetter', maxCount: 1 },
  { name: 'housingProof', maxCount: 1 },
  { name: 'localLeaderVerification', maxCount: 1 },
  { name: 'policeClearance', maxCount: 1 },
  { name: 'employmentLetter', maxCount: 1 },
  { name: 'emergencyBirthCertificate', maxCount: 1 }
])), async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({ applicationId: req.params.applicationId });
    if (!request) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (String(request.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own application.' });
    }
    if (request.status !== 'NEEDS_CORRECTION') {
      return res.status(409).json({ success: false, message: 'This application is not waiting for corrections.' });
    }

    const replacementFields = [
      'passportPhoto', 'previousIdDocument', 'webcamPhoto', 'birthCertificate', 'residenceProof',
      'releaseLetter', 'housingProof', 'localLeaderVerification', 'policeClearance',
      'employmentLetter', 'emergencyBirthCertificate'
    ];
    const suppliedFields = replacementFields.filter((field) => req.files?.[field]?.[0]);
    if (!suppliedFields.length) {
      return res.status(400).json({ success: false, message: 'Upload at least one replacement document.' });
    }
    const transferOnlyFields = suppliedFields.filter((field) => ['releaseLetter', 'policeClearance'].includes(field));
    if (transferOnlyFields.length && (request.serviceType !== 'NEW_ID_CARD' || !request.isTransfer)) {
      const transferFiles = transferOnlyFields.flatMap((field) => req.files[field] || []);
      await Promise.all(transferFiles.map(async (file) => {
        try {
          await fs.promises.unlink(file.path);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') {
            console.error('Failed to remove an unsupported correction upload:', cleanupError.message);
          }
        }
      }));
      return res.status(400).json({
        success: false,
        message: 'Release letters and police clearances are only accepted for transfer applications.'
      });
    }

    suppliedFields.forEach((field) => {
      request[field] = req.files[field][0].path;
    });
    request.status = 'PENDING_OFFICER';
    request.correctionReason = '';
    recordStatusHistory(request, request.status, 'citizen', 'Correction documents resubmitted');
    await request.save();
    await notifyApplicantStatus(request);
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    const responseRequest = request.toObject();
    if (
      responseRequest.serviceType === 'NEW_ID_CARD'
      && responseRequest.paymentStatus === 'Verified'
      && responseRequest.paymentVerifiedBy
    ) {
      const verifier = String(responseRequest.paymentVerifiedBy).trim();
      if (verifier.includes('@')) {
        const financeUser = await User.findOne({ email: verifier.toLowerCase() }).select('fullName').lean();
        responseRequest.verifiedByName = financeUser?.fullName || 'Finance Office';
      } else {
        responseRequest.verifiedByName = verifier;
      }
    }

    res.status(200).json({ success: true, data: responseRequest });
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
    const request = await ServiceRequest.findOne({
      applicationId: req.params.applicationId,
      serviceType: { $in: ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION'] },
    }).select([
      'applicationId serviceType status createdAt registrationDate registrarName',
      'childFullName childName fullName gender childGender webcamPhoto',
      'fatherFullName fatherName fatherNationality motherFullName motherName motherNationality',
      'dob dateOfBirth pob placeOfBirth region zone wereda woreda country phone phoneNumber',
      'husbandPhoto husbandName husbandId husbandPhone wifePhoto wifeName wifeId wifePhone',
      'marriageType marriageDate placeOfMarriage witness1Name husbandWitness witness1Id',
      'witness2Name wifeWitness witness2Id witness3Name thirdWitness witness3Id',
    ].join(' ')).lean();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (request.status !== 'COMPLETED') {
      return res.status(403).json({ success: false, message: 'The certificate is available only after the application is completed.' });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/verify-document/:applicationId/qr', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      applicationId: req.params.applicationId,
      serviceType: { $in: ['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT'] },
      $or: [
        { status: 'COMPLETED' },
        { status: 'APPROVED_BY_FINANCE', paymentStatus: 'Verified' },
      ],
    }).select('applicationId');
    if (!request) return res.status(404).json({ success: false, message: 'No issued ID matches this verification code.' });

    const qrCode = await QRCode.toBuffer(getDocumentVerificationUrl(request.applicationId), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 480,
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(qrCode);
  } catch (error) {
    console.error('Document QR generation failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to generate the verification QR code.' });
  }
});

router.get('/verify-document/:applicationId', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      applicationId: req.params.applicationId,
      $or: [
        { status: 'COMPLETED' },
        {
          serviceType: 'NEW_ID_CARD',
          status: 'APPROVED_BY_FINANCE',
          paymentStatus: 'Verified',
        },
      ],
    }).select('applicationId serviceType status fullName nationalId completedAt paymentVerifiedAt updatedAt');

    if (!request) {
      return res.status(404).json({
        verified: false,
        message: 'No completed document matches this verification code.',
      });
    }

    const issuedAt = request.completedAt || request.paymentVerifiedAt || request.updatedAt;
    const hasExpiry = ['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT'].includes(request.serviceType);
    const expiresAt = issuedAt && hasExpiry ? new Date(issuedAt) : null;
    if (expiresAt) expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    return res.status(200).json({
      verified: true,
      applicationId: request.applicationId,
      nationalId: request.nationalId || request.applicationId,
      fullName: request.fullName || null,
      serviceType: request.serviceType,
      status: request.status,
      issuedAt,
      expiresAt,
    });
  } catch (error) {
    console.error('Document verification failed:', error.message);
    return res.status(500).json({ verified: false, message: 'Unable to verify this document right now.' });
  }
});

router.get('/public-statistics', async (_req, res) => {
  try {
    const statistics = await countPortalStatistics(User, ServiceRequest);
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('Public portal statistics failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load portal statistics.' });
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

router.post('/feedbacks/:id/reply', verifyAdmin, async (req, res) => {
  const reply = String(req.body?.reply || '').trim();
  if (!reply) {
    return res.status(400).json({ success: false, message: 'Reply message is required.' });
  }
  if (reply.length > 5000) {
    return res.status(400).json({ success: false, message: 'Reply message must be 5000 characters or fewer.' });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid feedback ID.' });
  }

  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    const recipient = String(feedback.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return res.status(400).json({ success: false, message: 'This feedback does not have a valid email address.' });
    }

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character]));
    const subject = String(feedback.subject || 'Your feedback').replace(/[\r\n]+/g, ' ').trim();
    const name = String(feedback.name || 'there').replace(/[\r\n]+/g, ' ').trim();
    const normalizedReply = reply.replace(/\s+/g, ' ');
    const compactReplies = [];
    for (const savedReply of feedback.replies) {
      if (['pending', 'failed'].includes(savedReply.status)) {
        const duplicateIndex = compactReplies.findIndex((existingReply) => (
          ['pending', 'failed'].includes(existingReply.status)
          && String(existingReply.repliedBy || '') === String(savedReply.repliedBy || '')
          && String(existingReply.message || '').trim().replace(/\s+/g, ' ') === String(savedReply.message || '').trim().replace(/\s+/g, ' ')
        ));
        if (duplicateIndex !== -1) compactReplies.splice(duplicateIndex, 1);
      }
      compactReplies.push(savedReply);
    }
    feedback.replies = compactReplies;
    const lastReply = feedback.replies[feedback.replies.length - 1];
    const isRetry = lastReply
      && ['pending', 'failed'].includes(lastReply.status)
      && String(lastReply.message || '').trim().replace(/\s+/g, ' ') === normalizedReply;
    const replyRecord = isRetry
      ? lastReply
      : feedback.replies.create({
        message: reply,
        repliedBy: String(req.user.id || ''),
        repliedByName: String(req.user.fullName || ''),
        status: 'pending',
      });
    replyRecord.message = reply;
    replyRecord.repliedBy = String(req.user.id || '');
    replyRecord.repliedByName = String(req.user.fullName || '');
    replyRecord.status = 'pending';
    replyRecord.failureReason = '';
    replyRecord.sentAt = null;
    if (!isRetry) {
      feedback.replies.push(replyRecord);
    }
    feedback.status = feedback.replies.some((savedReply) => savedReply.status === 'sent') ? 'replied' : 'pending';
    await feedback.save();

    let deliveryError = null;
    try {
      await sendEmail({
        email: recipient,
        subject: `Response to your E-Kebele feedback: ${subject}`,
        message: `Hello ${name},\n\n${reply}\n\nRegards,\nE-Kebele Support Team`,
        html: `<p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(reply).replaceAll('\n', '<br>')}</p><p>Regards,<br>E-Kebele Support Team</p>`,
      });
    } catch (error) {
      deliveryError = error;
    }

    if (deliveryError) {
      console.error(`Feedback reply email failed for feedback ${feedback._id}:`, deliveryError.message);
      replyRecord.status = 'failed';
      replyRecord.failureReason = deliveryError.message.startsWith('Email credentials are not configured.')
        ? 'email_not_configured'
        : 'delivery_failed';
      feedback.status = feedback.replies.some((savedReply) => savedReply.status === 'sent') ? 'replied' : 'pending';
      await feedback.save();
      await writeAuditLog({
        req,
        actor: req.user,
        action: 'FEEDBACK_REPLY_SAVED',
        entityType: 'feedback',
        entityId: feedback._id,
        details: `Admin reply saved, but email delivery failed (${replyRecord.failureReason}).`,
      });
      return res.status(202).json({
        success: true,
        emailAccepted: false,
        reply: replyRecord,
        message: replyRecord.failureReason === 'email_not_configured'
          ? 'Reply saved, but email was not sent because email delivery is not configured.'
          : 'Reply saved, but the email could not be delivered. Check email settings and retry.',
      });
    }

    replyRecord.status = 'sent';
    replyRecord.sentAt = new Date();
    feedback.status = 'replied';
    await feedback.save();
    await writeAuditLog({
      req,
      actor: req.user,
      action: 'FEEDBACK_REPLY_ACCEPTED',
      entityType: 'feedback',
      entityId: feedback._id,
      details: `Email provider accepted the reply for ${recipient}; inbox delivery is not confirmed.`,
    });
    return res.status(200).json({
      success: true,
      emailAccepted: true,
      reply: replyRecord,
    message: 'The email provider accepted the reply. Inbox delivery is not confirmed; check the provider logs for delivery status.',
    });
  } catch (error) {
    console.error('Feedback reply failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to send the feedback reply.' });
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