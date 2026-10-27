const strongPasswordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%!&*]).{8,}$/;

const isStrongPassword = (password) =>
  typeof password === 'string' && strongPasswordPattern.test(password);

module.exports = { isStrongPassword };
