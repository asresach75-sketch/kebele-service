const test = require('node:test');
const assert = require('node:assert/strict');
const verifyRenewalId = require('./renewalIdVerification');

const createRequestModel = (record, expectedNationalId = 'EKB-2025-123456') => ({
  findOne(query) {
    assert.deepEqual(query, {
      serviceType: 'NEW_ID_CARD',
      nationalId: expectedNationalId,
      status: 'COMPLETED',
    });
    return {
      select(fields) {
        assert.equal(fields, 'firstName middleName lastName fullName dateOfBirth idExpiryDate');
        return Promise.resolve(record);
      },
    };
  },
});

test('marks completed issued IDs as verified when name and birth date match', async () => {
  const result = await verifyRenewalId(createRequestModel({
    firstName: 'Abebe',
    middleName: 'Kebede',
    lastName: 'Bekele',
    dateOfBirth: '1990-02-03T00:00:00.000Z',
    idExpiryDate: '2030-02-03',
  }), {
    nationalId: ' EKB-2025-123456 ',
    fullName: 'Abebe Kebede Bekele',
    dateOfBirth: '1990-02-03',
  });

  assert.deepEqual(result, { status: 'VERIFIED', idExpiryDate: '2030-02-03' });
});

test('returns mismatch when the name or birth date does not match', async () => {
  const result = await verifyRenewalId(createRequestModel({
    fullName: 'Other Person',
    dateOfBirth: '1990-02-03',
  }), {
    nationalId: 'EKB-2025-123456',
    fullName: 'Abebe Kebede Bekele',
    dateOfBirth: '1990-02-03',
  });

  assert.deepEqual(result, { status: 'MISMATCH' });
});

test('routes unknown legacy IDs to manual review instead of treating them as fake', async () => {
  const result = await verifyRenewalId(createRequestModel(null, 'LEGACY-12345'), {
    nationalId: 'LEGACY-12345',
    fullName: 'Abebe Kebede Bekele',
    dateOfBirth: '1990-02-03',
  });

  assert.deepEqual(result, { status: 'PENDING_MANUAL' });
});
