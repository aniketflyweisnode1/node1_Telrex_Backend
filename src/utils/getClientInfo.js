/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

/**
 * Parse user agent to extract device, browser, and OS info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      device: 'unknown',
      browser: 'unknown',
      os: 'unknown'
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device
  let device = 'desktop';
  if (ua.includes('mobile') || ua.includes('android')) {
    device = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet';
  }

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { device, browser, os };
};

/**
 * Get all client information from request
 */
const getClientInfo = (req) => {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const { device, browser, os } = parseUserAgent(userAgent);

  return {
    ipAddress,
    userAgent,
    device,
    browser,
    os
  };
};

module.exports = {
  getClientIp,
  parseUserAgent,
  getClientInfo
};

