import {
  countApplicantNameLetters,
  isValidApplicantName,
  isValidEthiopianPhoneNumber,
  normalizeEthiopianPhoneInput,
  sanitizeApplicantName
} from './idApplicationValidation';

describe('applicant name validation', () => {
  it('keeps English and Amharic letters and spaces only', () => {
    expect(sanitizeApplicantName('Abe ሀለሐ12!')).toBe('Abe ሀለሐ');
  });

  it('requires at least three letters in each name part and rejects other characters', () => {
    expect(countApplicantNameLetters('Ab ሀ')).toBe(3);
    expect(isValidApplicantName('Abebe ሀለሐ')).toBe(true);
    expect(isValidApplicantName('a b as')).toBe(false);
    expect(isValidApplicantName('fg n h')).toBe(false);
    expect(isValidApplicantName('Ab')).toBe(false);
    expect(isValidApplicantName('   ')).toBe(false);
    expect(isValidApplicantName('Name2')).toBe(false);
  });
});

describe('Ethiopian phone validation', () => {
  it('keeps only the first ten numeric digits while typing', () => {
    expect(normalizeEthiopianPhoneInput('09a1234567890')).toBe('0912345678');
    expect(normalizeEthiopianPhoneInput('+251912345678')).toBe('2519123456');
  });

  it('requires ten digits starting with 09 or 07', () => {
    expect(isValidEthiopianPhoneNumber('0912345678')).toBe(true);
    expect(isValidEthiopianPhoneNumber('0712345678')).toBe(true);
    expect(isValidEthiopianPhoneNumber('0812345678')).toBe(false);
    expect(isValidEthiopianPhoneNumber('091234567')).toBe(false);
    expect(isValidEthiopianPhoneNumber('+251912345678')).toBe(false);
  });
});
