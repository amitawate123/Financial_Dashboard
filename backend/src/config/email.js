const nodemailer = require('nodemailer');

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransport = () => {
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const getFromAddress = () =>
  process.env.EMAIL_FROM || 'Fintrack <noreply@localhost>';

module.exports = {
  isSmtpConfigured,
  createTransport,
  getClientUrl,
  getFromAddress,
};
