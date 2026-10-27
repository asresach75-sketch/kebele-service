const hasFile = (files, field) => Array.isArray(files?.[field]) && files[field].length > 0;
const hasImageFile = (files, field) => (
  Array.isArray(files?.[field]) && files[field].some((file) => ['image/jpeg', 'image/png'].includes(file.mimetype))
);

const validateIdApplicationDocuments = (
  serviceType,
  files,
  isTransfer = false,
  hasPreviousNationalId = false,
  renewalReason = ''
) => {
  if (
    (hasFile(files, 'releaseLetter') || hasFile(files, 'policeClearance')) &&
    (serviceType !== 'NEW_ID_CARD' || !isTransfer)
  ) {
    return 'Release letters and police clearances are only accepted for transfer applications.';
  }

  if (!hasFile(files, 'webcamPhoto') && !hasFile(files, 'passportPhoto')) {
    return 'Upload a passport photo or capture a photo for the ID card.';
  }

  if (serviceType === 'ID_RENEWAL' && !hasPreviousNationalId) {
    return 'Enter your previous national ID number to renew your ID.';
  }
  if (serviceType === 'ID_RENEWAL' && !['EXPIRED', 'LOST', 'DAMAGED'].includes(renewalReason)) {
    return 'Select whether your previous ID is expired, lost, or damaged.';
  }
  if (serviceType === 'ID_RENEWAL'
    && renewalReason === 'EXPIRED'
    && !hasFile(files, 'previousIdDocument')) {
    return 'Upload a copy of your previous ID card for verification.';
  }
  if (serviceType === 'ID_RENEWAL' && renewalReason === 'LOST' && !hasFile(files, 'policeReport')) {
    return 'Upload a police report for the lost ID.';
  }
  if (serviceType === 'ID_RENEWAL'
    && renewalReason === 'DAMAGED'
    && !hasImageFile(files, 'damagedIdDocument')) {
    return 'Upload a photo or scan of the damaged ID.';
  }

  if (serviceType === 'NEW_ID_CARD' && !hasFile(files, 'birthCertificate')) {
    return 'A birth certificate is required for a new ID card application.';
  }

  if (serviceType === 'NEW_ID_CARD' && !hasFile(files, 'residenceProof') && !hasFile(files, 'housingProof')) {
    return 'Upload residence proof or housing proof for a new ID card application.';
  }

  return '';
};

module.exports = validateIdApplicationDocuments;