const test = require('node:test');
const assert = require('node:assert/strict');
const { isStrongPassword } = require('./passwordValidation');

test('accepts passwords with all required character classes and minimum length', () => {
  assert.equal(isStrongPassword('Strong1!'), true);
  assert.equal(isStrongPassword('LongerPassword9@'), true);
});

test('rejects passwords missing any requirement or not strings', () => {
  for (const password of [
    'Short1!',
    'lowercase1!',
    'UPPERCASE1!',
    'NoNumber!',
    'NoSpecial1',
    null,
    12345678,
  ]) {
    assert.equal(isStrongPassword(password), false);
  }
});
