const { Pool } = require("pg");
require("dotenv").config();

console.log("DB_NAME from .env:", process.env.DB_DATABASE); // Debugging

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool
  .query("SELECT current_database();")
  .then((res) => {
    console.log("OUTER TEST DATABASE: " + process.env.DB_DATABASE);
    console.log("Connected to DB:", res.rows[0].current_database);
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
