const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/ekebele');

const createAdminUser = async () => {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin@1121';
    const phone = '0911111111';

    await User.deleteOne({ email });

    await User.create({
      fullName: 'System Admin',
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role: 'admin'
    });

    console.log('✅ አድሚኑ በተሳካ ሁኔታ ተፈጥሯል!');
    console.log('ኢሜይል: admin@gmail.com');
    console.log('ፓስወርድ: admin@1121');
    console.log('ስልክ: 0911111111');
    mongoose.connection.close();
  } catch (err) {
    console.error('ስህተት ተፈጥሯል:', err);
    mongoose.connection.close();
  }
};

createAdminUser();
