const twilio = require('twilio');
const logger = require('./logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Use API Key/Secret for better security if available, otherwise fallback to Account SID/Auth Token
let client;

try {
  if ((apiKey || accountSid) && (apiSecret || process.env.TWILIO_AUTH_TOKEN)) {
    client = twilio(apiKey || accountSid, apiSecret || process.env.TWILIO_AUTH_TOKEN, {
      accountSid: accountSid
    });
  } else {
    logger.warn('Twilio credentials missing. SMS functionality will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client:', error.message);
  // Don't crash the app, but log the error
}

/**
 * Send SMS message
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} body - Message body
 * @returns {Promise<Object>} Twilio response
 */
exports.sendSMS = async (to, body) => {
  try {
    if (!client || (process.env.NODE_ENV === 'development' && !twilioPhoneNumber)) {
      console.log(`📱 SMS Mock to ${to}: ${body}`);
      return { sid: 'mock_sid', status: 'sent' };
    }

    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to
    });

    logger.info(`SMS sent successfully to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otpCode - OTP code
 * @returns {Promise<Object>}
 */
exports.sendOtpSMS = async (phoneNumber, otpCode) => {
  const body = `Your Telerxs verification code is: ${otpCode}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.`;
  return await exports.sendSMS(phoneNumber, body);
};