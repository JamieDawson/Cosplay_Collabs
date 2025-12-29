// routes/usersRoutes.js
const express = require("express");
const router = express.Router();
const {
  completeProfile,
  getUserByAuth0Id,
  getUserByUsername,
  deleteUser,
} = require("../controllers/usersController");

// POST - complete or update a user's profile
router.post("/api/users/complete-profile", completeProfile);

// GET - retrieve a user's data by Auth0 ID (from req.params)
router.get("/api/users/:auth0_id", getUserByAuth0Id);

// GET - Retrieve a user's data by username
router.get("/api/users/username/:username", getUserByUsername);

//DELETE a user out of Auth0 and Postgres
router.delete("/api/users/delete-account/:id", deleteUser);

module.exports = router;
