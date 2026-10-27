import { isStrongPassword } from './passwordValidation';

test('accepts passwords containing all required character classes and at least eight characters', () => {
  expect(isStrongPassword('Strong1!')).toBe(true);
  expect(isStrongPassword('LongerPassword9@')).toBe(true);
});

test('rejects passwords that are short or miss a required character class', () => {
  expect(isStrongPassword('Short1!')).toBe(false);
  expect(isStrongPassword('lowercase1!')).toBe(false);
  expect(isStrongPassword('UPPERCASE1!')).toBe(false);
  expect(isStrongPassword('NoNumber!')).toBe(false);
  expect(isStrongPassword('NoSpecial1')).toBe(false);
  expect(isStrongPassword(null)).toBe(false);
});
