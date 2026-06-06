const nodemailer = require('nodemailer');
const { createTransport, isSmtpConfigured, getClientUrl, getFromAddress } = require('../../config/email');
const { verificationEmail, passwordResetEmail } = require('./emailTemplates');

let transport;

const getTransport = () => {
  if (!transport && isSmtpConfigured()) {
    transport = createTransport();
  }
  return transport;
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = getTransport();

  if (!transporter) {
    console.log('\n📧 Email (SMTP not configured) — would send:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   ${text.split('\n').join('\n   ')}\n`);
    return { devMode: true };
  }

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview && process.env.NODE_ENV !== 'production') {
    console.log(`📧 Preview: ${preview}`);
  }

  return info;
};

const buildVerifyUrl = (token) =>
  `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;

const buildResetUrl = (token) =>
  `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`;

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = buildVerifyUrl(token);
  const template = verificationEmail({ name: user.name, verifyUrl });
  return sendMail({ to: user.email, ...template });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = buildResetUrl(token);
  const template = passwordResetEmail({ name: user.name, resetUrl });
  return sendMail({ to: user.email, ...template });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  buildVerifyUrl,
  buildResetUrl,
  isSmtpConfigured,
};
