const test = require('node:test');
const assert = require('node:assert/strict');
const { getFeeCategory } = require('./serviceFees');

test('maps ID and civil event service types to the admin fee categories', () => {
  assert.equal(getFeeCategory('NEW_ID_CARD'), 'New ID');
  assert.equal(getFeeCategory('ID_RENEWAL'), 'ID Renewal');
  assert.equal(getFeeCategory('ID_REPLACEMENT'), 'ID Renewal');
  assert.equal(getFeeCategory('BIRTH_REGISTRATION'), 'Vital Events');
  assert.equal(getFeeCategory('MARRIAGE_REGISTRATION'), 'Vital Events');
  assert.equal(getFeeCategory('DIVORCE_REGISTRATION'), 'Vital Events');
  assert.equal(getFeeCategory('DEATH_REGISTRATION'), 'Vital Events');
  assert.equal(getFeeCategory('UNKNOWN'), null);
});
