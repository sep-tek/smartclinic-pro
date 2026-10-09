const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");
const {
  isPositiveIntegerId,
  isValidISODate,
} = require("../utils/validate");

const router = express.Router();


// GET all doctors
router.get("/doctors", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, specialty, experience_years, description
       FROM doctors
       ORDER BY name`
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching doctors:", error);

    res.status(500).json({
      message: "Failed to fetch doctors.",
    });
  }
});


// CREATE appointment
router.post(
  "/",
  authenticate,
  authorizeRole("patient"),
  async (req, res) => {
  try {
    const {
      doctor_id,
      appointment_date,
      notes,
    } = req.body;

    const patient_id = req.user.id;

    if (
      !patient_id ||
      !doctor_id ||
      !appointment_date
    ) {
      return res.status(400).json({
        message:
          "Patient, doctor, and appointment date are required.",
      });
    }

    if (!isPositiveIntegerId(doctor_id)) {
      return res.status(400).json({
        message: "Please provide a valid doctor ID.",
      });
    }

    if (!isValidISODate(appointment_date)) {
      return res.status(400).json({
        message:
          "Please provide a valid appointment date and time.",
      });
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes === "string" &&
      notes.length > 2000
    ) {
      return res.status(400).json({
        message: "Notes must be 2000 characters or fewer.",
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        patient_id,
        doctor_id,
        appointment_date,
        notes || null,
      ]
    );

    res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: result.rows[0],
    });

  } catch (error) {
    console.error("Error creating appointment:", error);

    res.status(500).json({
      message: "Failed to book appointment.",
    });
  }
  }
);


// GET patient's appointments
router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRole("patient"),
  async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.id !== Number(patientId)) {
      return res.status(403).json({
        message:
          "You do not have permission to access these appointments.",
      });
    }

    const result = await pool.query(
      `SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.status,
        appointments.notes,
        doctors.name AS doctor_name,
        doctors.specialty
       FROM appointments
       JOIN doctors
         ON appointments.doctor_id = doctors.id
       WHERE appointments.patient_id = $1
       ORDER BY appointments.appointment_date ASC`,
      [patientId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Error fetching patient appointments:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch appointments.",
    });
  }
  }
);



// CANCEL patient appointment (ownership enforced)
router.patch(
  "/:appointmentId/cancel",
  authenticate,
  authorizeRole("patient"),
  async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const existing = await pool.query(
      `SELECT patient_id, status FROM appointments WHERE id = $1`,
      [appointmentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const appointment = existing.rows[0];

    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to cancel this appointment." });
    }

    if (!["pending", "approved"].includes(appointment.status)) {
      return res.status(400).json({ message: "Only pending or approved appointments can be cancelled." });
    }

    const result = await pool.query(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
      ["cancelled", appointmentId]
    );

    res.json({
      message: "Appointment cancelled successfully.",
      appointment: result.rows[0],
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Failed to cancel appointment." });
  }
  }
);

module.exports = router;
