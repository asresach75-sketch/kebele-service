const test = require('node:test');
const assert = require('node:assert/strict');
const createDocumentPdf = require('./documentPdf');

test('completed document PDF contains a QR image for online verification', async () => {
  const pdf = await createDocumentPdf({
    applicationId: 'EKB-2026-123456',
    fullName: 'Test Applicant',
    serviceType: 'NEW_ID_CARD',
    status: 'COMPLETED',
    completedAt: new Date('2026-10-03T08:00:00.000Z'),
  });
  const pdfContent = pdf.toString('latin1');

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(pdfContent, /\/Subtype\s*\/Image/);
});

test('uncompleted application PDF does not include an official verification QR', async () => {
  const pdf = await createDocumentPdf({
    applicationId: 'EKB-2026-654321',
    fullName: 'Test Applicant',
    serviceType: 'NEW_ID_CARD',
    status: 'APPROVED_BY_FINANCE',
  });
  const pdfContent = pdf.toString('latin1');

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.doesNotMatch(pdfContent, /\/Subtype\s*\/Image/);
});
