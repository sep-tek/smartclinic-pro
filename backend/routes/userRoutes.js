const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");
const { isPositiveIntegerId } = require("../utils/validate");

const router = express.Router();


// =====================================================
// GET ALL USERS
// =====================================================

router.get(
  "/",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        created_at,
        is_active
       FROM users
       ORDER BY id ASC`
    );

    res.json(result.rows);

  } catch (error) {

    console.error(
      "Error fetching users:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch users.",
    });

  }
  }
);


// =====================================================
// DEACTIVATE USER
// =====================================================

router.patch(
  "/:id/deactivate",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {

  try {

    const { id } = req.params;

    if (!isPositiveIntegerId(id)) {
      return res.status(400).json({ message: "Please provide a valid user ID." });
    }


    // Check that the user exists

    const userResult = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        is_active
       FROM users
       WHERE id = $1`,
      [id]
    );


    if (userResult.rows.length === 0) {

      return res.status(404).json({
        message: "User not found.",
      });

    }


    const user = userResult.rows[0];


    // Prevent deactivating an administrator

    if (user.role === "admin") {

      return res.status(403).json({
        message:
          "Administrator accounts cannot be deactivated.",
      });

    }


    // Already inactive

    if (!user.is_active) {

      return res.status(400).json({
        message:
          "This account is already inactive.",
      });

    }


    // Deactivate account

    const result = await pool.query(
      `UPDATE users
       SET is_active = FALSE
       WHERE id = $1
       RETURNING
        id,
        name,
        email,
        role,
        created_at,
        is_active`,
      [id]
    );


    res.json({
      message:
        "User account deactivated successfully.",
      user: result.rows[0],
    });


  } catch (error) {

    console.error(
      "Error deactivating user:",
      error
    );

    res.status(500).json({
      message:
        "Failed to deactivate user.",
    });

  }

  }
);


// =====================================================
// REACTIVATE USER
// =====================================================

router.patch(
  "/:id/activate",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {

  try {

    const { id } = req.params;

    if (!isPositiveIntegerId(id)) {
      return res.status(400).json({ message: "Please provide a valid user ID." });
    }


    const userResult = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        is_active
       FROM users
       WHERE id = $1`,
      [id]
    );


    if (userResult.rows.length === 0) {

      return res.status(404).json({
        message: "User not found.",
      });

    }


    const user = userResult.rows[0];


    if (user.is_active) {

      return res.status(400).json({
        message:
          "This account is already active.",
      });

    }


    const result = await pool.query(
      `UPDATE users
       SET is_active = TRUE
       WHERE id = $1
       RETURNING
        id,
        name,
        email,
        role,
        created_at,
        is_active`,
      [id]
    );


    res.json({
      message:
        "User account reactivated successfully.",
      user: result.rows[0],
    });


  } catch (error) {

    console.error(
      "Error activating user:",
      error
    );

    res.status(500).json({
      message:
        "Failed to activate user.",
    });

  }

  }
);


module.exports = router;
