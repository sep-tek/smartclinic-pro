const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;


    // Validate input

    if (!name || !email || !password) {

      return res.status(400).json({
        message:
          "Name, email, and password are required.",
      });

    }


    // Check if user already exists

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );


    if (existingUser.rows.length > 0) {

      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });

    }


    // Hash password

    const hashedPassword =
      await bcrypt.hash(password, 12);


    // Create user
    // is_active automatically becomes TRUE
    // because of the database DEFAULT value.

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING
        id,
        name,
        email,
        role,
        created_at,
        is_active`,
      [
        name,
        email,
        hashedPassword
      ]
    );


    res.status(201).json({

      message:
        "Account created successfully.",

      user: result.rows[0],

    });


  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message:
        "Something went wrong while creating the account.",
    });

  }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    // Validate input

    if (!email || !password) {

      return res.status(400).json({
        message:
          "Email and password are required.",
      });

    }


    // Find user

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );


    if (result.rows.length === 0) {

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });

    }


    const user = result.rows[0];


    // =================================================
    // CHECK ACCOUNT STATUS
    // =================================================

    if (user.is_active === false) {

      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the clinic administrator.",
      });

    }


    // =================================================
    // CHECK PASSWORD
    // =================================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });

    }


    // =================================================
    // CREATE JWT
    // =================================================

    const token = jwt.sign(

      {
        id: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d",
      }

    );


    // =================================================
    // RESPONSE
    // =================================================

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({

      message:
        "Login successful.",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },

    });


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message:
        "Something went wrong while logging in.",
    });

  }

});


router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.json({ message: "Logged out successfully." });
});


module.exports = router;