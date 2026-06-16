const crypto = require('crypto');

/**
 * Generate a ZegoCloud server token for call room authorization
 * @param {string} userId - ID of the user joining the call
 * @param {string} roomId - ID of the room
 * @param {number} privilege - Privilege flag (1 = login, 2 = publish, etc.)
 * @param {number} expireSeconds - Token expiration duration (default 1 hour)
 * @returns {string} - Base64 encoded token
 */
const generateZegoToken = (userId, roomId, privilege = 1, expireSeconds = 3600) => {
  const appId = parseInt(process.env.ZEGO_APP_ID || '12345678', 10);
  const serverSecret = process.env.ZEGO_SERVER_SECRET || 'abcdef0123456789abcdef0123456789';

  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + expireSeconds;

  const payload = {
    app_id: appId,
    user_id: userId.toString(),
    room_id: roomId,
    privilege: {
      1: privilege,
      2: privilege
    },
    expire_time: expireTime,
    nonce: Math.floor(Math.random() * 2147483647),
    create_time: now
  };

  const payloadStr = JSON.stringify(payload);

  // Encrypt payload using AES-128-CBC
  const key = crypto.createHash('md5').update(serverSecret).digest();
  const iv = Buffer.alloc(16, 0); // Zego standard zero initialization vector

  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encrypted = cipher.update(payloadStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Prefix version identifier "04"
  const token = '04' + Buffer.from(encrypted, 'base64').toString('base64');
  return token;
};

module.exports = {
  generateZegoToken
};
