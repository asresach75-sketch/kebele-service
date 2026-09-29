const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/ekebele');

const createUsers = async () => {
  try {
    const defaultUsers = [
      { fullName: 'System Admin', email: 'admin@gmail.com', password: 'admin@1121', role: 'admin' },
      { fullName: 'Verifier User', email: 'verifier@gmail.com', password: 'verifier@1121', role: 'verifier' },
      { fullName: 'Vital User', email: 'vital@gmail.com', password: 'vital@1121', role: 'vital' },
      { fullName: 'Support Staff', email: 'support@gmail.com', password: 'support@1121', role: 'support' }
    ];

    await User.deleteMany({
      email: { $in: defaultUsers.map((user) => user.email) }
    });

    const records = await Promise.all(defaultUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10)
    })));

    await User.create(records);

    console.log('✅ Default seeded accounts are ready with the official passwords:');
    for (const user of defaultUsers) {
      console.log(`${user.email} / ${user.password}`);
    }
    mongoose.connection.close();
  } catch (err) {
    console.error('ስህተት ተፈጥሯል:', err);
    mongoose.connection.close();
  }
};

createUsers();
