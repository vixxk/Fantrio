const { RtcTokenBuilder, RtcRole } = require('agora-token');

const APP_ID = process.env.AGORA_APP_ID || '8834c7bd129d4aba90bc322fdba03b4b';
const CERTIFICATE = process.env.AGORA_CERTIFICATE || '160786f9a6d543a2ab8d2399cb33bbf7';

const generateAgoraToken = (userId, channelName, roleInput = 'publisher', expireSeconds = 3600) => {
  const uidStr = userId ? userId.toString() : 'guest';
  const role = (roleInput === 'subscriber' || roleInput === 2) ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  if (!APP_ID || !CERTIFICATE) {
    return null;
  }

  try {
    return RtcTokenBuilder.buildTokenWithUserAccount(
      APP_ID,
      CERTIFICATE,
      channelName,
      uidStr,
      role,
      expireSeconds,
      expireSeconds
    );
  } catch (err) {
    console.error('Failed to generate Agora token:', err);
    return null;
  }
};

module.exports = {
  generateAgoraToken,
  APP_ID
};