const isValidEthiopianPhoneNumber = (value) =>
  /^(?:0[79]\d{8}|\+251[79]\d{8})$/.test(String(value || '').trim());

const isValidIdApplicantName = (value) => {
  const name = String(value || '').trim();
  return /^[a-zA-Z\u1200-\u135A ]+$/.test(name)
    && name.split(/ +/).every((part) => (part.match(/[a-zA-Z\u1200-\u135A]/g) || []).length >= 3);
};

module.exports = { isValidEthiopianPhoneNumber, isValidIdApplicantName };
