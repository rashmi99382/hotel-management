const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    })
  : null;

function requireDatabase() {
  if (!pool) {
    const error = new Error("DATABASE_URL is not configured");
    error.status = 503;
    throw error;
  }
  return pool;
}

async function query(sql, params = []) {
  return requireDatabase().query(sql, params);
}

async function health() {
  if (!pool) return { configured: false, ok: false };
  try {
    await pool.query("select 1");
    return { configured: true, ok: true };
  } catch (error) {
    return { configured: true, ok: false, error: error.message };
  }
}

module.exports = {
  pool,
  query,
  health
};
