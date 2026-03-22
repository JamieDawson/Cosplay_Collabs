const { Pool } = require("pg");
require("dotenv").config();

/**
 * Neon: set DATABASE_URL from the Neon dashboard (include ?sslmode=require).
 * Local: omit DATABASE_URL and use DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT.
 */
function buildPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const config = { connectionString: databaseUrl };
    // Cloud Postgres (Neon, etc.) requires TLS; skip SSL only for obvious local URLs
    const isLocal =
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    if (!isLocal) {
      config.ssl = { rejectUnauthorized: true };
    }
    return config;
  }

  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
}

const pool = new Pool(buildPoolConfig());

const usingDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

pool
  .query("SELECT current_database();")
  .then((res) => {
    console.log(
      usingDatabaseUrl
        ? "Connected via DATABASE_URL"
        : "Connected via DB_* env vars",
      "→",
      res.rows[0].current_database
    );
  })
  .catch((err) => {
    console.error("DB Connection Error:", err.message);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
