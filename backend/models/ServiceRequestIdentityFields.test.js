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
