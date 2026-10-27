const test = require('node:test');
const assert = require('node:assert/strict');
const getDigitalIdCardMetadata = require('./digitalIdCardMetadata');

test('uses the completion date and calculates five years of card validity', () => {
  const metadata = getDigitalIdCardMetadata({
    completedAt: new Date('2026-10-13T00:00:00.000Z'),
    paymentVerifiedAt: new Date('2026-10-10T00:00:00.000Z'),
  });

  assert.equal(metadata.issueDate.toISOString(), '2026-10-13T00:00:00.000Z');
  assert.equal(metadata.expiryDate.toISOString(), '2031-10-13T00:00:00.000Z');
});

test('uses a staff name instead of exposing a finance email address', () => {
  assert.equal(
    getDigitalIdCardMetadata({ paymentVerifiedBy: 'Kebede Lemma' }).issuedBy,
    'Kebede Lemma',
  );
  assert.equal(
    getDigitalIdCardMetadata({ paymentVerifiedBy: 'finance@example.com' }).issuedBy,
    'Finance Office',
  );
});

test('does not invent emergency contact details', () => {
  const metadata = getDigitalIdCardMetadata({});

  assert.equal(metadata.emergencyName, 'Not recorded');
  assert.equal(metadata.emergencyPhone, 'Not recorded');
});

test('marks invalid emergency contact details for correction on the card', () => {
  const metadata = getDigitalIdCardMetadata({
    emergencyContactName: 'A B',
    emergencyPhone: 'not-a-phone',
  });

  assert.equal(metadata.emergencyName, 'Update required');
  assert.equal(metadata.emergencyPhone, 'Update required');
});
