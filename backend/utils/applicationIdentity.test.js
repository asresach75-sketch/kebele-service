const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getDuplicateIdentityFilters } = require('./applicationIdentity');

test('matches the same national ID without depending on contact details', () => {
  const filters = getDuplicateIdentityFilters('NEW_ID_CARD', {
    nationalId: 'ET-123',
    phoneNumber: '0911111111',
    email: 'person@example.com'
  });

  assert.equal(filters.length, 1);
  assert.equal(filters[0].nationalId.test('et-123'), true);
  assert.equal(filters[0].nationalId.test('ET-456'), false);
});

test('uses normalized full name and date of birth when no national ID is given', () => {
  const filters = getDuplicateIdentityFilters('NEW_ID_CARD', {
    firstName: '  Hana',
    middleName: 'Abebe ',
    lastName: 'Bekele',
    dateOfBirth: '2000-01-02'
  });

  assert.equal(filters.length, 1);
  assert.equal(filters[0].fullName.test('hana abebe bekele'), true);
  assert.equal(filters[0].dateOfBirth, '2000-01-02');
});

test('does not treat matching names and birth dates as duplicates when both records have different IDs', () => {
  const filters = getDuplicateIdentityFilters('NEW_ID_CARD', {
    nationalId: 'ET-456',
    fullName: 'Hana Abebe Bekele',
    dateOfBirth: '2000-01-02'
  });

  assert.equal(filters.length, 2);
  assert.equal(filters[1].$and[1].$or.some((condition) => condition.nationalId === 'ET-456'), false);
  assert.equal(filters[1].$and[1].$or.length, 3);
});

test('does not block a matching name when the date of birth differs or only the phone matches', () => {
  assert.deepEqual(getDuplicateIdentityFilters('NEW_ID_CARD', {
    fullName: 'Hana Abebe Bekele',
    dateOfBirth: ''
  }), []);
  assert.deepEqual(getDuplicateIdentityFilters('NEW_ID_CARD', {
    phoneNumber: '0911111111'
  }), []);
});

test('uses the spouse ID field when checking duplicate divorce registrations', () => {
  const filters = getDuplicateIdentityFilters('DIVORCE_REGISTRATION', {
    spouseIdNumber: 'ID-77',
    applicantName: 'Hana Abebe',
    divorceDate: '2025-05-01'
  });

  assert.equal(filters[0].spouseIdNumber.test('id-77'), true);
  assert.deepEqual(filters[1].$and[1].$or, [
    { spouseIdNumber: { $exists: false } },
    { spouseIdNumber: null },
    { spouseIdNumber: '' }
  ]);
});