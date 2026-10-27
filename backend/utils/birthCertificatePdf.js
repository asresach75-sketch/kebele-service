const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const getEthiopicFontPath = () => {
  const candidates = [
    process.env.BIRTH_CERTIFICATE_FONT_PATH,
    'C:\\Windows\\Fonts\\ebrima.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansEthiopic-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansEthiopic[wdth,wght].ttf',
    '/usr/share/fonts/truetype/abyssinica/AbyssinicaSIL-Regular.ttf',
  ].filter(Boolean);
  return candidates.find((fontPath) => fs.existsSync(fontPath));
};

const createBirthCertificatePdf = async (application) => {
  const storedPhoto = application.webcamPhoto || application.childPhoto || '';
  const photoFilename = path.basename(String(storedPhoto));
  const photoExtension = path.extname(photoFilename).toLowerCase();
  const photoPath = ['.jpg', '.jpeg', '.png'].includes(photoExtension)
    ? path.join(__dirname, '..', 'uploads', photoFilename)
    : '';
  let childPhoto;
  if (photoPath) {
    try {
      childPhoto = await fs.promises.readFile(photoPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const ethiopicFontPath = getEthiopicFontPath();

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    const pageWidth = document.page.width;
    document.rect(0, 0, pageWidth, 108).fill('#0b4d9c');
    const flag = { x: 48, y: 24, width: 64, height: 42 };
    const stripeHeight = flag.height / 3;
    ['#078930', '#FCDD09', '#DA121A'].forEach((color, index) => {
      document.rect(flag.x, flag.y + stripeHeight * index, flag.width, stripeHeight).fill(color);
    });
    const emblemX = flag.x + flag.width / 2;
    const emblemY = flag.y + flag.height / 2;
    document.fillColor('#0F47AF').circle(emblemX, emblemY, 10).fill();
    const starPoints = Array.from({ length: 10 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const radius = index % 2 === 0 ? 7 : 3;
      return {
        x: emblemX + Math.cos(angle) * radius,
        y: emblemY + Math.sin(angle) * radius,
      };
    });
    document.fillColor('#FCDD09').moveTo(starPoints[0].x, starPoints[0].y);
    starPoints.slice(1).forEach((point) => document.lineTo(point.x, point.y));
    document.closePath().fill();
    document.lineWidth(1).strokeColor('#ffffff').rect(flag.x, flag.y, flag.width, flag.height).stroke();

    document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14)
      .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', 126, 22, {
        width: pageWidth - 174,
        height: 20,
        lineBreak: false,
        align: 'center',
      });
    document.font('Helvetica').fontSize(10)
      .text('Vital Events Registration - Birth Certificate', 126, 49, {
        width: pageWidth - 174,
        height: 14,
        lineBreak: false,
        align: 'center',
      });
    if (ethiopicFontPath) {
      document.font(ethiopicFontPath).fontSize(10)
        .text('የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ', 126, 72, {
          width: pageWidth - 174,
          height: 15,
          lineBreak: false,
          align: 'center',
        });
    }

    document.fillColor('#172033').font('Helvetica-Bold').fontSize(19)
      .text('BIRTH REGISTRATION CERTIFICATE', 48, 135, { align: 'center' });
    document.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Official certificate issued after Finance verification', 48, 164, { align: 'center' });
    if (ethiopicFontPath) {
      document.font(ethiopicFontPath).fontSize(10).fillColor('#64748b')
        .text('የልደት ምዝገባ ምስክር ወረቀት', 48, 178, { align: 'center' });
    }

    document.lineWidth(2).strokeColor('#d5a928').rect(48, 194, pageWidth - 96, 420).stroke();

    const photoBox = { x: 68, y: 246, width: 104, height: 132 };
    document.lineWidth(1.5).strokeColor('#d5a928').rect(
      photoBox.x - 3,
      photoBox.y - 3,
      photoBox.width + 6,
      photoBox.height + 6,
    ).stroke();
    if (childPhoto) {
      document.image(childPhoto, photoBox.x, photoBox.y, {
        fit: [photoBox.width, photoBox.height],
        align: 'center',
        valign: 'center',
      });
    } else {
      document.fillColor('#f1f5f9').rect(photoBox.x, photoBox.y, photoBox.width, photoBox.height).fill();
      document.fillColor('#64748b').font('Helvetica').fontSize(9)
        .text('CHILD PHOTO', photoBox.x, photoBox.y + 55, { width: photoBox.width, align: 'center' });
    }
    document.fillColor('#475569').font('Helvetica-Bold').fontSize(8)
      .text('CHILD PHOTO', photoBox.x - 3, photoBox.y + photoBox.height + 8, {
        width: photoBox.width + 6,
        align: 'center',
      });

    const rows = [
      ['የልጅ ሙሉ ስም', 'Child full name', application.childFullName || application.childName || application.fullName || 'Not recorded'],
      ['ጾታ', 'Gender', application.gender || application.childGender || 'Not recorded'],
      ['የልደት ቀን', 'Date of birth', application.dob || application.childDob || application.dateOfBirth || 'Not recorded'],
      ['የትውልድ ቦታ', 'Place of birth', application.pob || application.placeOfBirth || 'Not recorded'],
      ['የአባት ሙሉ ስም', 'Father full name', application.fatherFullName || application.fatherName || 'Not recorded'],
      ['የአባት ዜግነት', 'Father nationality', application.fatherNationality || 'Not recorded'],
      ['የእናት ሙሉ ስም', 'Mother full name', application.motherFullName || application.motherName || 'Not recorded'],
      ['የእናት ዜግነት', 'Mother nationality', application.motherNationality || 'Not recorded'],
      ['የተመዘገበበት አድራሻ', 'Registered address', [application.region, application.zone, application.wereda || application.woreda, application.country].filter(Boolean).join(', ') || 'Not recorded'],
      ['የማመልከቻ ቁጥር', 'Application number', application.applicationId || 'Not recorded'],
      ['የምዝገባ ቀን', 'Registration date', new Date(application.registrationDate || application.completedAt || application.createdAt || Date.now()).toLocaleDateString('en-US')],
      ['የመዝጋቢው ስም', 'Registrar', application.registrarName || 'Kebele Officer'],
    ];

    let y = 211;
    const labelX = 190;
    const valueX = 316;
    const valueWidth = pageWidth - 48 - valueX - 14;
    rows.forEach(([labelAm, labelEn, value], index) => {
      if (ethiopicFontPath) {
        document.fillColor('#526174').font(ethiopicFontPath).fontSize(8)
          .text(labelAm, labelX, y + 1, { width: 116, height: 11, lineBreak: false });
      }
      document.fillColor('#526174').font('Helvetica-Bold').fontSize(7.5)
        .text(labelEn, labelX, y + (ethiopicFontPath ? 13 : 3), {
          width: 116,
          height: 10,
          lineBreak: false,
        });
      document.fillColor('#172033').font('Helvetica').fontSize(9.5)
        .text(String(value), valueX, y + 3, { width: valueWidth, lineBreak: true });
      const valueHeight = document.heightOfString(String(value), { width: valueWidth, font: 'Helvetica', fontSize: 9.5 });
      const rowHeight = Math.max(32, valueHeight + 8);
      if (index < rows.length - 1) {
        document.lineWidth(0.35).strokeColor('#e2e8f0')
          .moveTo(labelX, y + rowHeight).lineTo(pageWidth - 62, y + rowHeight).stroke();
      }
      y += rowHeight;
    });

    document.strokeColor('#94a3b8').lineWidth(1).moveTo(70, 704).lineTo(250, 704).stroke();
    document.fillColor('#475569').font('Helvetica').fontSize(9)
      .text('Authorized Officer Signature', 70, 710, { width: 180, align: 'center' });
    document.strokeColor('#94a3b8').moveTo(285, 704).lineTo(445, 704).stroke();
    document.text('Official Seal', 285, 710, { width: 160, align: 'center' });
    if (ethiopicFontPath) {
      document.font(ethiopicFontPath).fontSize(8)
        .text('የባለሥልጣኑ ፊርማ', 70, 723, { width: 180, align: 'center' });
      document.text('የቀበሌ ማኅተም', 285, 723, { width: 160, align: 'center' });
    }

    document.fillColor('#64748b').fontSize(8)
      .text(`Issued ${new Date(application.completedAt || Date.now()).toLocaleString('en-US')} | ${application.applicationId}`, 48, 770, {
        width: pageWidth - 96,
        align: 'center',
      });

    document.end();
  });
};

module.exports = createBirthCertificatePdf;
