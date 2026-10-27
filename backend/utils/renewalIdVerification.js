const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const normalizeDate = (value) => String(value || '').trim().slice(0, 10);

const verifyRenewalId = async (ServiceRequest, { nationalId, fullName, dateOfBirth }) => {
  const existingId = await ServiceRequest.findOne({
    serviceType: 'NEW_ID_CARD',
    nationalId: String(nationalId || '').trim(),
    status: 'COMPLETED',
  }).select('firstName middleName lastName fullName dateOfBirth idExpiryDate');

  if (!existingId) {
    return { status: 'PENDING_MANUAL' };
  }

  const issuedName = [existingId.firstName, existingId.middleName, existingId.lastName]
    .filter(Boolean)
    .join(' ') || existingId.fullName;
  const identityMatches = normalizeText(issuedName) === normalizeText(fullName)
    && normalizeDate(existingId.dateOfBirth) === normalizeDate(dateOfBirth);

  return identityMatches
    ? { status: 'VERIFIED', idExpiryDate: existingId.idExpiryDate || '' }
    : { status: 'MISMATCH' };
};

module.exports = verifyRenewalId;
