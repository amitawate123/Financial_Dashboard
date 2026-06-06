const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const layout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1916; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">${escapeHtml(title)}</h1>
  ${bodyHtml}
  <p style="margin-top: 32px; font-size: 12px; color: #6b6860;">If you did not request this, you can ignore this email.</p>
</body>
</html>
`;

const verificationEmail = ({ name, verifyUrl }) => ({
  subject: 'Verify your Fintrack account',
  text: `Hi ${name},\n\nVerify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  html: layout(
    'Verify your email',
    `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for signing up. Confirm your email to start using Fintrack.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify email</a></p>
    <p style="font-size: 13px; color: #6b6860;">Or copy this link:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
  `
  ),
});

const passwordResetEmail = ({ name, resetUrl }) => ({
  subject: 'Reset your Fintrack password',
  text: `Hi ${name},\n\nReset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  html: layout(
    'Reset your password',
    `
    <p>Hi ${escapeHtml(name)},</p>
    <p>We received a request to reset your password.</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
    <p style="font-size: 13px; color: #6b6860;">Or copy this link:<br><a href="${resetUrl}">${resetUrl}</a></p>
  `
  ),
});

module.exports = { verificationEmail, passwordResetEmail };
