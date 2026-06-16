const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret'
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'fantrio';

/**
 * Generate a presigned URL for uploading a file (PUT method)
 * @param {string} key - The destination key (file path) in S3
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<string>} - The presigned upload URL
 */
const getPresignedUploadUrl = async (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  // Expire in 15 minutes
  return await getSignedUrl(s3Client, command, { expiresIn: 900 });
};

/**
 * Generate a temporary presigned URL for downloading/viewing a file (GET method)
 * @param {string} key - The S3 object key
 * @returns {Promise<string>} - The presigned download URL (expires in 1 hour)
 */
const getPresignedDownloadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  // Expire in 1 hour (3600 seconds)
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = {
  s3Client,
  getPresignedUploadUrl,
  getPresignedDownloadUrl
};
