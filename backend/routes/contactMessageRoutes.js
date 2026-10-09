const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");
const { isPositiveIntegerId } = require("../utils/validate");

const router = express.Router();

// =====================================================
// GET ALL CONTACT MESSAGES
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
          subject,
          message,
          created_at
         FROM contact_messages
         ORDER BY created_at DESC`
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching contact messages:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch contact messages.",
      });
    }
  }
);

// =====================================================
// DELETE CONTACT MESSAGE
// =====================================================

router.delete(
  "/:id",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isPositiveIntegerId(id)) {
        return res.status(400).json({
          message: "Please provide a valid message ID.",
        });
      }

      const result = await pool.query(
        `DELETE FROM contact_messages
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Contact message not found.",
        });
      }

      res.json({
        message: "Contact message deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Error deleting contact message:",
        error
      );

      res.status(500).json({
        message: "Failed to delete contact message.",
      });
    }
  }
);

module.exports = router;