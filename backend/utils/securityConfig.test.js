const test = require('node:test');
const assert = require('node:assert/strict');
const { getAllowedOrigins, getJwtSecret } = require('./securityConfig');

test('rejects missing, short, and placeholder JWT secrets', () => {
  for (const secret of ['', 'short', 'dev_jwt_secret', 'replace_with_a_long_random_secret']) {
    assert.throws(() => getJwtSecret({ JWT_SECRET: secret }), /at least 32 characters/);
  }
});

test('accepts a configured random-length JWT secret', () => {
  assert.equal(getJwtSecret({ JWT_SECRET: 'a'.repeat(48) }), 'a'.repeat(48));
});

test('uses local development origins only outside production', () => {
  assert.deepEqual(getAllowedOrigins({ NODE_ENV: 'development' }), [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
  ]);
});

test('keeps local development origins available when custom origins are configured', () => {
  assert.deepEqual(
    getAllowedOrigins({
      NODE_ENV: 'development',
      CORS_ORIGINS: 'https://portal.example.com',
    }),
    [
      'https://portal.example.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
    ]
  );
});

test('requires explicit CORS origins in production', () => {
  assert.throws(() => getAllowedOrigins({ NODE_ENV: 'production' }), /CORS_ORIGINS must be configured/);
  assert.deepEqual(
    getAllowedOrigins({ NODE_ENV: 'production', CORS_ORIGINS: 'https://portal.example.com' }),
    ['https://portal.example.com']
  );
});

test('rejects CORS entries that include paths', () => {
  assert.throws(
    () => getAllowedOrigins({ CORS_ORIGINS: 'https://portal.example.com/home' }),
    /without paths/
  );
});
