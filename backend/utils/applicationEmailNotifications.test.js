const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplicationEmailNotifications } = require('./applicationEmailNotifications');

test('sends an application receipt with the application number and escaped HTML', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));

  const result = await notifications.applicationSubmitted({
    email: 'citizen@example.com',
    fullName: '<Alemu & Co>',
    applicationId: 'EKB-2026-123456',
    serviceType: 'NEW_ID_CARD',
  });

  assert.deepEqual(result, { sent: true });
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].email, 'citizen@example.com');
  assert.match(sentEmails[0].message, /EKB-2026-123456/);
  assert.match(sentEmails[0].html, /&lt;Alemu &amp; Co&gt;/);
  assert.doesNotMatch(sentEmails[0].html, /<Alemu/);
});

test('sends payment verified and ready-for-collection notifications', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));
  const request = { email: 'citizen@example.com', applicationId: 'EKB-2026-123456' };

  await notifications.paymentVerified(request);
  await notifications.documentReady(request);

  assert.equal(sentEmails.length, 2);
  assert.match(sentEmails[0].message, /Finance team has verified and approved your payment/i);
  assert.match(sentEmails[0].message, /ክፍያ.*ተረጋግ/);
  assert.match(sentEmails[1].message, /ready for collection/i);
});

test('sends bilingual officer approval notice with payment instructions', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));

  await notifications.officerApproved({
    email: 'citizen@example.com',
    fullName: 'Abebe Kebede',
    applicationId: 'EKB-2026-123456',
    paymentAmount: 94.3,
    currency: 'ETB',
  });

  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].email, 'citizen@example.com');
  assert.match(sentEmails[0].message, /complete the payment/i);
  assert.match(sentEmails[0].message, /proceed to Finance for verification/i);
  assert.match(sentEmails[0].message, /94\.3 ETB/);
  assert.match(sentEmails[0].message, /ክፍያ 94\.3 ETB ነው/);
  assert.match(sentEmails[0].subject, /payment required/i);
  assert.match(sentEmails[0].message, /ክፍያውን ይፈጽሙ/);
  assert.match(sentEmails[0].subject, /ጸድቋል/);
});

test('finance approval notice says payment is approved and document preparation has started', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));

  await notifications.paymentVerified({
    email: 'citizen@example.com',
    fullName: 'Abebe Kebede',
    applicationId: 'EKB-2026-123456',
  });

  assert.match(sentEmails[0].subject, /Finance approved/i);
  assert.match(sentEmails[0].message, /verified and approved your payment/i);
  assert.match(sentEmails[0].message, /document preparation/i);
  assert.match(sentEmails[0].message, /ተረጋግጦ ጸድቋል/);
  assert.match(sentEmails[0].message, /ወደ ሰነድ ዝግጅት ሂደት/);
});

test('sends notices for correction resubmission, payment submission, correction requests, and rejection', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));
  const request = {
    email: 'citizen@example.com',
    fullName: 'Abebe Kebede',
    applicationId: 'EKB-2026-123456',
    status: 'PENDING_OFFICER',
    correctionReason: 'Attach a clearer document.',
  };

  await notifications.applicationStatusUpdated(request);
  await notifications.applicationStatusUpdated({ ...request, status: 'PAID_PENDING_FINANCE' });
  await notifications.applicationStatusUpdated({ ...request, status: 'NEEDS_CORRECTION' });
  await notifications.applicationStatusUpdated({ ...request, status: 'REJECTED' });

  assert.equal(sentEmails.length, 4);
  assert.match(sentEmails[0].message, /received and the application is awaiting review again/i);
  assert.match(sentEmails[1].message, /awaiting Finance verification/i);
  assert.match(sentEmails[2].message, /Attach a clearer document/);
  assert.match(sentEmails[3].message, /was not approved/i);
});

test('dispatches existing officer, finance, and completion templates by status', async () => {
  const sentEmails = [];
  const notifications = createApplicationEmailNotifications(async (email) => sentEmails.push(email));
  const request = {
    email: 'citizen@example.com',
    applicationId: 'EKB-2026-123456',
  };

  await notifications.applicationStatusUpdated({ ...request, status: 'APPROVED_BY_OFFICER' });
  await notifications.applicationStatusUpdated({ ...request, status: 'APPROVED_BY_FINANCE' });
  await notifications.applicationStatusUpdated({ ...request, status: 'COMPLETED' });

  assert.equal(sentEmails.length, 3);
  assert.match(sentEmails[0].subject, /payment required/i);
  assert.match(sentEmails[1].subject, /Finance approved/i);
  assert.match(sentEmails[2].message, /ready for collection/i);
});

test('does not throw or report success when delivery fails', async () => {
  const notifications = createApplicationEmailNotifications(async () => {
    throw new Error('SMTP unavailable');
  });
  const originalError = console.error;
  console.error = () => {};

  try {
    const result = await notifications.applicationSubmitted({
      email: 'citizen@example.com',
      applicationId: 'EKB-2026-123456',
    });
    assert.deepEqual(result, { sent: false, reason: 'SMTP unavailable' });
  } finally {
    console.error = originalError;
  }
});

test('reports a missing recipient rather than attempting delivery', async () => {
  let attemptedDelivery = false;
  const notifications = createApplicationEmailNotifications(async () => {
    attemptedDelivery = true;
  });
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const result = await notifications.documentReady({ applicationId: 'EKB-2026-123456' });
    assert.deepEqual(result, { sent: false, reason: 'Recipient email is missing' });
    assert.equal(attemptedDelivery, false);
  } finally {
    console.warn = originalWarn;
  }
});
