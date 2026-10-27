const bcrypt = require('bcryptjs');

async function upgradeLegacyPassword(UserModel, user, password) {
  if (!UserModel || !user || !password) {
    return false;
  }

  const storedPassword = typeof user.password === 'string' ? user.password : '';
  if (!storedPassword || storedPassword !== password) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.findByIdAndUpdate(
    user._id,
    { password: hashedPassword },
    { new: true, runValidators: false }
  );

  return true;
}

async function verifyStoredPassword(UserModel, user, password) {
  if (!user || !password || typeof password !== 'string') {
    return false;
  }

  const storedPassword = typeof user.password === 'string' ? user.password : '';
  if (!storedPassword) {
    return false;
  }

  if (storedPassword === password) {
    await upgradeLegacyPassword(UserModel, user, password).catch(() => false);
    return true;
  }

  try {
    const validHash = await bcrypt.compare(password, storedPassword);
    if (validHash) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
}

module.exports = { upgradeLegacyPassword, verifyStoredPassword };
