const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getDocumentVerificationUrl,
  isDocumentVerificationEligible,
} = require('./documentVerification');

test('creates an encoded verification link from the configured public app URL', () => {
  const originalUrl = process.env.PUBLIC_APP_URL;
  process.env.PUBLIC_APP_URL = 'https://ekebele.example.gov/';
  try {
    assert.equal(
      getDocumentVerificationUrl('EKB-2026/123'),
      'https://ekebele.example.gov/verify-document/EKB-2026%2F123',
    );
  } finally {
    if (originalUrl === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = originalUrl;
  }
});

test('uses the local development portal URL when no public URL is configured', () => {
  const originalUrl = process.env.PUBLIC_APP_URL;
  delete process.env.PUBLIC_APP_URL;
  try {
    assert.equal(
      getDocumentVerificationUrl('EKB-2026-123'),
      'http://localhost:3001/verify-document/EKB-2026-123',
    );
  } finally {
    if (originalUrl !== undefined) process.env.PUBLIC_APP_URL = originalUrl;
  }
});

test('allows finance-verified new, renewal, and replacement IDs to be verified', () => {
  for (const serviceType of ['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT']) {
    assert.equal(isDocumentVerificationEligible({
      serviceType,
      status: 'APPROVED_BY_FINANCE',
      paymentStatus: 'Verified',
    }), true);
  }
});

test('allows completed documents and rejects unverified records', () => {
  assert.equal(isDocumentVerificationEligible({
    serviceType: 'BIRTH_REGISTRATION',
    status: 'COMPLETED',
    paymentStatus: 'Unpaid',
  }), true);
  assert.equal(isDocumentVerificationEligible({
    serviceType: 'ID_RENEWAL',
    status: 'APPROVED_BY_FINANCE',
    paymentStatus: 'Pending',
  }), false);
  assert.equal(isDocumentVerificationEligible({
    serviceType: 'BIRTH_REGISTRATION',
    status: 'APPROVED_BY_FINANCE',
    paymentStatus: 'Verified',
  }), false);
});
