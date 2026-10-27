const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
};

const validateBirthRegistration = async (ServiceRequest, {
  childFullName,
  fatherFullName,
  fatherDob,
  motherFullName,
  motherDob,
  parentIDNumber,
  dateOfBirth,
  today = new Date(),
}) => {
  const childDate = parseDateOnly(dateOfBirth);
  if (!childDate) return 'Enter a valid child date of birth.';

  const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (childDate > currentDate) return 'Date of birth cannot be in the future.';
  const fatherDate = parseDateOnly(fatherDob);
  const motherDate = parseDateOnly(motherDob);
  if (!fatherDate || !motherDate) return 'Enter valid dates of birth for both parents.';
  if (fatherDate > currentDate || motherDate > currentDate) {
    return 'Parent dates of birth cannot be in the future.';
  }
  if (childDate <= fatherDate || childDate <= motherDate) {
    return 'The child date of birth must be after both parent dates of birth.';
  }

  const parentId = String(parentIDNumber || '').trim();
  const parentRecord = await ServiceRequest.findOne({
    nationalId: parentId,
    serviceType: { $in: ['NEW_ID_CARD', 'ID_RENEWAL'] },
    status: 'COMPLETED',
  }).select('fullName firstName middleName lastName dateOfBirth');

  if (!parentRecord) {
    return 'Parent ID was not found in completed resident ID records.';
  }

  const recordedParentNames = [
    parentRecord.fullName,
    [parentRecord.firstName, parentRecord.middleName, parentRecord.lastName].filter(Boolean).join(' '),
  ].map(normalizeName).filter(Boolean);
  const submittedParentNames = [fatherFullName, motherFullName].map(normalizeName);
  const matchedParentIndex = submittedParentNames.findIndex((name) => recordedParentNames.includes(name));
  if (matchedParentIndex < 0) {
    return 'Parent ID does not match the father or mother name in the resident ID record.';
  }

  const parentDate = parseDateOnly(String(parentRecord.dateOfBirth || '').slice(0, 10));
  if (!parentDate) return 'The parent date of birth could not be verified from the ID record.';
  const submittedParentDate = parseDateOnly(matchedParentIndex === 0 ? fatherDob : motherDob);
  if (!submittedParentDate) return 'Enter a valid date of birth for the parent whose ID is provided.';
  if (submittedParentDate.getTime() !== parentDate.getTime()) {
    return 'The parent date of birth does not match the resident ID record.';
  }

  return '';
};

module.exports = { validateBirthRegistration };
