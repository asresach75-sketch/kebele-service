const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyRole } = require('./authMiddleware');

process.env.JWT_SECRET = 'test_jwt_secret_for_auth_middleware_123456';

const callRoleMiddleware = (role, allowedRoles = ['admin']) => {
  const token = jwt.sign({ id: 'test-user', role }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const result = { statusCode: null, body: null, nextCalled: false };
  const res = {
    status(statusCode) {
      result.statusCode = statusCode;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  const next = () => { result.nextCalled = true; };

  verifyRole(...allowedRoles)(req, res, next);
  return result;
};

test('allows admin roles regardless of claim letter case', () => {
  const result = callRoleMiddleware('Admin');

  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, null);
});

test('continues to forbid authenticated non-admin users from admin routes', () => {
  const result = callRoleMiddleware('user');

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.message, 'Access Forbidden: You do not have permission.');
});
