const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_UPLOAD_SIZE,
  isAllowedUpload,
  isValidFileSignature,
} = require('./uploadValidation');

test('accepts only exact supported extension and MIME type pairs', () => {
  assert.equal(isAllowedUpload({ originalname: 'photo.JPG', mimetype: 'image/jpeg' }), true);
  assert.equal(isAllowedUpload({ originalname: 'document.pdf', mimetype: 'application/pdf' }), true);
  assert.equal(isAllowedUpload({ originalname: 'photo.jpg', mimetype: 'application/pdf' }), false);
  assert.equal(isAllowedUpload({ originalname: 'photo.jpg.exe', mimetype: 'image/jpeg' }), false);
  assert.equal(isAllowedUpload({ originalname: 'photo.gif', mimetype: 'image/gif' }), false);
});

test('limits uploaded documents to 5 MiB', () => {
  assert.equal(MAX_UPLOAD_SIZE, 5 * 1024 * 1024);
});

test('validates file signatures against declared MIME types', () => {
  assert.equal(isValidFileSignature(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(isValidFileSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'), true);
  assert.equal(isValidFileSignature(Buffer.from('%PDF-1.7'), 'application/pdf'), true);
  assert.equal(isValidFileSignature(Buffer.from('not a pdf'), 'application/pdf'), false);
  assert.equal(isValidFileSignature(Buffer.from('%PDF-1.7'), 'image/jpeg'), false);
});
