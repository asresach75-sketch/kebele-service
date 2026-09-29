const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

mongoose.set('bufferCommands', false);

const emailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

app.locals.emailTransport = emailTransport;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ekebele';

const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const User = require('./models/User');
const Service = require('./models/ServiceRequest');
const feeRoutes = require('./routes/feeRoutes');
const marriageRoutes = require('./routes/marriageRoutes');
const createDocumentPdf = require('./utils/documentPdf');

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/workflow', serviceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/vital', marriageRoutes);
// applicationRoutes የሚለው ጠፍቷል ምክንያቱም ፋይሉ የለም፣ ሁሉም በ serviceRoutes በኩል ይስተናገዳል

// የተፈቀደን ሰነድ ወይም ፒዲኤፍ ፋይል በዳውንሎድ ለማግኘት የሚያስችል ራውት
const downloadDocument = async (req, res) => {
  try {
    const requestedId = req.params.id;
    const service = mongoose.isValidObjectId(requestedId)
      ? await Service.findById(requestedId)
      : await Service.findOne({ applicationId: requestedId });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = path.join(__dirname, 'uploads', `${service.applicationId}.pdf`);

    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      const pdfBuffer = await createDocumentPdf(service);
      fs.writeFileSync(filePath, pdfBuffer);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Kebele_Document_${service.applicationId}.pdf"`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: 'Server error during download' });
  }
};

app.get('/api/downloads/:id', downloadDocument);
app.get('/api/applications/download/:id', downloadDocument);

const multer = require('multer');

const seedAdminUser = async () => {
  try {
    const defaultUsers = [
      { email: 'admin@gmail.com', phone: '0911111111', password: 'admin@1121', role: 'admin', fullName: 'Administrator' },
      { email: 'officer@gmail.com', phone: '0912345678', password: 'officer@1121', role: 'officer', fullName: 'Kebele Officer' },
      { email: 'finance@gmail.com', phone: '0923456789', password: 'finance@1121', role: 'finance', fullName: 'Finance Officer' },
      { email: 'user@gmail.com', phone: '0934567890', password: 'user@1121', role: 'user', fullName: 'Demo User' }
    ];

    for (const userConfig of defaultUsers) {
      const existingUser = await User.findOne({ email: userConfig.email });

      if (!existingUser) {
        await User.create({
          fullName: userConfig.fullName,
          email: userConfig.email,
          phone: userConfig.phone,
          password: await bcrypt.hash(userConfig.password, 10),
          role: userConfig.role
        });
        console.log('✅ Default user created:', userConfig.email, 'with role:', userConfig.role);
        continue;
      }

      const storedPassword = typeof existingUser.password === 'string' ? existingUser.password : '';
      const legacyPlainTextMatch = storedPassword && storedPassword === userConfig.password;
      const hashedMatches = storedPassword ? await bcrypt.compare(userConfig.password, storedPassword).catch(() => false) : false;

      if (existingUser.role !== userConfig.role || !storedPassword || (!hashedMatches && !legacyPlainTextMatch)) {
        existingUser.role = userConfig.role;
        existingUser.fullName = userConfig.fullName;
        existingUser.phone = existingUser.phone || userConfig.phone;
        existingUser.password = await bcrypt.hash(userConfig.password, 10);
        await existingUser.save();
        console.log('🔐 User synchronized:', userConfig.email);
      } else if (legacyPlainTextMatch) {
        existingUser.phone = existingUser.phone || userConfig.phone;
        existingUser.password = await bcrypt.hash(userConfig.password, 10);
        await existingUser.save();
        console.log('🔐 Legacy password upgraded for:', userConfig.email);
      }
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
};

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected!');
    await seedAdminUser();
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exitCode = 1;
  }
};

startServer();

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('GLOBAL ERROR HANDLER:', err);

  const isInvalidJson = (
    err instanceof SyntaxError &&
    'body' in err &&
    err.status === 400
  ) || err.type === 'entity.parse.failed';

  if (isInvalidJson) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload sent by the client.' });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Please upload files smaller than 50MB.'
      : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Please upload files smaller than 50MB.' });
  }
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});