const test = require('node:test');
const assert = require('node:assert/strict');
const createDigitalIdCardPdf = require('./digitalIdCardPdf');

test('formats card names and dates consistently', () => {
  assert.equal(createDigitalIdCardPdf.formatDisplayName('asresach adugna atalay'), 'Asresach Adugna Atalay');
  assert.equal(createDigitalIdCardPdf.formatDisplayName('A B As'), 'Update required');
  assert.equal(createDigitalIdCardPdf.formatCardDate('1996-12-04'), '1996-12-04');
  assert.equal(createDigitalIdCardPdf.formatCardDate('10/14/2031'), '2031-10-14');
  assert.equal(createDigitalIdCardPdf.formatCardDate('invalid'), 'Not recorded');
});

test('creates a digital ID PDF containing its online verification QR code', async () => {
  const pdf = await createDigitalIdCardPdf({
    applicationId: 'EKB-2026-123456',
    nationalId: 'EKB-2026-123456',
    fullName: 'Test Applicant',
    serviceType: 'NEW_ID_CARD',
    status: 'APPROVED_BY_FINANCE',
    paymentVerifiedAt: new Date('2026-10-03T08:00:00.000Z'),
  });
  const pdfContent = pdf.toString('latin1');

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(pdfContent, /\/Subtype\s*\/Image/);
  assert.match(pdfContent, /0\.027450980392156862 0\.5372549019607843 0\.18823529411764706 scn/);
  assert.match(pdfContent, /0\.9882352941176471 0\.8666666666666667 0\.03529411764705882 scn/);
  assert.match(pdfContent, /0\.8549019607843137 0\.07058823529411765 0\.10196078431372549 scn/);
});
