const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@fantrio.com',
    to,
    subject,
    text,
    html
  };

  await transporter.sendMail(mailOptions);
};

const sendOTP = async (email, otp) => {
  const subject = 'Your Fantrio Verification OTP';
  const text = `Your verification code is: ${otp}. It is valid for 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Verify Your Email</h2>
      <p>Thank you for registering with Fantrio. Your One-Time Password (OTP) for registration is:</p>
      <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; display: inline-block; letter-spacing: 2px; border-radius: 5px; margin: 10px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
    </div>
  `;
  await sendEmail(email, subject, text, html);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const subject = 'Fantrio Password Reset Link';
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const text = `Click this link to reset your password: ${resetUrl}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  `;
  await sendEmail(email, subject, text, html);
};

// Escape free-text content before interpolating it into HTML email templates.
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendTicketReplyNotification = async (email, { ticketId, subject, reply, status }) => {
  const ticketCode = `#TK-${String(ticketId).slice(-6).toUpperCase()}`;
  const statusLabel = (status || 'open').replace('-', ' ');
  const subjectLine = `Fantrio Support: ${ticketCode} has been updated`;
  const text = `Your support ticket ${ticketCode} ("${subject}") has received a response from our team.\n\n${reply}\n\nTicket status: ${statusLabel}\n\nThanks,\nThe Fantrio Support Team`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #e10075; margin: 0 0 4px 0;">Your Ticket Has Been Answered</h2>
      <p style="color: #666; margin: 0 0 16px 0;">${ticketCode} &middot; ${escapeHtml(subject)}</p>
      <div style="border-left: 3px solid #e10075; background: #fafafa; padding: 12px 16px; border-radius: 4px; color: #333; margin-bottom: 16px; white-space: pre-wrap;">${escapeHtml(reply)}</div>
      <p style="color: #888; margin: 0 0 16px 0;">Ticket status: <strong>${escapeHtml(statusLabel)}</strong></p>
      <p style="color: #888; margin: 0;">You can track your ticket anytime in the Fantrio app under Settings &gt; My Support Tickets.</p>
    </div>
  `;
  await sendEmail(email, subjectLine, text, html);
};

const send2FACode = async (email, code) => {
  const subject = 'Your Fantrio 2FA Verification Code';
  const text = `Your two-factor authentication code is: ${code}. It is valid for 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Two-Factor Authentication</h2>
      <p>Your Fantrio two-factor authentication code is:</p>
      <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; display: inline-block; letter-spacing: 2px; border-radius: 5px; margin: 10px 0;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes. If you did not attempt to sign in, please secure your account immediately.</p>
    </div>
  `;
  await sendEmail(email, subject, text, html);
};

module.exports = {
  sendEmail,
  sendOTP,
  sendPasswordResetEmail,
  send2FACode,
  sendTicketReplyNotification
};
