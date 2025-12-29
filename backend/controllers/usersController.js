// controllers/usersController.js
const pool = require("../config/db");
require("dotenv").config();
const axios = require("axios");
const qs = require("qs");

// Complete a user's profile after Auth0 signup process
const completeProfile = async (req, res) => {
  const { auth0_id, email, full_name, username } = req.body;

  if (!auth0_id || !email) {
    return res.status(400).json({ error: "auth0_id and email are required." });
  }

  try {
    const query = `
      INSERT INTO users (auth0_id, email, full_name, username)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (auth0_id)
      DO UPDATE SET email = EXCLUDED.email,
                    full_name = EXCLUDED.full_name,
                    username = EXCLUDED.username
      RETURNING *;
    `;
    const values = [auth0_id, email, full_name, username];
    const result = await pool.query(query, values);
    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET user by Auth0 ID from URL params
const getUserByAuth0Id = async (req, res) => {
  const { auth0_id } = req.params;
  console.log("user function getUserByAuth0Id. user sub is ", req.params.sub);

  try {
    const result = await pool.query("SELECT * FROM users WHERE auth0_id = $1", [
      auth0_id,
    ]);
    if (result.rows.length > 0) {
      res.status(200).json({ success: true, user: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//GEt user by username
// Get user by username
const getUserByUsername = async (req, res) => {
  const { username } = req.params;
  //console.log("user function getUserByUsername called. Username is ", username);

  if (!username) {
    return res.status(400).json({ error: "Username parameter is required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length > 0) {
      console.log("Result from getUserByUsername is ", result.rows[0]);
      res.status(200).json({ user: result.rows[0] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user by username:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//DELETE user from both Auth0 and Postgres Users table!
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const tokenResult = await pool.query(`
      SELECT *, (NOW() - created_at) > INTERVAL '23 hours' AS is_expired 
      FROM auth0_tokens 
      WHERE id = 1;
    `);

    let token = tokenResult.rows[0].token;
    const isExpired = tokenResult.rows[0].is_expired;

    // If token is expired, fetch a new one
    if (isExpired) {
      console.log("Token older than 23 hours. Requesting new token...");
      console.log("Client ID:", process.env.AUTH0_CLIENT_ID);
      console.log("Client Secret exists:", !!process.env.AUTH0_CLIENT_SECRET);

      try {
        const authResponse = await axios.post(
          "https://dev-k0kqobh465kbl3af.us.auth0.com/oauth/token",
          new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: "https://dev-k0kqobh465kbl3af.us.auth0.com/api/v2/",
          }).toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        token = authResponse.data.access_token;
        console.log("New token is: ", token);

        await pool.query(
          "UPDATE auth0_tokens SET token = $1, created_at = NOW() WHERE id = 1",
          [token]
        );
      } catch (tokenErr) {
        console.error(
          "❌ Failed to get new token:",
          tokenErr.response?.data || tokenErr.message
        );
        return res
          .status(500)
          .json({ success: false, message: "Failed to get Auth0 token" });
      }
    }

    // Delete user from Auth0
    await axios.delete(
      `https://dev-k0kqobh465kbl3af.us.auth0.com/api/v2/users/${encodeURIComponent(
        userId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Delete user from the  Users table (and cascade ads if FK is set up)
    await pool.query("DELETE FROM users WHERE auth0_id = $1", [userId]);

    //Delete ads from the Ads table where user_id matches
    await pool.query("DELETE FROM ads WHERE user_id = $1", [userId]);

    res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    console.error(
      "Error deleting user:",
      error.response?.data || error.message
    );
    res.status(500).json({ success: false, message: "Deletion failed." });
  }
};

module.exports = {
  completeProfile,
  getUserByAuth0Id,
  getUserByUsername,
  deleteUser,
};
