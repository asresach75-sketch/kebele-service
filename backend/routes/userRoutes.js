const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const { verifyAdmin } = require('../middleware/authMiddleware');

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

    if (normalizedFullName.split(/\s+/).length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must contain at least two words.' });
    }
    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Phone must be a valid Ethiopian number starting with 09 or 07.' });
    }
    if (String(password).length < 8 || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and role must be valid.' });
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
    res.status(500).json({ success: false, message: 'Server error creating staff account.' });
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

    if (!normalizedFullName || !normalizedPhone || !password) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሙሉ ስም፣ ስልክ ቁጥር እና የይለፍ ቃል ያስገቡ!' });
    }

    if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'ስልክ ቁጥር ትክክለኛ የኢትዮጵያ ስልክ ቁጥር መሆን አለበት።' });
    }

    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'የተሳሳተ ኢሜይል አድራሻ ነው።' });
    }

    const duplicateQuery = [{ phone: normalizedPhone }];
    if (normalizedEmail) duplicateQuery.push({ email: normalizedEmail });

    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ይህ ኢሜይል ወይም ስልክ ቀድሞ ተመዝግቧል!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: normalizedFullName,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      phone: normalizedPhone,
      password: hashedPassword,
      role: 'user'
    });
    await newUser.save();

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ዩዘር ሎጊን የሚያደርግበት
router.post('/login', async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.emailOrPhone || req.body.email || req.body.phone || '';
    const password = String(req.body.password || '');
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

    const storedPassword = typeof user.password === 'string' ? user.password : '';
    const isLegacyPlainMatch = storedPassword && storedPassword === password;
    let isMatch = false;

    if (storedPassword) {
      try {
        isMatch = await bcrypt.compare(password, storedPassword);
      } catch (error) {
        isMatch = false;
      }
    }

    if (!isMatch && isLegacyPlainMatch) {
      isMatch = true;
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'ኢሜይል ወይም ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም' });
    }

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, fullName: user.fullName }, secret, { expiresIn: '7d' });

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
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;