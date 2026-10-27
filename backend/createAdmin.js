const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/User');
const { isStrongPassword } = require('./utils/passwordValidation');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const createAdminUser = async () => {
  const fullName = String(process.env.ADMIN_FULL_NAME || '').trim();
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const phone = String(process.env.ADMIN_PHONE || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (
    !fullName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^(09|07)\d{8}$/.test(phone) ||
    !isStrongPassword(password)
  ) {
    throw new Error('Set ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_PHONE, and a strong ADMIN_PASSWORD in backend/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ekebele_db');
  await User.findOneAndUpdate(
    { email },
    {
      fullName,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      isBlocked: false,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin account configured for ${email}.`);
};

createAdminUser()
  .catch((error) => {
    console.error('Admin account setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
