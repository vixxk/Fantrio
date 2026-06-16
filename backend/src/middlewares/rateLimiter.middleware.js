const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many auth requests from this IP, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter
};
