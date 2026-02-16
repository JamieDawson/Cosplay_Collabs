const pool = require("../config/db");

//Create an ad and store it in the Postgres database.
const createAd = async (req, res) => {
  const {
    user_id,
    title,
    description,
    country,
    state,
    city,
    imageUrl, // Legacy: single image (for backward compatibility)
    images, // New: array of images (S3 keys or Instagram URLs)
    imageType, // "s3" or "instagram"
    keywords,
  } = req.body;

  if (!user_id || !title) {
    return res.status(400).json({ error: "user_id and title are required" });
  }

  // Support both new array format and legacy single image format
  let imagesToStore = [];
  if (images && Array.isArray(images) && images.length > 0) {
    // New format: array of images
    imagesToStore = images;
  } else if (imageUrl) {
    // Legacy format: single image
    imagesToStore = [imageUrl];
  } else {
    return res.status(400).json({ error: "At least one image is required" });
  }

  // Validate image count based on type
  if (imageType === "s3" && imagesToStore.length > 3) {
    return res.status(400).json({ error: "Maximum 3 S3 images allowed per ad" });
  }
  if (imageType === "instagram" && imagesToStore.length > 10) {
    return res.status(400).json({ error: "Maximum 10 Instagram URLs allowed" });
  }

  // Check upload limits per user (3 S3 uploads, 10 Instagram URLs total across all ads)
  try {
    // Count existing uploads for this user
    const countQuery = `SELECT instagram_post_url FROM ads WHERE user_id = $1`;
    const countResult = await pool.query(countQuery, [user_id]);

    let existingS3Count = 0;
    let existingInstagramCount = 0;

    for (const row of countResult.rows) {
      const instagramPostUrl = row.instagram_post_url;
      if (!instagramPostUrl) continue;

      // Try to parse as JSON array
      let images = [];
      try {
        const parsed = JSON.parse(instagramPostUrl);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else {
          images = [instagramPostUrl];
        }
      } catch {
        images = [instagramPostUrl];
      }

      // Count S3 images and Instagram URLs
      for (const image of images) {
        if (image && typeof image === 'string') {
          if (image.includes("instagram.com")) {
            existingInstagramCount++;
          } else if (image.startsWith("uploads/")) {
            existingS3Count++;
          }
        }
      }
    }

    // Check S3 upload limit
    if (imageType === "s3") {
      const totalAfterUpload = existingS3Count + imagesToStore.length;
      if (totalAfterUpload > 3) {
        const remaining = Math.max(0, 3 - existingS3Count);
        return res.status(400).json({ 
          error: `You have reached your S3 upload limit. You have ${existingS3Count} uploads and can only upload ${remaining} more.` 
        });
      }
    }

    // Check Instagram URL limit
    if (imageType === "instagram") {
      const totalAfterUpload = existingInstagramCount + imagesToStore.length;
      if (totalAfterUpload > 10) {
        const remaining = Math.max(0, 10 - existingInstagramCount);
        return res.status(400).json({ 
          error: `You have reached your Instagram URL limit. You have ${existingInstagramCount} URLs and can only add ${remaining} more.` 
        });
      }
    }
  } catch (error) {
    console.error("Error checking upload counts:", error);
    // Don't block the upload if we can't check, but log the error
  }

  // Store images as JSON array in instagram_post_url column
  // For backward compatibility, we'll store:
  // - Single image: as string (existing format)
  // - Multiple images: as JSON array string
  const imagesJson = imagesToStore.length === 1 
    ? imagesToStore[0] // Single image: store as string (backward compatible)
    : JSON.stringify(imagesToStore); // Multiple images: store as JSON array

  const normalizeTag = (tag) => tag.toLowerCase().replace(/\s+/g, "");

  const normalizedKeywords = Array.isArray(keywords)
    ? keywords.map(normalizeTag)
    : [];

  console.log("Inserting ad with values:", {
    user_id,
    title,
    description,
    country,
    state,
    city,
    images: imagesToStore,
    imageType,
    keywords: normalizedKeywords,
  });

  try {
    const query = `
      INSERT INTO ads (
        user_id, title, description, country, state, city, instagram_post_url, keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      user_id,
      title,
      description || null,
      country || null,
      state || null,
      city || null,
      imagesJson, // Store images (single string or JSON array)
      JSON.stringify(normalizedKeywords),
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, ad: result.rows[0] });
  } catch (error) {
    console.error("Error inserting ad:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateAdById = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    country,
    state,
    city,
    imageUrl, // Legacy: single image (for backward compatibility)
    images, // New: array of images (S3 keys or Instagram URLs)
    imageType, // "s3" or "instagram"
    keywords,
  } = req.body;

  // ✅ Normalize tags: lowercase and remove spaces
  const normalizeTag = (tag) => tag.toLowerCase().replace(/\s+/g, "");

  const normalizedKeywords = Array.isArray(keywords)
    ? keywords.map(normalizeTag)
    : null;

  // Handle images update (if provided)
  let imagesJson = null;
  if (images && Array.isArray(images) && images.length > 0) {
    // New format: array of images
    // Validate image count based on type
    if (imageType === "s3" && images.length > 3) {
      return res.status(400).json({ error: "Maximum 3 S3 images allowed" });
    }
    if (imageType === "instagram" && images.length > 10) {
      return res.status(400).json({ error: "Maximum 10 Instagram URLs allowed" });
    }
    
    imagesJson = images.length === 1 
      ? images[0] // Single image: store as string (backward compatible)
      : JSON.stringify(images); // Multiple images: store as JSON array
  } else if (imageUrl) {
    // Legacy format: single image
    imagesJson = imageUrl;
  }

  try {
    const query = `
      UPDATE ads
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          country = COALESCE($3, country),
          state = COALESCE($4, state),
          city = COALESCE($5, city),
          instagram_post_url = COALESCE($6, instagram_post_url),
          keywords = COALESCE($7, keywords)
      WHERE id = $8
      RETURNING *;
    `;

    const values = [
      title,
      description,
      country,
      state,
      city,
      imagesJson, // Store images (single string or JSON array, or null if not updating)
      normalizedKeywords ? JSON.stringify(normalizedKeywords) : null,
      id,
    ];

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ad not found" });
    }

    res.status(200).json({ success: true, ad: result.rows[0] });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAdById = async (req, res) => {
  console.log("deleteAdById called");
  const { id } = req.params;
  console.log("deleteAdById ", id);
  try {
    const result = await pool.query("DELETE FROM ads WHERE id = $1", [id]);
    console.log("deleteAdById " + result);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ad not found" });
    }

    res.status(200).json({ success: true, message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Used for the front page to get the most recent ads
const getMostRecentAds = async (req, res) => {
  console.log("Function getMostRecentAds called");
  try {
    const query = `
      SELECT * FROM ads
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const result = await pool.query(query);
    console.log("getMostRecentAds: RESULT: " + result);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.log("getMostRecentAds error triggered");

    console.error("Error fetching most recent ads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAdsByUserId = async (req, res) => {
  const { user_id } = req.params;
  if (!user_id) {
    console.log("Missing user_id in getAdsByUserId");
  }

  console.log("Ad Function getAdsByUserId called. user_id is ", user_id);

  try {
    const query = `
      SELECT * FROM ads
      WHERE user_id = $1;
    `;
    const values = [user_id];

    const result = await pool.query(query, values);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching ads by location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAdsByTag = async (req, res) => {
  let { tag } = req.params;

  // ✅ Normalize the tag exactly as you do on insert/search
  tag = tag.toLowerCase().replace(/\s+/g, "");

  try {
    const query = `
      SELECT * FROM ads
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(keywords) AS kw
        WHERE kw.value = $1
      );
    `;

    const values = [tag];
    const result = await pool.query(query, values);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching ads by tag:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Pass in Country, State, and City to get ads for that location
const getAdsByCity = async (req, res) => {
  console.log("getAdByCity");
  const { country, state, city } = req.params;

  try {
    const query = `
      SELECT * FROM ads
      WHERE country = $1 AND state = $2 AND city = $3;
    `;
    const values = [country, state, city];

    const result = await pool.query(query, values);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching ads by location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Get ads by state
const getAdsByState = async (req, res) => {
  console.log("getAdByState");
  const { country, state } = req.params;

  try {
    const query = `SELECT * FROM ads WHERE country=$1 AND state=$2`;
    const values = [country, state];
    const result = await pool.query(query, values);

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Not pulling ads by state" });
  }
};

/**
 * Count S3 uploads and Instagram URLs for a user
 * Returns both counts in a single call to reduce API requests
 * S3 uploads are identified by:
 * - Not containing "instagram.com"
 * - Starting with "uploads/" (S3 key format)
 * Instagram URLs are identified by:
 * - Containing "instagram.com"
 */
const getUploadCounts = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Get all ads for this user
    const query = `SELECT instagram_post_url FROM ads WHERE user_id = $1`;
    const result = await pool.query(query, [user_id]);

    let s3UploadCount = 0;
    let instagramUrlCount = 0;

    // Count S3 uploads and Instagram URLs in each ad
    for (const row of result.rows) {
      const instagramPostUrl = row.instagram_post_url;
      
      if (!instagramPostUrl) continue;

      // Try to parse as JSON array
      let images = [];
      try {
        const parsed = JSON.parse(instagramPostUrl);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else {
          // Single image (string)
          images = [instagramPostUrl];
        }
      } catch {
        // Not JSON, treat as single string
        images = [instagramPostUrl];
      }

      // Count S3 images and Instagram URLs
      for (const image of images) {
        if (image && typeof image === 'string') {
          if (image.includes("instagram.com")) {
            // Instagram URL
            instagramUrlCount++;
          } else if (image.startsWith("uploads/")) {
            // S3 key
            s3UploadCount++;
          }
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      s3: {
        count: s3UploadCount,
        remaining: Math.max(0, 3 - s3UploadCount),
        max: 3
      },
      instagram: {
        count: instagramUrlCount,
        remaining: Math.max(0, 10 - instagramUrlCount),
        max: 10
      }
    });
  } catch (error) {
    console.error("Error counting uploads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAdsCountByCountry = async (req, res) => {
  console.log("Fetching ad counts by country...");
  try {
    const query = `
      SELECT country, COUNT(*) AS ad_count
      FROM ads
      GROUP BY country;
    `;
    const result = await pool.query(query);
    console.log("getAdsCountByCountry ", result);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching ad counts by country:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createAd,
  deleteAdById,
  updateAdById,
  getAdsCountByCountry,
  getAdsByCity,
  getMostRecentAds,
  getAdsByUserId,
  getAdsByTag,
  getAdsByState,
  getUploadCounts,
};
