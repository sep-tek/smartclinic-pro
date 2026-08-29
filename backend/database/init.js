require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await pool.query(sql);

    console.log("Database tables initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();