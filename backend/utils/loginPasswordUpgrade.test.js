const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { upgradeLegacyPassword, verifyStoredPassword } = require('./loginPasswordUpgrade');

test('upgrades a legacy plain-text password without calling save() on a record that may be missing validation fields', async () => {
  let called = false;
  const user = { _id: 'user-1', password: 'legacy-secret', phone: undefined };
  const UserModel = {
    findByIdAndUpdate: async (id, update, options) => {
      called = true;
      assert.equal(id, 'user-1');
      assert.deepEqual(update, { password: update.password });
      assert.equal(options.runValidators, false);
      return { _id: id, password: update.password };
    }
  };

  const result = await upgradeLegacyPassword(UserModel, user, 'legacy-secret');

  assert.equal(result, true);
  assert.equal(called, true);
});

test('matches valid bcrypt hashes without crashing on malformed legacy data', async () => {
  const hashedPassword = await bcrypt.hash('correct-password', 10);
  const user = { _id: 'user-2', password: hashedPassword };
  const UserModel = {
    findByIdAndUpdate: async () => ({ _id: 'user-2', password: hashedPassword })
  };

  const result = await verifyStoredPassword(UserModel, user, 'correct-password');

  assert.equal(result, true);
});

test('falls back to legacy plain-text checks and upgrades them safely', async () => {
  let upgraded = false;
  const user = { _id: 'user-3', password: 'legacy-secret' };
  const UserModel = {
    findByIdAndUpdate: async (id, update) => {
      upgraded = true;
      return { _id: id, password: update.password };
    }
  };

  const result = await verifyStoredPassword(UserModel, user, 'legacy-secret');

  assert.equal(result, true);
  assert.equal(upgraded, true);
});
