require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createAdmin() {
  try {
    const name = "SmartClinic Admin";
    const email = "admin@smartclinic.com";
    const password = "Admin@12345";

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Admin account already exists.");
      return;
    }

    await pool.query(
      `INSERT INTO users
       (name, email, password, role)
       VALUES ($1, $2, $3, $4)`,
      [
        name,
        email,
        hashedPassword,
        "admin",
      ]
    );

    console.log("Admin account created successfully.");

  } catch (error) {
    console.error("Error creating admin:", error);

  } finally {
    await pool.end();
  }
}

createAdmin();