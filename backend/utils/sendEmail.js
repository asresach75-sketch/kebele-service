const nodemailer = require('nodemailer');

const maskEmail = (email) => {
  const [localPart, domain] = String(email).split('@');
  if (!domain) return '[invalid recipient]';
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Email credentials are not configured. Set EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS.');
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass }
  });
};

const sendEmail = async (options) => {
  if (!options?.email) {
    throw new Error('Recipient email is required.');
  }

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Digital E-Kebele Portal" <${user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    ...(options.html ? { html: options.html } : {})
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${maskEmail(options.email)}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Email delivery failed to ${maskEmail(options.email)}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
