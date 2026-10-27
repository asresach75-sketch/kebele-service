const test = require('node:test');
const assert = require('node:assert/strict');
const getAllowedNextStatus = require('./workflowTransitions');

test('officers can review pending requests but cannot skip finance', () => {
  const transition = (requestedStatus) => getAllowedNextStatus({
    role: 'officer',
    currentStatus: 'PENDING_OFFICER',
    requestedStatus,
    serviceType: 'BIRTH_REGISTRATION',
  });

  assert.equal(transition('Approved'), 'APPROVED_BY_OFFICER');
  assert.equal(transition('Needs Correction'), 'NEEDS_CORRECTION');
  assert.equal(transition('Rejected'), 'REJECTED');
  assert.equal(transition('APPROVED_BY_FINANCE'), null);
});

test('verifier and vital roles are limited to their service types', () => {
  assert.equal(getAllowedNextStatus({ role: 'verifier', currentStatus: 'Pending', requestedStatus: 'Approved', serviceType: 'NEW_ID_CARD' }), 'APPROVED_BY_OFFICER');
  assert.equal(getAllowedNextStatus({ role: 'verifier', currentStatus: 'Pending', requestedStatus: 'Approved', serviceType: 'BIRTH_REGISTRATION' }), null);
  assert.equal(getAllowedNextStatus({ role: 'vital', currentStatus: 'Pending', requestedStatus: 'Approved', serviceType: 'BIRTH_REGISTRATION' }), 'APPROVED_BY_OFFICER');
  assert.equal(getAllowedNextStatus({ role: 'vital', currentStatus: 'Pending', requestedStatus: 'Approved', serviceType: 'NEW_ID_CARD' }), null);
  assert.equal(getAllowedNextStatus({ role: 'admin', currentStatus: 'PENDING_OFFICER', requestedStatus: 'Approved', serviceType: 'BIRTH_REGISTRATION' }), 'APPROVED_BY_OFFICER');
});

test('finance and admins can only advance the expected workflow stage', () => {
  assert.equal(getAllowedNextStatus({ role: 'finance', currentStatus: 'PAID_PENDING_FINANCE', requestedStatus: 'Payment Verified' }), 'APPROVED_BY_FINANCE');
  assert.equal(getAllowedNextStatus({
    role: 'finance',
    currentStatus: 'PAID_PENDING_FINANCE',
    requestedStatus: 'Payment Verified',
    serviceType: 'BIRTH_REGISTRATION',
  }), 'COMPLETED');
  assert.equal(getAllowedNextStatus({ role: 'finance', currentStatus: 'PENDING_OFFICER', requestedStatus: 'APPROVED_BY_FINANCE' }), null);
  assert.equal(getAllowedNextStatus({ role: 'admin', currentStatus: 'APPROVED_BY_FINANCE', requestedStatus: 'COMPLETED' }), 'COMPLETED');
  assert.equal(getAllowedNextStatus({ role: 'admin', currentStatus: 'PENDING_OFFICER', requestedStatus: 'COMPLETED' }), null);
});

test('demo application can complete the full citizen-officer-finance-admin workflow', () => {
  const application = { serviceType: 'NEW_ID_CARD', status: 'PENDING_OFFICER', history: [] };
  const advance = (role, requestedStatus) => {
    const nextStatus = getAllowedNextStatus({
      role,
      currentStatus: application.status,
      requestedStatus,
      serviceType: application.serviceType,
    });
    assert.ok(nextStatus, `${role} should be allowed to advance from ${application.status}`);
    application.history.push({ role, from: application.status, to: nextStatus });
    application.status = nextStatus;
  };

  advance('officer', 'Approved');
  application.status = 'PAID_PENDING_FINANCE';
  advance('finance', 'Payment Verified');
  advance('admin', 'Completed');

  assert.equal(application.status, 'COMPLETED');
  assert.deepEqual(application.history.map((event) => event.to), [
    'APPROVED_BY_OFFICER',
    'APPROVED_BY_FINANCE',
    'COMPLETED',
  ]);
});