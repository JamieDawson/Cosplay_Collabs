const {
  generateUploadUrl,
  generateViewUrl,
  generateFileName,
} = require("../services/s3Service");

/**
 * Generate a pre-signed URL for image upload
 * POST /api/s3/upload-url
 * Body: { fileName: string, contentType: string }
 */
const getUploadUrl = async (req, res) => {
  try {
    const { fileName, contentType, userId } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        error: "fileName and contentType are required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    // Validate content type is an image
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({
        error: "Content type must be an image",
      });
    }

    // Generate unique file name
    const uniqueFileName = generateFileName(userId, fileName);

    // Generate pre-signed upload URL (valid for 5 minutes)
    const uploadUrl = await generateUploadUrl(uniqueFileName, contentType, 300);

    res.status(200).json({
      success: true,
      uploadUrl,
      fileName: uniqueFileName, // Return the S3 key for storing in database
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      error: "Failed to generate upload URL",
      details: error.message,
    });
  }
};

/**
 * Generate a pre-signed URL for viewing an image
 * GET /api/s3/view-url/:fileName
 */
const getViewUrl = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        error: "fileName is required",
      });
    }

    // Generate pre-signed view URL (valid for 1 hour)
    const viewUrl = await generateViewUrl(fileName, 3600);

    res.status(200).json({
      success: true,
      viewUrl,
    });
  } catch (error) {
    console.error("Error generating view URL:", error);
    res.status(500).json({
      error: "Failed to generate view URL",
      details: error.message,
    });
  }
};

module.exports = {
  getUploadUrl,
  getViewUrl,
};

