const MIN_JWT_SECRET_LENGTH = 32;
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
];

const getJwtSecret = (env = process.env) => {
  const secret = env.JWT_SECRET;
  if (
    typeof secret !== 'string' ||
    secret.length < MIN_JWT_SECRET_LENGTH ||
    /^(dev_jwt_secret|replace_with_a_long_random_secret)$/i.test(secret)
  ) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
  }

  return secret;
};

const getAllowedOrigins = (env = process.env) => {
  const configuredOrigins = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!configuredOrigins.length) {
    if (env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS must be configured in production.');
    }
    return DEVELOPMENT_ORIGINS;
  }

  const validatedOrigins = configuredOrigins.map((origin) => {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`Invalid origin in CORS_ORIGINS: ${origin}`);
    }

    if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
      throw new Error(`CORS_ORIGINS entries must be HTTP(S) origins without paths: ${origin}`);
    }

    return parsedOrigin.origin;
  });

  return env.NODE_ENV === 'production'
    ? validatedOrigins
    : [...new Set([...validatedOrigins, ...DEVELOPMENT_ORIGINS])];
};

const assertSecurityConfiguration = (env = process.env) => ({
  jwtSecret: getJwtSecret(env),
  allowedOrigins: getAllowedOrigins(env),
});

module.exports = {
  assertSecurityConfiguration,
  getAllowedOrigins,
  getJwtSecret,
};
