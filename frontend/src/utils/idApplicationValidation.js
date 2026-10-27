const INVALID_NAME_CHARACTERS = /[^A-Za-z\u1200-\u135A ]/g;
const NAME_LETTERS = /[A-Za-z\u1200-\u135A]/g;

export const sanitizeApplicantName = (value) => value.replace(INVALID_NAME_CHARACTERS, '');

export const countApplicantNameLetters = (value) => (value.match(NAME_LETTERS) || []).length;

export const isValidApplicantName = (value) => (
  sanitizeApplicantName(value) === value
  && value.trim().split(/\s+/).every((part) => countApplicantNameLetters(part) >= 3)
);

export const normalizeEthiopianPhoneInput = (value) => value.replace(/\D/g, '').slice(0, 10);

export const isValidEthiopianPhoneNumber = (value) => /^0[79]\d{8}$/.test(value);
