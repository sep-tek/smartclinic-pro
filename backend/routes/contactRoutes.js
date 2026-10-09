const express = require("express");
const router = express.Router();

const pool = require("../db");
const { isValidEmail } = require("../utils/validate");

// Submit a contact message
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const trimmedName =
      typeof name === "string" ? name.trim() : "";
    const trimmedEmail =
      typeof email === "string" ? email.trim() : "";
    const trimmedSubject =
      typeof subject === "string" ? subject.trim() : "";
    const trimmedMessage =
      typeof message === "string" ? message.trim() : "";

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Name must be 100 characters or fewer.",
      });
    }

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (trimmedSubject.length > 200) {
      return res.status(400).json({
        message: "Subject must be 200 characters or fewer.",
      });
    }

    if (trimmedMessage.length > 5000) {
      return res.status(400).json({
        message: "Message must be 5000 characters or fewer.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO contact_messages
      (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, subject, message, created_at
      `,
      [trimmedName, trimmedEmail, trimmedSubject, trimmedMessage]
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