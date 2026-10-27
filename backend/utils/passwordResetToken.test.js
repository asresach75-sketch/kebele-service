const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createPasswordResetToken,
  hashPasswordResetToken,
} = require('./passwordResetToken');

test('creates a unique URL-safe token and stores only its matching hash', () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, first.tokenHash);
  assert.equal(hashPasswordResetToken(first.token), first.tokenHash);
  assert.notEqual(first.token, second.token);
});
