const express = require("express");
const router = express.Router();
const { getUploadUrl, getViewUrl } = require("../controllers/s3Controller");

// POST route to get pre-signed upload URL
router.post("/api/s3/upload-url", getUploadUrl);

// GET route to get pre-signed view URL
router.get("/api/s3/view-url/:fileName", getViewUrl);

module.exports = router;

