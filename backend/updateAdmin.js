const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/ekebele');

const updateAdmin = async () => {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin@1121';

    await User.deleteOne({ email });

    await User.create({
      fullName: 'System Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin'
    });

    console.log('✅ አድሚኑ በኢሜይል: admin@gmail.com እና ፓስወርድ: admin@1121 ተስተካክሏል!');
    mongoose.connection.close();
  } catch (err) {
    console.error('ስህተት ተፈጥሯል:', err);
    mongoose.connection.close();
  }
};

updateAdmin();
