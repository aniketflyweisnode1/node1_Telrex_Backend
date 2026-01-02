const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send OTP via email
 */
exports.sendOtpEmail = async (email, otpCode) => {
  try {
    // If SMTP not configured, log to console (for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 OTP Email to ${email}: ${otpCode}`);
      return { success: true, message: 'OTP logged to console (SMTP not configured)' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'no-reply@telerxs.com',
      to: email,
      subject: 'Your Login OTP - Telerxs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Login OTP</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
          </div>
          <p>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Telerxs. Please do not reply.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP Email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error - log to console as fallback
    console.log(`📧 OTP Email to ${email}: ${otpCode}`);
    return { success: false, error: error.message };
  }
};

