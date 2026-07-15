const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Data@123",
  database: process.env.DB_NAME || "environmental_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { pool, testConnection };
