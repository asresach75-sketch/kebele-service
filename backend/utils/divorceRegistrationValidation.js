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

const validateDivorceRegistration = async (ServiceRequest, body, today = new Date()) => {
  const divorceDate = parseDateOnly(body.divorceDate);
  const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!divorceDate || divorceDate > currentDate) {
    return 'Enter a valid divorce date that is not in the future.';
  }

  const spouseId = String(body.spouseIdNumber || '').trim();
  const marriageRegistrationNumber = String(body.marriageRegistrationNumber || '').trim();
  const query = {
    serviceType: 'MARRIAGE_REGISTRATION',
    status: 'COMPLETED',
    ...(marriageRegistrationNumber
      ? { applicationId: marriageRegistrationNumber }
      : { $or: [{ husbandId: spouseId }, { wifeId: spouseId }] }),
  };
  const marriageRecord = await ServiceRequest.findOne(query)
    .select('applicationId husbandName husbandId wifeName wifeId marriageDate');

  if (!marriageRecord) {
    return 'The completed marriage registration could not be found. Check the spouse ID or marriage registration number.';
  }

  const spouseMatchesHusband = String(marriageRecord.husbandId || '').trim().toLowerCase() === spouseId.toLowerCase()
    && normalizeName(marriageRecord.husbandName) === normalizeName(body.spouseName)
    && normalizeName(marriageRecord.wifeName) === normalizeName(body.applicantName);
  const spouseMatchesWife = String(marriageRecord.wifeId || '').trim().toLowerCase() === spouseId.toLowerCase()
    && normalizeName(marriageRecord.wifeName) === normalizeName(body.spouseName)
    && normalizeName(marriageRecord.husbandName) === normalizeName(body.applicantName);
  if (!spouseMatchesHusband && !spouseMatchesWife) {
    return 'The spouse ID and names do not match the completed marriage registration.';
  }

  const marriageDate = parseDateOnly(marriageRecord.marriageDate);
  if (!marriageDate || divorceDate < marriageDate) {
    return 'The divorce date must be on or after the registered marriage date.';
  }

  return '';
};

module.exports = { validateDivorceRegistration };
