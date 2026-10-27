const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { getDocumentVerificationUrl } = require('./documentVerification');
const getDigitalIdCardMetadata = require('./digitalIdCardMetadata');
const { isValidIdApplicantName } = require('./idApplicationInputValidation');

const formatDisplayName = (name) => {
  const normalizedName = String(name || '').trim();
  if (!isValidIdApplicantName(normalizedName)) return 'Update required';
  return normalizedName
    .split(/\s+/)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase())
    .join(' ');
};

const formatCardDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Not recorded' : value.toISOString().slice(0, 10);
  }

  const raw = String(value || '').trim();
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const usDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) return `${usDate[3]}-${usDate[1].padStart(2, '0')}-${usDate[2].padStart(2, '0')}`;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? 'Not recorded' : parsed.toISOString().slice(0, 10);
};

const createDigitalIdCardPdf = async (service) => {
  const verificationUrl = getDocumentVerificationUrl(service.applicationId);
  const qrCode = await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 480,
  });
  const storedPhotoPath = service.webcamPhoto || service.passportPhoto;
  let photoBuffer = null;
  if (storedPhotoPath) {
    const photoName = path.basename(String(storedPhotoPath).replaceAll('\\', '/'));
    const photoFormat = path.extname(photoName).slice(1).toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(photoFormat)) {
      throw new Error('The applicant photo must be a JPG or PNG image.');
    }
    photoBuffer = await fs.promises.readFile(path.join(__dirname, '..', 'uploads', photoName));
  }

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: [540, 340],
      margin: 0,
      compress: false,
      info: { Title: `E-Kebele Digital ID ${service.applicationId}` },
    });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    const applicantName = formatDisplayName(service.fullName);
    const {
      issueDate,
      expiryDate,
      emergencyName,
      emergencyPhone,
      issuedBy,
    } = getDigitalIdCardMetadata(service);

    document.roundedRect(8, 8, 524, 324, 16).fill('#f8fafc');
    document.roundedRect(8, 8, 524, 72, 16).fill('#0b4d9c');
    document.rect(8, 64, 524, 16).fill('#0b4d9c');
    document.rect(24, 10, 164, 4).fill('#078930');
    document.rect(188, 10, 164, 4).fill('#FCDD09');
    document.rect(352, 10, 164, 4).fill('#DA121A');
    document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(17)
      .text('E-KEBELE DIGITAL ID', 28, 27, { width: 484, align: 'center' });
    document.font('Helvetica').fontSize(9)
      .text('SERVICE PORTAL IDENTIFICATION', 28, 51, { width: 484, align: 'center' });

    document.roundedRect(28, 94, 86, 112, 6).fillAndStroke('#e8eef7', '#0b4d9c');
    if (photoBuffer) {
      document.image(photoBuffer, 32, 98, { cover: [78, 104] });
    } else {
      document.fillColor('#0b4d9c').font('Helvetica-Bold').fontSize(36)
        .text(applicantName.charAt(0).toUpperCase(), 28, 137, { width: 86, align: 'center' });
    }

    document.fillColor('#64748b').font('Helvetica-Bold').fontSize(8)
      .text('FULL NAME', 128, 94)
      .text('ID NUMBER', 128, 133)
      .text('DATE OF BIRTH', 128, 170)
      .text('OCCUPATION', 128, 207)
      .text('GENDER', 282, 133)
      .text('NATIONALITY', 282, 170)
      .text('EXPIRY DATE', 282, 207);

    document.fillColor('#172033').font('Helvetica-Bold').fontSize(13)
      .text(applicantName, 128, 108, { width: 278, ellipsis: true })
      .text(service.nationalId || service.applicationId, 128, 147, { width: 145, ellipsis: true })
      .text(formatCardDate(service.dateOfBirth), 128, 184, { width: 145 })
      .text(service.occupation || 'Not recorded', 128, 221, { width: 145, ellipsis: true })
      .text(service.gender || 'Not recorded', 282, 147, { width: 122 })
      .text(service.nationality || 'Ethiopian', 282, 184, { width: 122 })
      .text(formatCardDate(expiryDate), 282, 221, { width: 122 });

    document.image(qrCode, 418, 94, { fit: [96, 96] });
    document.fillColor('#334155').font('Helvetica-Bold').fontSize(7)
      .text('SCAN TO VERIFY', 416, 195, { width: 100, align: 'center' });

    document.moveTo(24, 232).lineTo(516, 232).lineWidth(1).strokeColor('#dbe3ee').stroke();
    document.fillColor('#64748b').font('Helvetica-Bold').fontSize(8)
      .text('ADDRESS', 28, 240)
      .text('EMERGENCY CONTACT', 28, 289)
      .text('FINANCE VERIFIED BY', 350, 240);
    document.fillColor('#172033').font('Helvetica').fontSize(9)
      .text(`Region: ${service.region || 'Not recorded'}`, 28, 251, { width: 300, height: 12, ellipsis: true })
      .text(`Zone: ${service.zone || 'Not recorded'}`, 28, 263, { width: 300, height: 12, ellipsis: true })
      .text(`Woreda / Kebele: ${[service.woreda, service.kebele].filter(Boolean).join(', ') || 'Not recorded'}`, 28, 275, { width: 300, height: 12, ellipsis: true })
      .text(`${emergencyName} · ${emergencyPhone}`, 28, 301, { width: 310, height: 12, ellipsis: true })
      .text(issuedBy, 350, 252, { width: 105, height: 28, ellipsis: true });

    document.circle(484, 278, 24).lineWidth(1.5).strokeColor('#0b4d9c').stroke();
    document.circle(484, 278, 21).lineWidth(0.5).strokeColor('#0b4d9c').stroke();
    document.fillColor('#0b4d9c').font('Helvetica-Bold').fontSize(6)
      .text('E-KEBELE', 461, 272, { width: 46, align: 'center' })
      .text('PORTAL VERIFIED', 461, 281, { width: 46, align: 'center' });

    document.moveTo(24, 316).lineTo(516, 316).lineWidth(1).strokeColor('#dbe3ee').stroke();
    document.fillColor('#475569').font('Helvetica').fontSize(7)
      .text(`Issued ${formatCardDate(issueDate)}`, 28, 322)
      .text('E-Kebele portal card; not a government-issued national ID.', 28, 332, { width: 484, align: 'center' });

    document.end();
  });
};

module.exports = createDigitalIdCardPdf;
module.exports.formatCardDate = formatCardDate;
module.exports.formatDisplayName = formatDisplayName;
