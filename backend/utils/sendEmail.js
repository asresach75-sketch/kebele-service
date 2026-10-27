const nodemailer = require('nodemailer');
let transporter;

const maskEmail = (email) => {
  const [localPart, domain] = String(email).split('@');
  if (!domain) return '[invalid recipient]';
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const getTransporter = () => {
  if (transporter) return transporter;

  const resendApiKey = process.env.RESEND_API_KEY;
  const user = resendApiKey ? 'resend' : process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = resendApiKey || process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Email credentials are not configured. Set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transportOptions = {
    host: resendApiKey
      ? process.env.RESEND_SMTP_HOST || 'smtp.resend.com'
      : process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass }
  };
  transporter = nodemailer.createTransport(transportOptions);
  return transporter;
};

const sendEmail = async (options) => {
  if (!options?.email) {
    throw new Error('Recipient email is required.');
  }

  const user = process.env.RESEND_API_KEY ? 'resend' : process.env.EMAIL_USER || process.env.SMTP_USER;
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.RESEND_API_KEY
      ? process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'E-Kebele Portal <onboarding@resend.dev>'
      : process.env.SMTP_FROM || `"Digital E-Kebele Portal" <${user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    ...(options.html ? { html: options.html } : {})
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    const acceptedRecipients = (result.accepted || []).map((recipient) => (
      typeof recipient === 'string' ? recipient : recipient.address
    ));
    if (!acceptedRecipients.some((recipient) => String(recipient).toLowerCase() === options.email.toLowerCase())) {
      throw new Error('The email provider did not accept the recipient address.');
    }
    console.log(`Email accepted by provider for ${maskEmail(options.email)}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Email delivery failed to ${maskEmail(options.email)}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
