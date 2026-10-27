const countPortalStatistics = async (User, ServiceRequest) => {
  const [registeredCitizens, completedApplications, idsIssued] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    ServiceRequest.countDocuments({ status: 'COMPLETED' }),
    ServiceRequest.countDocuments({
      status: 'COMPLETED',
      serviceType: {
        $in: ['NEW_ID_CARD', 'New ID Card', 'ID_RENEWAL', 'ID_REPLACEMENT', 'ID Renewal', 'ID Replacement'],
      },
    }),
  ]);

  return { registeredCitizens, completedApplications, idsIssued };
};

module.exports = countPortalStatistics;
