const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();


// GET all appointments
router.get(
  "/",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.status,
        appointments.notes,
        appointments.created_at,

        patients.id AS patient_id,
        patients.name AS patient_name,
        patients.email AS patient_email,

        doctors.id AS doctor_id,
        doctors.name AS doctor_name,
        doctors.specialty AS doctor_specialty

       FROM appointments

       INNER JOIN users AS patients
         ON appointments.patient_id = patients.id

       INNER JOIN doctors
         ON appointments.doctor_id = doctors.id

       ORDER BY appointments.appointment_date DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Error fetching admin appointments:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch appointments.",
    });
  }
  }
);


module.exports = router;
