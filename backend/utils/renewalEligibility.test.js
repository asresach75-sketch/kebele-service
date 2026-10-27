const test = require('node:test');
const assert = require('node:assert/strict');
const { getRenewalEligibilityError } = require('./renewalEligibility');

const today = new Date('2026-10-26T12:00:00.000Z');

test('requires a recognized renewal reason and an expiry date for expired IDs', () => {
  assert.match(getRenewalEligibilityError({ reason: '', today }), /Select whether/i);
  assert.match(getRenewalEligibilityError({ reason: 'EXPIRED', today }), /expiry date/i);
});

test('allows IDs expired for no more than one year and IDs expiring within six calendar months', () => {
  for (const expiry of ['2025-10-26', '2027-04-26']) {
    assert.equal(getRenewalEligibilityError({
      reason: 'EXPIRED',
      providedExpiryDate: expiry,
      today,
    }), '');
  }
});

test('blocks expired IDs after the one-year renewal window', () => {
  assert.match(getRenewalEligibilityError({
    reason: 'EXPIRED',
    providedExpiryDate: '2025-10-25',
    today,
  }), /expired more than one year ago/i);
});

test('blocks renewal when more than six months remain', () => {
  assert.match(getRenewalEligibilityError({
    reason: 'EXPIRED',
    providedExpiryDate: '2027-04-27',
    today,
  }), /more than six months/i);
});

test('uses a registered expiry date and rejects a mismatch', () => {
  assert.match(getRenewalEligibilityError({
    reason: 'EXPIRED',
    providedExpiryDate: '2027-04-26',
    registeredExpiryDate: '2027-04-27T00:00:00.000Z',
    today,
  }), /does not match/i);
  assert.equal(getRenewalEligibilityError({
    reason: 'EXPIRED',
    providedExpiryDate: '2027-04-26',
    registeredExpiryDate: '2027-04-26T00:00:00.000Z',
    today,
  }), '');
});

test('does not apply expiry-window restrictions to lost or damaged IDs', () => {
  for (const reason of ['LOST', 'DAMAGED']) {
    assert.equal(getRenewalEligibilityError({ reason, today }), '');
  }
});
