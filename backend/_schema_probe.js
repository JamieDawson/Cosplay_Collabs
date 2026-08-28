require("dotenv").config();
const pool = require("./config/db");

async function main() {
  const [ads, idx, uidx, tables] = await Promise.all([
    pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'ads'
       ORDER BY ordinal_position`
    ),
    pool.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ads'`
    ),
    pool.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users'`
    ),
    pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    ),
  ]);
  console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", "));
  console.log("ADS COLUMNS:", JSON.stringify(ads.rows, null, 2));
  console.log("ADS INDEXES:", JSON.stringify(idx.rows, null, 2));
  console.log("USERS INDEXES:", JSON.stringify(uidx.rows, null, 2));

  const [cons, cnt] = await Promise.all([
    pool.query(
      `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_constraint WHERE conrelid = 'ads'::regclass`
    ),
    pool.query("SELECT COUNT(*)::int AS cnt FROM ads"),
  ]);
  console.log("ADS CONSTRAINTS:", JSON.stringify(cons.rows, null, 2));
  console.log("ADS COUNT:", cnt.rows[0].cnt);
  process.exit(0);
}

main().catch((e) => {
  console.error("DB_ERR", e.message);
  process.exit(1);
});
