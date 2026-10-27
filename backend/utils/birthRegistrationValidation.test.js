const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBirthRegistration } = require('./birthRegistrationValidation');

const validPayload = {
  childFullName: 'Child Name',
  fatherFullName: 'Abebe Bekele',
  fatherDob: '1990-01-01',
  motherFullName: 'Almaz Kebede',
  motherDob: '1992-02-02',
  parentIDNumber: 'EKB-2025-123456',
  dateOfBirth: '2025-05-04',
  today: new Date('2026-10-26T12:00:00.000Z'),
};

const createRequestModel = (record) => ({
  findOne(query) {
    assert.deepEqual(query, {
      nationalId: 'EKB-2025-123456',
      serviceType: { $in: ['NEW_ID_CARD', 'ID_RENEWAL'] },
      status: 'COMPLETED',
    });
    return {
      select(fields) {
        assert.equal(fields, 'fullName firstName middleName lastName dateOfBirth');
        return Promise.resolve(record);
      },
    };
  },
});

test('accepts a child birth date after the verified parent date and before today', async () => {
  const result = await validateBirthRegistration(createRequestModel({
    fullName: 'Abebe Bekele',
    dateOfBirth: '1990-01-01',
  }), validPayload);
  assert.equal(result, '');
});

test('rejects invalid and future child birth dates', async () => {
  assert.match(await validateBirthRegistration(createRequestModel(null), {
    ...validPayload,
    dateOfBirth: '2025-02-30',
  }), /valid child date/i);
  assert.match(await validateBirthRegistration(createRequestModel(null), {
    ...validPayload,
    dateOfBirth: '2026-10-27',
  }), /future/i);
});

test('requires a completed resident ID matching a parent name', async () => {
  assert.match(await validateBirthRegistration(createRequestModel(null), validPayload), /not found/i);
  assert.match(await validateBirthRegistration(createRequestModel({
    fullName: 'Another Person',
    dateOfBirth: '1990-01-01',
  }), validPayload), /does not match/i);
});

test('requires child birth to follow the verified parent birth date', async () => {
  const result = await validateBirthRegistration(createRequestModel({
    fullName: 'Abebe Bekele',
    dateOfBirth: '1990-01-01',
  }), { ...validPayload, dateOfBirth: '1989-05-04' });
  assert.match(result, /after both parent/i);
});

test('requires the matched parent date of birth to match the resident record', async () => {
  assert.match(await validateBirthRegistration(createRequestModel({
    fullName: 'Abebe Bekele',
    dateOfBirth: '1990-01-01',
  }), {
    ...validPayload,
    fatherDob: '1991-01-01',
  }), /does not match/i);
});
