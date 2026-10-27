const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { assertSecurityConfiguration } = require('./utils/securityConfig');
const multer = require('multer');

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

const securityConfig = assertSecurityConfiguration();
app.use(cors({
  origin(origin, callback) {
    if (!origin || securityConfig.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ekebele_db';

const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const Service = require('./models/ServiceRequest');
const feeRoutes = require('./routes/feeRoutes');
const marriageRoutes = require('./routes/marriageRoutes');
const birthCertificateRoutes = require('./routes/birthCertificateRoutes');
const auditRoutes = require('./routes/auditRoutes');
const createDocumentPdf = require('./utils/documentPdf');

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/workflow', serviceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/vital', marriageRoutes);
app.use('/api/birth-certificate', birthCertificateRoutes);
app.use('/api/admin/audit-logs', auditRoutes);
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
    if (service.status !== 'COMPLETED') {
      return res.status(403).json({ success: false, message: 'The document is not yet ready for release.' });
    }

    const filePath = path.join(__dirname, 'uploads', `${service.applicationId}.pdf`);
    const pdfBuffer = await createDocumentPdf(service);
    fs.writeFileSync(filePath, pdfBuffer);

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

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ database: { connected } });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected!');
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

  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Please upload files no larger than 5MB.'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? `Unexpected file field "${err.field}". Ensure the frontend and backend use matching upload field names.`
      : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Please upload files no larger than 5MB.' });
  }
  const statusCode = err.status === 413 ? 413 : 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 413 ? 'Request body is too large.' : err.message || 'Server error'
  });
});