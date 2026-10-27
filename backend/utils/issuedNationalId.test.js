const test = require('node:test');
const assert = require('node:assert/strict');
const assignIssuedNationalId = require('./issuedNationalId');

test('assigns the unique E-Kebele application number as the new ID number on approval', () => {
  const request = {
    serviceType: 'NEW_ID_CARD',
    applicationId: 'EKB-2026-123456',
    nationalId: '',
  };

  assert.equal(assignIssuedNationalId(request), true);
  assert.equal(request.nationalId, 'EKB-2026-123456');
});

test('does not replace an existing ID number or issue one for other services', () => {
  const existingIdRequest = {
    serviceType: 'NEW_ID_CARD',
    applicationId: 'EKB-2026-123456',
    nationalId: 'EXISTING-ID',
  };
  const renewalRequest = {
    serviceType: 'ID_RENEWAL',
    applicationId: 'EKB-2026-654321',
    nationalId: '',
  };

  assert.equal(assignIssuedNationalId(existingIdRequest), false);
  assert.equal(existingIdRequest.nationalId, 'EXISTING-ID');
  assert.equal(assignIssuedNationalId(renewalRequest), false);
  assert.equal(renewalRequest.nationalId, '');
});

test('rejects malformed application IDs rather than issuing an invalid ID number', () => {
  assert.throws(() => assignIssuedNationalId({
    serviceType: 'NEW_ID_CARD',
    applicationId: 'invalid',
    nationalId: '',
  }), /application ID is invalid/);
});
