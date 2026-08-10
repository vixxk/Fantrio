const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

/**
 * Delete an object from S3
 * @param {string} key - The S3 object key
 * @returns {Promise<void>}
 */
const deleteS3Object = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  await s3Client.send(command);
};

/**
 * Extract the S3 object key from a file URL. Returns null for URLs that
 * don't belong to this bucket (e.g. external image hosts, seeded data).
 * @param {string} url - The stored file URL
 * @returns {string|null}
 */
const extractS3Key = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (!host.includes('amazonaws.com')) return null;
    if (!host.startsWith(`${BUCKET_NAME}.`)) return null;
    return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  } catch (err) {
    return null;
  }
};

/**
 * Best-effort delete of all S3 objects referenced by the given URLs.
 * Non-bucket URLs and failures are silently skipped/logged.
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
const deleteS3Media = async (urls) => {
  const seen = new Set();
  for (const url of urls || []) {
    const key = extractS3Key(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    try {
      await deleteS3Object(key);
    } catch (err) {
      console.error(`[AWS S3] Failed to delete object ${key}:`, err);
    }
  }
};

module.exports = {
  s3Client,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteS3Object,
  deleteS3Media,
  extractS3Key
};
