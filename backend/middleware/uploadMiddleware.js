const multer = require('multer');
const { randomUUID } = require('crypto');
const path = require('path');
const { isAllowedUpload, MAX_UPLOAD_SIZE } = require('../utils/uploadValidation');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    if (isAllowedUpload(file)) {
      cb(null, true);
    } else {
      const error = new Error('Unsupported file type. Only JPEG, PNG, and PDF are allowed.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      cb(error);
    }
  }
});

module.exports = upload;
