const { isValidEthiopianPhoneNumber, isValidIdApplicantName } = require('./idApplicationInputValidation');

const getDigitalIdCardMetadata = (service) => {
  const issueDate = new Date(
    service.completedAt
    || service.paymentVerifiedAt
    || service.createdAt
    || Date.now(),
  );
  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);

  const verifier = String(service.verifiedByName || service.paymentVerifiedBy || '').trim();
  const issuedBy = verifier
    ? verifier.includes('@') ? 'Finance Office' : verifier
    : 'E-Kebele Service Portal';
  const emergencyName = String(service.emergencyContactName || '').trim();
  const emergencyPhone = String(service.emergencyPhone || service.emergencyContactPhone || '').trim();

  return {
    issueDate,
    expiryDate,
    issuedBy,
    emergencyName: emergencyName
      ? isValidIdApplicantName(emergencyName) ? emergencyName : 'Update required'
      : 'Not recorded',
    emergencyPhone: emergencyPhone
      ? isValidEthiopianPhoneNumber(emergencyPhone) ? emergencyPhone : 'Update required'
      : 'Not recorded',
  };
};

module.exports = getDigitalIdCardMetadata;
