const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { isProduction } = require("../config/env");
const {
  isNonEmptyString,
  isValidEmail,
} = require("../utils/validate");
const {
  recordLoginFailure,
  clearLoginFailures,
} = require("../utils/loginThrottle");

const router = express.Router();


// =====================================================
// DUMMY PASSWORD HASH
// =====================================================
//
// An unregistered address has no stored hash to compare against, so that
// request would return far faster than a wrong-password attempt and the
// response timing would reveal whether an address is registered.
//
// UNKNOWN_USER_PASSWORD_HASH closes that gap. It is a real bcrypt hash at
// the same cost factor used when passwords are stored (12), so comparing
// against it takes about as long as a genuine comparison. The resulting
// boolean is discarded; only the time it takes matters.
//
// It is fixed rather than generated per request, because hashing on each
// unknown-address login would add a full bcrypt cost to those requests and
// defeat the point of the exercise.
//
// This is a hash of a random value that was generated once and discarded.
// It is not a credential, it unlocks no account, and it is not a secret.

const UNKNOWN_USER_PASSWORD_HASH =
  "$2b$12$Xv8qbcThg.qDYF4CcltNPePtNpYMVIAvEqK82WdDcZlyPRoV8lcI6";


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

    const trimmedName =
      typeof name === "string" ? name.trim() : "";
    const trimmedEmail =
      typeof email === "string" ? email.trim() : "";

    if (!trimmedName) {

      return res.status(400).json({
        message: "Name is required.",
      });

    }

    if (trimmedName.length > 100) {

      return res.status(400).json({
        message: "Name must be 100 characters or fewer.",
      });

    }

    if (!trimmedEmail) {

      return res.status(400).json({
        message: "Email is required.",
      });

    }

    if (!isValidEmail(trimmedEmail)) {

      return res.status(400).json({
        message: "Please provide a valid email address.",
      });

    }

    if (typeof password !== "string" || password.length < 8) {

      return res.status(400).json({
        message:
          "Password must be at least 8 characters long.",
      });

    }


    // Check if user already exists

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [trimmedEmail]
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
        trimmedName,
        trimmedEmail,
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

    const trimmedEmail =
      typeof email === "string" ? email.trim() : "";

    if (!trimmedEmail || typeof password !== "string" || !password) {

      return res.status(400).json({
        message:
          "Email and password are required.",
      });

    }

    if (!isValidEmail(trimmedEmail)) {

      return res.status(400).json({
        message: "Please provide a valid email address.",
      });

    }


    // Find user

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [trimmedEmail]
    );


    if (result.rows.length === 0) {

      recordLoginFailure(req);

      // Compare against the fixed dummy hash so an unknown address costs
      // the same as a wrong password. The boolean result is intentionally
      // discarded and cannot influence the response.

      await bcrypt.compare(
        password,
        UNKNOWN_USER_PASSWORD_HASH
      );

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });

    }


    const user = result.rows[0];


    // =================================================
    // CHECK PASSWORD
    // =================================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      recordLoginFailure(req);

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });

    }


    // =================================================
    // CHECK ACCOUNT STATUS
    // =================================================
    //
    // This runs AFTER the password comparison on purpose. Returning any
    // distinct status or message here would tell an attacker that the
    // address is registered, and returning before the comparison would make
    // this the only fast response, which reveals the same thing by timing.
    // By this point a real bcrypt comparison has already run, so every
    // unsuccessful sign-in costs the same and answers the same.
    //
    // The failure counter is deliberately NOT incremented. Reaching this
    // point required the correct password, so nothing is being guessed and
    // there is nothing for the throttle to protect against.
    //
    // The server-side warning below is deliberately free of any user
    // identifier: no address, no hash, no password, no token. An operator
    // learns that a deactivated account was targeted but the log itself
    // identifies nobody.

    if (user.is_active === false) {

      console.warn(
        "Sign-in attempt for a deactivated account. " +
          "Responded with the generic authentication failure."
      );

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

    // A correct password clears the account's failure counter, so a
    // user who fumbles a few times is not left throttled afterwards.

    clearLoginFailures(req);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
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
    secure: isProduction,
    path: "/",
  });

  res.json({ message: "Logged out successfully." });
});


module.exports = router;