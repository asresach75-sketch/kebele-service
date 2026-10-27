const crypto = require('crypto');

const createPasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, tokenHash };
};

const hashPasswordResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = { createPasswordResetToken, hashPasswordResetToken };
