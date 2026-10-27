const path = require('path');

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

const isAllowedUpload = (file) => {
  const extension = path.extname(String(file?.originalname || '')).toLowerCase();
  return ALLOWED_UPLOAD_TYPES[extension] === file?.mimetype;
};

const isValidFileSignature = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === 'application/pdf') {
    return buffer.subarray(0, 5).equals(Buffer.from('%PDF-'));
  }
  return false;
};

module.exports = {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_SIZE,
  isAllowedUpload,
  isValidFileSignature,
};
