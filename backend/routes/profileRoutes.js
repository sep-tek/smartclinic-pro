const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET MY PROFILE
// =====================================================

router.get("/", authenticate, async (req, res) => {
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
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message:
        "Something went wrong while loading your profile.",
    });
  }
});

// =====================================================
// UPDATE MY PROFILE
// =====================================================

router.put("/", authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    // Check whether another account already uses the email
    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1
       AND id != $2`,
      [email, req.user.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "Another account is already using this email.",
      });
    }

    // Update only the authenticated user's account
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2
       WHERE id = $3
       RETURNING
         id,
         name,
         email,
         role,
         created_at,
         is_active`,
      [name, email, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    res.json({
      message: "Profile updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message:
        "Something went wrong while updating your profile.",
    });
  }
});

// =====================================================
// CHANGE PASSWORD
// =====================================================

router.put(
  "/password",
  authenticate,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message:
            "Current password and new password are required.",
        });
      }

      // Basic password length check
      if (newPassword.length < 6) {
        return res.status(400).json({
          message:
            "New password must be at least 6 characters long.",
        });
      }

      // Get current password hash
      const result = await pool.query(
        `SELECT password
         FROM users
         WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "User account not found.",
        });
      }

      const user = result.rows[0];

      // Verify current password
      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Current password is incorrect.",
        });
      }

      // Prevent using the same password
      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          message:
            "New password must be different from your current password.",
        });
      }

      // Hash new password
      const hashedPassword =
        await bcrypt.hash(newPassword, 12);

      // Save new password
      await pool.query(
        `UPDATE users
         SET password = $1
         WHERE id = $2`,
        [hashedPassword, req.user.id]
      );

      res.json({
        message:
          "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      res.status(500).json({
        message:
          "Something went wrong while changing your password.",
      });
    }
  }
);

module.exports = router;
