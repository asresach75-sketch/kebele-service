const test = require('node:test');
const assert = require('node:assert/strict');
const { mapUserApiError } = require('./userApiError');

test('maps duplicate key database errors to a 400 response', () => {
  const result = mapUserApiError({ code: 11000, message: 'duplicate key error' }, 'Server error creating account.');

  assert.deepEqual(result, {
    status: 400,
    message: 'This email or phone already exists.'
  });
});

test('maps validation errors to a 400 response', () => {
  const result = mapUserApiError({
    name: 'ValidationError',
    errors: {
      phone: { message: 'Phone is required.' },
      fullName: { message: 'Full name is required.' }
    }
  }, 'Server error creating account.');

  assert.equal(result.status, 400);
  assert.match(result.message, /Phone is required\./);
  assert.match(result.message, /Full name is required\./);
});

test('maps unexpected errors to a 500 response', () => {
  const result = mapUserApiError({ name: 'TypeError', message: 'Unexpected issue' }, 'Server error creating account.');

  assert.equal(result.status, 500);
  assert.equal(result.message, 'Unexpected issue');
});
