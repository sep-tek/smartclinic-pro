const express = require("express");
const router = express.Router();

const pool = require("../db");

// Submit a contact message
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO contact_messages
      (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, subject, message, created_at
      `,
      [name, email, subject, message]
    );

    res.status(201).json({
      message: "Contact message submitted successfully.",
      contactMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Contact message error:", error);

    res.status(500).json({
      message: "Failed to submit contact message.",
    });
  }
});

module.exports = router;