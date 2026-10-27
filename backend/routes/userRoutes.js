const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const { verifyAdmin } = require('../middleware/authMiddleware');
const { verifyStoredPassword } = require('../utils/loginPasswordUpgrade');
const { mapUserApiError } = require('../utils/userApiError');
const writeAuditLog = require('../utils/writeAuditLog');
const { isStrongPassword } = require('../utils/passwordValidation');
const { isValidIdApplicantName } = require('../utils/idApplicationInputValidation');
const sendEmail = require('../utils/sendEmail');
const {
  createPasswordResetToken,
  hashPasswordResetToken,
} = require('../utils/passwordResetToken');
const { getJwtSecret } = require('../utils/securityConfig');

router.post('/password-reset/request', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3001');
    if (!['http:', 'https:'].includes(frontendUrl.protocol)) {
      throw new Error('FRONTEND_URL must use HTTP or HTTPS.');
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for that email, a password reset link will be sent.',
      });
    }

    const now = new Date();
    if (user.passwordResetRequestedAt && now - user.passwordResetRequestedAt < 60 * 1000) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for that email, a password reset link will be sent.',
      });
    }

    const { token, tokenHash } = createPasswordResetToken();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: now,
    });

    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your E-Kebele password',
        message: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl.toString()}`,
        html: `<p>A password reset was requested for your E-Kebele account.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`,
      });
    } catch (error) {
      try {
        await User.findByIdAndUpdate(user._id, {
          $unset: {
            passwordResetTokenHash: 1,
            passwordResetExpiresAt: 1,
            passwordResetRequestedAt: 1,
          },
        });
      } catch (cleanupError) {
        console.error('Failed to clear an undelivered password reset token:', cleanupError.message);
      }
      console.error('Password reset email delivery failed:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Password reset email could not be sent. Please try again later or contact support.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a password reset link will be sent.',
    });
  } catch (error) {
    console.error('Password reset request failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Password reset could not be started. Please try again later.',
    });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!/^[a-f0-9]{64}$/.test(token) || !isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'The reset link or password is invalid. Use a valid link and a strong password.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: hashPasswordResetToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        password: passwordHash,
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
          passwordResetRequestedAt: 1,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired. Request a new link.',
      });
    }

    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Password reset confirmation failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Password could not be reset. Please try again later.',
    });
  }
});

router.get('/', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/staff', verifyAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    const normalizedFullName = String(fullName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const allowedRoles = ['officer', 'finance', 'support', 'verifier', 'vital', 'admin'];
    const phoneRegex = /^(09|07)\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedFullName.split(/\s+/).length < 2 || !isValidIdApplicantName(normalizedFullName)) {
      return res.status(400).json({ success: false, message: 'Full name must contain at least two words, with at least 3 letters in each word.' });
    }
    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Phone must be a valid Ethiopian number starting with 09 or 07.' });
    }
    if (!isStrongPassword(password) || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Password must meet the password requirements and role must be valid.' });
    }

    const duplicateQuery = [];
    if (normalizedEmail) duplicateQuery.push({ email: normalizedEmail });
    if (normalizedPhone) duplicateQuery.push({ phone: normalizedPhone });
    if (!duplicateQuery.length) {
      return res.status(400).json({ success: false, message: 'Phone is required.' });
    }
    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email or phone already exists.' });
    }

    const newStaff = await User.create({
      fullName: normalizedFullName,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      phone: normalizedPhone,
      password: await bcrypt.hash(password, 10),
      role
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      user: {
        id: newStaff._id,
        fullName: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role
      }
    });
  } catch (error) {
    const mapped = mapUserApiError(error, 'Server error creating staff account.');
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }
});

router.patch('/:id/block', verifyAdmin, async (req, res) => {
  try {
    if (typeof req.body.isBlocked !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isBlocked must be a boolean.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: req.body.isBlocked },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: 'The active administrator account cannot be deleted.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const relatedFilters = [{ userId: String(user._id) }];
    if (user.email) relatedFilters.push({ email: user.email });
    if (user.phone) relatedFilters.push({ phoneNumber: user.phone }, { phone: user.phone });
    const deletedApplications = await ServiceRequest.deleteMany({ $or: relatedFilters });
    return res.status(200).json({ success: true, message: 'User and related applications deleted successfully.', deletedApplications: deletedApplications.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// የተጠቃሚ ምዝገባ (Signup) ራውት
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const normalizedFullName = String(fullName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const phoneRegex = /^(09|07)\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሙሉ ስም፣ ኢሜይል፣ ስልክ ቁጥር እና የይለፍ ቃል ያስገቡ!' });
    }
    if (!isValidIdApplicantName(normalizedFullName)) {
      return res.status(400).json({ success: false, message: 'እያንዳንዱ የስም ክፍል ፊደል ብቻ የያዘና ቢያንስ 3 ፊደላት ያሉት መሆን አለበት።' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች፣ አንድ ትልቅ ፊደል፣ አንድ ትንሽ ፊደል፣ ቁጥር እና ልዩ ምልክት (@ # $ % ! & *) መያዝ አለበት።'
      });
    }

    if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'ስልክ ቁጥር ትክክለኛ የኢትዮጵያ ስልክ ቁጥር መሆን አለበት።' });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'የተሳሳተ ኢሜይል አድራሻ ነው።' });
    }

    const duplicateQuery = [{ phone: normalizedPhone }];
    duplicateQuery.push({ email: normalizedEmail });

    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ይህ ኢሜይል ወይም ስልክ ቀድሞ ተመዝግቧል!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: 'user'
    });

    try {
      await newUser.save();
    } catch (error) {
      const mapped = mapUserApiError(error, 'Server error creating account.');
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email, fullName: newUser.fullName },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'በተሳካ ሁኔታ ተመዝግበዋል!',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    const mapped = mapUserApiError(error, 'Server error creating account.');
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }
});

// ዩዘር ሎጊን የሚያደርግበት
router.post('/login', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const rawIdentifier = body.identifier || body.emailOrPhone || body.email || body.phone || '';
    const password = String(body.password || '');
    const identifier = String(rawIdentifier).trim();
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'እባክዎን ኢሜይል/ስልክ እና ፓስወርድ ያስገቡ!' });
    }

    const normalizedEmail = identifier.toLowerCase();
    const user = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: identifier }] });
    if (!user) {
      return res.status(400).json({ success: false, message: 'ኢሜይል ወይም ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ይህ መለያ ታግዷል። እባክዎ አስተዳዳሪውን ያነጋግሩ።' });
    }

    const isMatch = await verifyStoredPassword(User, user, password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'ኢሜይል ወይም ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም' });
    }

    const secret = getJwtSecret();
    const expiresIn = body.rememberMe === true ? '30d' : body.rememberMe === false ? '1d' : '7d';
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, fullName: user.fullName }, secret, { expiresIn });
    if (user.role !== 'user') {
      await writeAuditLog({
        req,
        actor: user,
        action: 'LOGIN_SUCCESS',
        details: 'Staff member signed in successfully.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'በተሳካ ሁኔታ ገብተዋል',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    const mapped = mapUserApiError(error, 'Server error during login.');
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }
});

module.exports = router;