const express = require('express');
const fs = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { applicationSubmitted } = require('../utils/applicationEmailNotifications');
const { getConfiguredServiceFee } = require('../utils/serviceFees');
const validateUploadContent = require('../middleware/validateUploadContent');
const { isAllowedUpload, MAX_UPLOAD_SIZE } = require('../utils/uploadValidation');
const { validateMarriageRegistration } = require('../utils/marriageRegistrationValidation');

const findActiveMarriageDuplicate = async (body) => {
  const identityFilters = [
    body.husbandId && { husbandId: new RegExp(`^${String(body.husbandId).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    body.wifeId && { wifeId: new RegExp(`^${String(body.wifeId).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  ].filter(Boolean);

  if (!identityFilters.length) return null;

  return ServiceRequest.findOne({
    serviceType: 'MARRIAGE_REGISTRATION',
    status: { $nin: ['COMPLETED', 'REJECTED', 'Approved', 'Rejected'] },
    $or: identityFilters
  }).sort({ createdAt: -1 });
};

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'marriage_docs');
fs.mkdirSync(uploadDirectory, { recursive: true });

const marriageStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const marriageUploadMiddleware = multer({
  storage: marriageStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, callback) => {
    if (isAllowedUpload(file)) {
      return callback(null, true);
    }
    return callback(new Error('Only image files and PDF documents are allowed.'));
  }
});

const marriageUpload = validateUploadContent(marriageUploadMiddleware.fields([
  { name: 'husbandPhoto', maxCount: 1 },
  { name: 'wifePhoto', maxCount: 1 },
  { name: 'marriageCertPhoto', maxCount: 1 },
  { name: 'witness1IdDocument', maxCount: 1 },
  { name: 'witness2IdDocument', maxCount: 1 },
  { name: 'witness3IdDocument', maxCount: 1 }
]));

router.post('/marriage-registration', verifyToken, (req, res) => {
  marriageUpload(req, res, async (uploadError) => {
    if (uploadError) {
      console.error('Marriage upload error:', uploadError);
      return res.status(400).json({
        success: false,
        message: uploadError.code === 'LIMIT_FILE_SIZE'
          ? 'Each file must be no larger than 5 MB.'
          : uploadError.message || 'Unable to upload the marriage documents.'
      });
    }

    try {
    const requiredFields = [
      'husbandName', 'husbandId', 'husbandDob', 'husbandPhone',
      'wifeName', 'wifeId', 'wifeDob', 'wifePhone',
      'marriageType', 'marriageDate', 'placeOfMarriage',
      'witness1Name', 'witness1Phone', 'witness1Id',
      'witness2Name', 'witness2Phone', 'witness2Id',
      'witness3Name', 'witness3Phone', 'witness3Id'
    ];
    const missingField = requiredFields.find((field) => !req.body[field]);
    const files = req.files || {};
    const removeUploadedFiles = async () => {
      await Promise.all(Object.values(files).flat().map(async (file) => {
        try {
          await fs.promises.unlink(file.path);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') throw cleanupError;
        }
      }));
    };

    if (missingField) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: `${missingField} is required.` });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email || '').trim())) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: 'A valid email address is required for application notifications.' });
    }
    const requiredFiles = ['husbandPhoto', 'wifePhoto', 'marriageCertPhoto', 'witness1IdDocument', 'witness2IdDocument', 'witness3IdDocument'];
    const missingFile = requiredFiles.find((field) => !files[field]?.[0]);
    if (missingFile) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: `${missingFile} is required.` });
    }

    const nameFields = ['husbandName', 'wifeName', 'witness1Name', 'witness2Name', 'witness3Name'];
    const phoneFields = ['husbandPhone', 'wifePhone', 'witness1Phone', 'witness2Phone', 'witness3Phone'];
    if (nameFields.some((field) => String(req.body[field]).trim().split(/\s+/).length < 2 || !/^[a-zA-Z\u1200-\u137F\s]+$/.test(String(req.body[field]).trim()))) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: 'All names must contain at least two letters-only words.' });
    }
    if (phoneFields.some((field) => !/^(09|07)\d{8}$/.test(String(req.body[field]).trim()))) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: 'All phone numbers must be valid Ethiopian numbers.' });
    }
    if (Object.values(files).flat().some((file) => !['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype) || file.size > MAX_UPLOAD_SIZE)) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: 'Files must be JPG, PNG, or PDF and smaller than 5 MB.' });
    }
    if (['husbandPhoto', 'wifePhoto'].some((field) => (
      !['image/jpeg', 'image/png'].includes(files[field][0].mimetype)
    ))) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: 'Husband and wife photos must be JPG or PNG images.' });
    }

    const identityValidationError = await validateMarriageRegistration(ServiceRequest, req.body);
    if (identityValidationError) {
      await removeUploadedFiles();
      return res.status(400).json({ success: false, message: identityValidationError });
    }

    const activeDuplicate = await findActiveMarriageDuplicate(req.body);
    if (activeDuplicate) {
      await removeUploadedFiles();
      return res.status(409).json({
        success: false,
        message: 'An active marriage application with the same identification number already exists. Please use the tracker to check its status.',
        applicationId: activeDuplicate.applicationId
      });
    }

    const existingRequest = await ServiceRequest.findOne({
      serviceType: 'MARRIAGE_REGISTRATION',
      husbandId: req.body.husbandId,
      wifeId: req.body.wifeId,
      marriageDate: req.body.marriageDate
    });
    if (existingRequest) {
      await removeUploadedFiles();
      return res.status(409).json({ success: false, message: 'This marriage registration has already been submitted.' });
    }

    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const applicationId = `EKB-${new Date().getFullYear()}-${randomNumber}`;
    const applicant = await User.findById(req.user.id).select('email');
    const request = new ServiceRequest({
      ...req.body,
      serviceType: 'MARRIAGE_REGISTRATION',
      applicationId,
      email: String(applicant?.email || req.user.email || '').trim().toLowerCase(),
      paymentAmount: await getConfiguredServiceFee('MARRIAGE_REGISTRATION'),
      paymentStatus: 'Unpaid',
      status: 'PENDING_OFFICER',
      userId: String(req.user.id),
      husbandPhoto: files.husbandPhoto[0].path,
      wifePhoto: files.wifePhoto[0].path,
      marriageCertPhoto: files.marriageCertPhoto[0].path,
      witness1IdDocument: files.witness1IdDocument[0].path,
      witness2IdDocument: files.witness2IdDocument[0].path,
      witness3IdDocument: files.witness3IdDocument[0].path
    });

    await request.save();
    await applicationSubmitted(request);
    return res.status(201).json({
      success: true,
      message: 'Marriage registered successfully.',
      applicationId
    });
  } catch (error) {
    console.error('Marriage registration error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error processing marriage registration.' });
  }
  });
});

module.exports = router;
