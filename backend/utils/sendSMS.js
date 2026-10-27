const UserNotification = require('../models/UserNotification');

const sendSMS = async (phoneNumber, message, { userId, applicationId } = {}) => {
  const deliveryStatus = phoneNumber ? 'simulated' : 'unavailable';
  if (!phoneNumber) {
    console.log('[SMS SIMULATION] No phone number available.');
  } else {
    console.log('\n================ [SMS SENT SIMULATION] ================');
    console.log(`TO: ${phoneNumber}`);
    console.log(`MESSAGE: ${message}`);
    console.log('=========================================================\n');
  }

  if (userId && applicationId) {
    try {
      await UserNotification.create({ userId, applicationId, deliveryStatus, message });
    } catch (error) {
      console.error('SMS notification record failed:', error.message);
    }
  }
  return Boolean(phoneNumber);
};

module.exports = sendSMS;
