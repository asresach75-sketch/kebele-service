const test = require('node:test');
const assert = require('node:assert/strict');
const ServiceRequest = require('./ServiceRequest');

test('ServiceRequest includes structured identity fields for residency verification', () => {
  const requiredPaths = [
    'placeOfBirthRegion',
    'placeOfBirthZone',
    'placeOfBirthWoreda',
    'placeOfBirthKebele',
    'occupation',
    'emergencyContactName',
    'emergencyPhone',
    'paymentMethod',
    'paymentVerifiedAt',
    'paymentVerifiedBy',
    'completedAt',
    'completedBy',
    'renewalReason',
    'idExpiryDate',
    'policeReport',
    'damagedIdDocument',
    'fatherDob',
    'motherDob',
    'parentIDNumber',
    'husbandDob',
    'wifeDob',
    'witness1Id',
    'witness2Id',
    'witness3Id',
    'marriageRegistrationNumber',
    'previousResidenceRegion',
    'previousResidenceZone',
    'previousResidenceWoreda',
    'previousResidenceKebele',
    'previousResidenceAddress'
  ];

  for (const path of requiredPaths) {
    assert.ok(ServiceRequest.schema.path(path), `Missing schema field: ${path}`);
  }
});

test('ServiceRequest treats a blank optional renewal reason as omitted', async () => {
  const request = new ServiceRequest({
    applicationId: 'EKB-TEST-100001',
    serviceType: 'NEW_ID_CARD',
    renewalReason: ''
  });

  assert.equal(request.renewalReason, undefined);
  await assert.doesNotReject(request.validate());
});

test('ServiceRequest still rejects unsupported non-empty renewal reasons', async () => {
  const request = new ServiceRequest({
    applicationId: 'EKB-TEST-100002',
    serviceType: 'ID_RENEWAL',
    renewalReason: 'OTHER'
  });

  await assert.rejects(request.validate(), (error) => {
    assert.ok(error.errors.renewalReason);
    return true;
  });
});
