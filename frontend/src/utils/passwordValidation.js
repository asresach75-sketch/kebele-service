const strongPasswordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%!&*]).{8,}$/;

export const isStrongPassword = (password) =>
  typeof password === 'string' && strongPasswordPattern.test(password);
