const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidEthiopianPhoneNumber,
  isValidIdApplicantName,
} = require('./idApplicationInputValidation');

test('accepts Ethiopian mobile numbers in local and international formats', () => {
  for (const phone of ['0912345678', '0712345678', '+251912345678', '+251712345678']) {
    assert.equal(isValidEthiopianPhoneNumber(phone), true, phone);
  }
});

test('rejects malformed Ethiopian phone numbers', () => {
  for (const phone of ['091234567', '0812345678', '+251812345678', '0912345678<script>']) {
    assert.equal(isValidEthiopianPhoneNumber(phone), false, phone);
  }
});

test('accepts Latin and Ethiopic letters and spaces in applicant names', () => {
  assert.equal(isValidIdApplicantName('Abebe Bekele'), true);
  assert.equal(isValidIdApplicantName('አበበ በቀለ'), true);
  assert.equal(isValidIdApplicantName('Abe'), true);
  assert.equal(isValidIdApplicantName('አበበ'), true);
  assert.equal(isValidIdApplicantName('Abebe አበበ'), true);
});

test('rejects short name fields, markup, digits, and punctuation in applicant names', () => {
  for (const name of ['a', 'b', 'as', 'ab', 'a b as', 'fg n h', 'Abebe2 Bekele', '<script>alert(1)</script>', "Abebe O'Neil", 'Abebe\tBekele', 'Abebe\nBekele']) {
    assert.equal(isValidIdApplicantName(name), false, name);
  }
});
