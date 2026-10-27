const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const createBirthCertificatePdf = require('./birthCertificatePdf');

test('generates a birth certificate PDF without a QR code', async () => {
  const pdf = await createBirthCertificatePdf({
    applicationId: 'EKB-2026-BR-0001',
    status: 'COMPLETED',
    completedAt: new Date('2026-10-26T07:00:00.000Z'),
    childFullName: 'Example Child',
    gender: 'Female',
    dateOfBirth: '2025-10-01',
    placeOfBirth: 'Bahir Dar',
    fatherFullName: 'Example Father',
    motherFullName: 'Example Mother',
  });

  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(pdf.toString('latin1').includes('/Subtype /Image'), false);
});

test('embeds the uploaded child photo in the certificate PDF', async () => {
  const filename = `certificate-photo-test-${randomUUID()}.png`;
  const photoPath = path.join(__dirname, '..', 'uploads', filename);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=',
    'base64',
  );

  try {
    await fs.writeFile(photoPath, png);
    const pdf = await createBirthCertificatePdf({
      applicationId: 'EKB-2026-BR-PHOTO',
      webcamPhoto: photoPath,
      childFullName: 'Example Child',
    });

    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok((pdf.toString('latin1').match(/\/Subtype \/Image/g) || []).length >= 1);
  } finally {
    await fs.rm(photoPath, { force: true });
  }
});
