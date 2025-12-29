// routes/adsRoutes.js
const express = require("express");
const router = express.Router();

// Import the controllers
const {
  createAd,
  getAdsCountByCountry,
  getAdsByCity,
  getMostRecentAds,
  getAdsByUserId,
  getAdsByTag,
  getAdsByState,
  deleteAdById,
  updateAdById,
} = require("../controllers/adsController");

// Handle root route or ads-related routes
router.get("/", (req, res) => {
  res.send("Welcome to the Ads API");
});

// POST route to create a new ad
router.post("/api/ads", createAd);

//GEt route by state
router.get("/api/ads/by-state/:country/:state", getAdsByState);

//GET route to get ads by city
router.get("/api/ads/:country/:state/:city", getAdsByCity);

// GET route to get ad counts by country
router.get("/api/ads/count-by-country", getAdsCountByCountry);

//GET most recent ads in ads database
router.get("/api/ads/most-recent", getMostRecentAds);

//GET ads by user_id
router.get("/api/ads/user/:user_id", getAdsByUserId);

//GET ads by value founds in array of tags.
router.get("/api/ads/ads-by-tag/:tag", getAdsByTag);

// DELETE ad by ID
router.delete("/api/users/delete/:id", deleteAdById);

// UPDATE an ad by ID
router.put("/api/users/update/:id", updateAdById);

module.exports = router;
