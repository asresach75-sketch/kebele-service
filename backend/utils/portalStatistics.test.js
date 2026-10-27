const test = require('node:test');
const assert = require('node:assert/strict');
const countPortalStatistics = require('./portalStatistics');

test('counts citizen accounts, completed requests, and completed ID services separately', async () => {
  const userFilters = [];
  const serviceFilters = [];
  const User = {
    countDocuments: async (filter) => {
      userFilters.push(filter);
      return 12;
    },
  };
  const ServiceRequest = {
    countDocuments: async (filter) => {
      serviceFilters.push(filter);
      return filter.serviceType ? 5 : 9;
    },
  };

  const stats = await countPortalStatistics(User, ServiceRequest);

  assert.deepEqual(stats, { registeredCitizens: 12, completedApplications: 9, idsIssued: 5 });
  assert.deepEqual(userFilters, [{ role: 'user' }]);
  assert.deepEqual(serviceFilters, [
    { status: 'COMPLETED' },
    {
      status: 'COMPLETED',
      serviceType: { $in: ['NEW_ID_CARD', 'New ID Card', 'ID_RENEWAL', 'ID_REPLACEMENT', 'ID Renewal', 'ID Replacement'] },
    },
  ]);
});

test('propagates database errors instead of returning misleading zero totals', async () => {
  const User = { countDocuments: async () => { throw new Error('database unavailable'); } };
  const ServiceRequest = { countDocuments: async () => 0 };

  await assert.rejects(
    countPortalStatistics(User, ServiceRequest),
    /database unavailable/,
  );
});
