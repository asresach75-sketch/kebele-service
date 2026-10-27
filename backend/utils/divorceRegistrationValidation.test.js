const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDivorceRegistration } = require('./divorceRegistrationValidation');

const today = new Date('2026-10-26T12:00:00.000Z');
const body = {
  applicantName: 'Abebe Bekele',
  spouseName: 'Almaz Kebede',
  spouseIdNumber: 'WIFE-ID',
  marriageRegistrationNumber: '',
  divorceDate: '2026-10-01',
};
const record = {
  applicationId: 'EKB-2025-123456',
  husbandName: 'Abebe Bekele',
  husbandId: 'HUSBAND-ID',
  wifeName: 'Almaz Kebede',
  wifeId: 'WIFE-ID',
  marriageDate: '2025-05-01',
};

const createRequestModel = (marriageRecord) => ({
  findOne(query) {
    assert.deepEqual(query, {
      serviceType: 'MARRIAGE_REGISTRATION',
      status: 'COMPLETED',
      $or: [{ husbandId: 'WIFE-ID' }, { wifeId: 'WIFE-ID' }],
    });
    return {
      select(fields) {
        assert.equal(fields, 'applicationId husbandName husbandId wifeName wifeId marriageDate');
        return Promise.resolve(marriageRecord);
      },
    };
  },
});

test('matches a divorce application to a completed marriage record', async () => {
  assert.equal(await validateDivorceRegistration(createRequestModel(record), body, today), '');
});

test('rejects a future or invalid divorce date', async () => {
  assert.match(await validateDivorceRegistration(createRequestModel(record), {
    ...body,
    divorceDate: '2026-10-27',
  }, today), /not in the future/i);
  assert.match(await validateDivorceRegistration(createRequestModel(record), {
    ...body,
    divorceDate: '2026-02-30',
  }, today), /not in the future/i);
});

test('requires names and spouse ID to match the completed marriage', async () => {
  assert.match(await validateDivorceRegistration(createRequestModel(null), body, today), /could not be found/i);
  assert.match(await validateDivorceRegistration(createRequestModel(record), {
    ...body,
    spouseName: 'Different Person',
  }, today), /do not match/i);
});

test('supports a verified marriage registration number and rejects divorce before marriage', async () => {
  const numberedBody = { ...body, marriageRegistrationNumber: 'EKB-2025-123456' };
  const model = {
    findOne(query) {
      assert.deepEqual(query, {
        serviceType: 'MARRIAGE_REGISTRATION',
        status: 'COMPLETED',
        applicationId: 'EKB-2025-123456',
      });
      return { select: () => Promise.resolve(record) };
    },
  };
  assert.equal(await validateDivorceRegistration(model, numberedBody, today), '');
  assert.match(await validateDivorceRegistration(createRequestModel(record), {
    ...body,
    divorceDate: '2025-04-30',
  }, today), /on or after/i);
});
