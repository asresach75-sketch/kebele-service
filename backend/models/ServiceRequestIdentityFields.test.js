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
