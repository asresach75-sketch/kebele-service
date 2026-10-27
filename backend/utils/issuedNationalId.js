const APPLICATION_ID_PATTERN = /^EKB-\d{4}-\d{6}$/;

const assignIssuedNationalId = (request) => {
  if (String(request.serviceType || '').trim().toUpperCase() !== 'NEW_ID_CARD') return false;
  if (String(request.nationalId || '').trim()) return false;

  const applicationId = String(request.applicationId || '').trim();
  if (!APPLICATION_ID_PATTERN.test(applicationId)) {
    throw new Error('Cannot issue an ID number because the application ID is invalid.');
  }

  request.nationalId = applicationId;
  return true;
};

module.exports = assignIssuedNationalId;
