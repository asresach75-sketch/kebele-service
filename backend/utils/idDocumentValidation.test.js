const test = require('node:test');
const assert = require('node:assert/strict');
const validateIdApplicationDocuments = require('./idDocumentValidation');

const uploaded = (field) => ({ [field]: [{ filename: `${field}.png`, mimetype: 'image/png' }] });

test('new ID applications require a photo, birth certificate, and residence or housing proof', () => {
  assert.match(validateIdApplicationDocuments('NEW_ID_CARD', {}), /photo/i);
  assert.match(validateIdApplicationDocuments('NEW_ID_CARD', uploaded('webcamPhoto')), /birth certificate/i);
  assert.match(validateIdApplicationDocuments('NEW_ID_CARD', { ...uploaded('webcamPhoto'), ...uploaded('birthCertificate') }), /residence proof or housing proof/i);
  assert.equal(validateIdApplicationDocuments('NEW_ID_CARD', { ...uploaded('passportPhoto'), ...uploaded('birthCertificate'), ...uploaded('residenceProof') }), '');
  assert.equal(validateIdApplicationDocuments('NEW_ID_CARD', { ...uploaded('webcamPhoto'), ...uploaded('birthCertificate'), ...uploaded('housingProof') }), '');
});

test('renewals require a photo but do not require new-ID supporting proof', () => {
  assert.match(validateIdApplicationDocuments('ID_RENEWAL', {}), /photo/i);
  assert.match(validateIdApplicationDocuments('ID_RENEWAL', uploaded('webcamPhoto'), false, true), /select whether/i);
  assert.match(validateIdApplicationDocuments('ID_RENEWAL', uploaded('webcamPhoto'), false, true, 'EXPIRED'), /previous id card/i);
  assert.equal(
    validateIdApplicationDocuments('ID_RENEWAL', { ...uploaded('webcamPhoto'), ...uploaded('previousIdDocument') }, false, true, 'EXPIRED'),
    ''
  );
});

test('renewals require reason-specific evidence and allow a lost-ID report instead of a card copy', () => {
  const photoAndId = { ...uploaded('webcamPhoto'), ...uploaded('previousIdDocument') };
  assert.match(validateIdApplicationDocuments('ID_RENEWAL', photoAndId, false, true, 'LOST'), /police report/i);
  assert.equal(validateIdApplicationDocuments('ID_RENEWAL', {
    ...uploaded('webcamPhoto'),
    ...uploaded('policeReport'),
  }, false, true, 'LOST'), '');
  assert.match(validateIdApplicationDocuments('ID_RENEWAL', photoAndId, false, true, 'DAMAGED'), /damaged id/i);
  assert.equal(validateIdApplicationDocuments('ID_RENEWAL', {
    ...uploaded('webcamPhoto'),
    ...uploaded('damagedIdDocument'),
  }, false, true, 'DAMAGED'), '');
});

test('transfer-only supporting documents are rejected for non-transfer applications', () => {
  assert.match(
    validateIdApplicationDocuments('NEW_ID_CARD', { ...uploaded('webcamPhoto'), ...uploaded('releaseLetter') }),
    /only accepted for transfer/i
  );
  assert.match(
    validateIdApplicationDocuments('ID_RENEWAL', { ...uploaded('webcamPhoto'), ...uploaded('policeClearance') }, true),
    /only accepted for transfer/i
  );
});

test('accepts optional transfer documents for transfer applications', () => {
  assert.equal(
    validateIdApplicationDocuments('NEW_ID_CARD', {
      ...uploaded('webcamPhoto'),
      ...uploaded('birthCertificate'),
      ...uploaded('residenceProof'),
      ...uploaded('releaseLetter'),
      ...uploaded('policeClearance'),
    }, true),
    ''
  );
});