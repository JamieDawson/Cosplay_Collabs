const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // Force virtual hosted-style URLs (bucket.s3.region.amazonaws.com)
  // This can help with CORS issues
  forcePathStyle: false,
});

// Support both S3_BUCKET and AWS_S3_BUCKET_NAME for flexibility
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Log configuration on startup (for debugging)
console.log("S3 Configuration:");
console.log("  Bucket Name:", BUCKET_NAME);
console.log("  Region:", AWS_REGION);
console.log("  Access Key ID:", process.env.AWS_ACCESS_KEY_ID ? "***SET***" : "NOT SET");

/**
 * Generate a pre-signed URL for uploading an image
 * @param {string} fileName - The file name/key for the S3 object
 * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg')
 * @param {number} expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns {Promise<string>} Pre-signed URL for uploading
 */
const generateUploadUrl = async (fileName, contentType, expiresIn = 300) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME or S3_BUCKET is not set in environment variables");
    }

    console.log("Generating upload URL for:", {
      bucket: BUCKET_NAME,
      key: fileName,
      contentType,
      region: AWS_REGION,
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    console.log("Generated URL:", url.substring(0, 100) + "...");
    
    return url;
  } catch (error) {
    console.error("Error generating upload URL:", error);
    console.error("Error details:", {
      bucket: BUCKET_NAME,
      region: AWS_REGION,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Generate a pre-signed URL for viewing/downloading an image
 * @param {string} fileName - The S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Pre-signed URL for viewing
 */
const generateViewUrl = async (fileName, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating view URL:", error);
    throw error;
  }
};

/**
 * Generate a unique file name for upload
 * @param {string} userId - User ID
 * @param {string} originalFileName - Original file name
 * @returns {string} Unique file name
 */
const generateFileName = (userId, originalFileName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFileName.split(".").pop();
  return `uploads/${userId}/${timestamp}-${randomString}.${extension}`;
};

module.exports = {
  generateUploadUrl,
  generateViewUrl,
  generateFileName,
  BUCKET_NAME,
};

