const crypto = require('crypto');

const APP_ID = process.env.AGORA_APP_ID || '';
const CERTIFICATE = process.env.AGORA_CERTIFICATE || '';

const generateAgoraToken = (userId, channelName, role = 'subscriber', expireSeconds = 3600) => {
  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + expireSeconds;
  const uid = userId.toString();

  const payload = {
    appId: APP_ID,
    channelName,
    uid,
    role,
    expire: expireTime,
    iat: now,
    nbf: now,
  };

  const payloadStr = JSON.stringify(payload);
  const sign = crypto.createHmac('sha256', CERTIFICATE).update(payloadStr).digest('hex');
  const token = Buffer.from(`${sign}${payloadStr}`).toString('base64');

  return token;
};

module.exports = {
  generateAgoraToken,
};