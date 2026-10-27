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

const ageOnDate = (dateOfBirth, eventDate) => {
  let age = eventDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  if (
    eventDate.getUTCMonth() < dateOfBirth.getUTCMonth()
    || (eventDate.getUTCMonth() === dateOfBirth.getUTCMonth()
      && eventDate.getUTCDate() < dateOfBirth.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
};

const getRecordedName = (record) => (
  [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ')
  || record.fullName
);

const findCompletedIdRecord = async (ServiceRequest, nationalId) => (
  ServiceRequest.findOne({
    nationalId: String(nationalId || '').trim(),
    serviceType: { $in: ['NEW_ID_CARD', 'ID_RENEWAL'] },
    status: 'COMPLETED',
  }).select('fullName firstName middleName lastName dateOfBirth')
);

const validateMarriageRegistration = async (ServiceRequest, body, today = new Date()) => {
  const marriageDate = parseDateOnly(body.marriageDate);
  const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!marriageDate || marriageDate > currentDate) {
    return 'Enter a valid marriage date that is not in the future.';
  }

  for (const person of ['husband', 'wife']) {
    const birthDate = parseDateOnly(body[`${person}Dob`]);
    if (!birthDate || birthDate > marriageDate) {
      return `Enter a valid ${person} date of birth before the marriage date.`;
    }
    if (ageOnDate(birthDate, marriageDate) < 18) {
      return `The ${person} must be at least 18 years old on the marriage date.`;
    }

    const record = await findCompletedIdRecord(ServiceRequest, body[`${person}Id`]);
    if (!record) {
      return `The ${person} ID was not found in completed resident ID records.`;
    }
    if (normalizeName(getRecordedName(record)) !== normalizeName(body[`${person}Name`])) {
      return `The ${person} ID does not match the submitted name.`;
    }
    if (parseDateOnly(String(record.dateOfBirth || '').slice(0, 10))?.getTime() !== birthDate.getTime()) {
      return `The ${person} date of birth does not match the resident ID record.`;
    }
  }

  for (let witness = 1; witness <= 3; witness += 1) {
    const record = await findCompletedIdRecord(ServiceRequest, body[`witness${witness}Id`]);
    if (!record) {
      return `Witness ${witness} ID was not found in completed resident ID records.`;
    }
    if (normalizeName(getRecordedName(record)) !== normalizeName(body[`witness${witness}Name`])) {
      return `Witness ${witness} ID does not match the submitted name.`;
    }
  }

  return '';
};

module.exports = { validateMarriageRegistration };
