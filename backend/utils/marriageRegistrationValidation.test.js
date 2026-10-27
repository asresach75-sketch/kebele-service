const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMarriageRegistration } = require('./marriageRegistrationValidation');

const today = new Date('2026-10-26T12:00:00.000Z');
const validBody = {
  husbandName: 'Abebe Bekele',
  husbandId: 'HUSBAND-ID',
  husbandDob: '1990-01-01',
  wifeName: 'Almaz Kebede',
  wifeId: 'WIFE-ID',
  wifeDob: '1992-02-02',
  marriageDate: '2026-10-20',
  witness1Name: 'Witness One',
  witness1Id: 'WITNESS-1',
  witness2Name: 'Witness Two',
  witness2Id: 'WITNESS-2',
  witness3Name: 'Witness Three',
  witness3Id: 'WITNESS-3',
};

const records = {
  'HUSBAND-ID': { fullName: 'Abebe Bekele', dateOfBirth: '1990-01-01' },
  'WIFE-ID': { fullName: 'Almaz Kebede', dateOfBirth: '1992-02-02' },
  'WITNESS-1': { fullName: 'Witness One' },
  'WITNESS-2': { fullName: 'Witness Two' },
  'WITNESS-3': { fullName: 'Witness Three' },
};

const createRequestModel = (overrides = {}) => ({
  findOne(query) {
    const id = query.nationalId;
    const record = Object.prototype.hasOwnProperty.call(overrides, id)
      ? overrides[id]
      : records[id];
    return {
      select(fields) {
        assert.equal(fields, 'fullName firstName middleName lastName dateOfBirth');
        return Promise.resolve(record || null);
      },
    };
  },
});

test('accepts adult spouses and all witnesses with matching completed resident IDs', async () => {
  assert.equal(await validateMarriageRegistration(createRequestModel(), validBody, today), '');
});

test('requires each spouse to be at least 18 on the marriage date', async () => {
  assert.match(await validateMarriageRegistration(createRequestModel(), {
    ...validBody,
    wifeDob: '2008-10-21',
  }, today), /wife must be at least 18/i);
});

test('rejects spouse IDs that are missing or do not match the person', async () => {
  assert.match(await validateMarriageRegistration(createRequestModel({ 'HUSBAND-ID': null }), validBody, today), /husband ID was not found/i);
  assert.match(await validateMarriageRegistration(createRequestModel({
    'HUSBAND-ID': { fullName: 'Different Person', dateOfBirth: '1990-01-01' },
  }), validBody, today), /husband ID does not match/i);
});

test('requires all three witness IDs to match their submitted names', async () => {
  assert.match(await validateMarriageRegistration(createRequestModel({
    'WITNESS-2': null,
  }), validBody, today), /Witness 2 ID was not found/i);
  assert.match(await validateMarriageRegistration(createRequestModel({
    'WITNESS-3': { fullName: 'Another Person' },
  }), validBody, today), /Witness 3 ID does not match/i);
});

test('rejects future marriage dates and date of birth mismatches', async () => {
  assert.match(await validateMarriageRegistration(createRequestModel(), {
    ...validBody,
    marriageDate: '2026-10-27',
  }, today), /marriage date/i);
  assert.match(await validateMarriageRegistration(createRequestModel({
    'WIFE-ID': { fullName: 'Almaz Kebede', dateOfBirth: '1993-02-02' },
  }), validBody, today), /wife date of birth does not match/i);
});
