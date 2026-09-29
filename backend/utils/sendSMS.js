const sendSMS = async (phoneNumber, message) => {
  if (!phoneNumber) {
    console.log('[SMS SIMULATION] No phone number available.');
    return false;
  }

  console.log('\n================ [SMS SENT SIMULATION] ================');
  console.log(`TO: ${phoneNumber}`);
  console.log(`MESSAGE: ${message}`);
  console.log('=========================================================\n');
  return true;
};

module.exports = sendSMS;
