const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactText = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

const getDuplicateIdentityFilters = (serviceType, body = {}) => {
  const type = String(serviceType || '').toUpperCase();
  const filters = [];
  const nationalId = normalize(body.nationalId || body.nationalIdOrResidenceNumber);
  const identityId = type === 'DIVORCE_REGISTRATION'
    ? normalize(body.spouseIdNumber || nationalId)
    : nationalId;
  const identityIdField = type === 'DIVORCE_REGISTRATION' && !nationalId ? 'spouseIdNumber' : 'nationalId';

  if (identityId) {
    filters.push({ [identityIdField]: exactText(identityId) });
  }

  let name;
  let date;
  let nameField;
  let dateField;

  if (['NEW_ID_CARD', 'ID_RENEWAL'].includes(type)) {
    name = normalize(body.fullName || [body.firstName, body.middleName, body.lastName].filter(Boolean).join(' '));
    date = normalize(body.dateOfBirth);
    nameField = 'fullName';
    dateField = 'dateOfBirth';
  } else if (type === 'BIRTH_REGISTRATION') {
    name = normalize(body.childFullName || body.childName);
    date = normalize(body.dob || body.dateOfBirth);
    nameField = 'childFullName';
    dateField = 'dob';
  } else if (type === 'DEATH_REGISTRATION') {
    name = normalize(body.deceasedName);
    date = normalize(body.dateOfDeath);
    nameField = 'deceasedName';
    dateField = 'dateOfDeath';
  } else if (type === 'DIVORCE_REGISTRATION') {
    name = normalize(body.applicantName);
    date = normalize(body.divorceDate);
    nameField = 'applicantName';
    dateField = 'divorceDate';
  }

  if (name && date) {
    const nameAndDate = { [nameField]: exactText(name), [dateField]: date };
    if (identityId) {
      filters.push({
        $and: [
          nameAndDate,
          { $or: [{ [identityIdField]: { $exists: false } }, { [identityIdField]: null }, { [identityIdField]: '' }] }
        ]
      });
    } else {
      filters.push(nameAndDate);
    }
  }

  return filters;
};

module.exports = { getDuplicateIdentityFilters };