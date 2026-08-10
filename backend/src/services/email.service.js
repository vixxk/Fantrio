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
  send2FACode
};
