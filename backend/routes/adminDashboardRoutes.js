const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();


// GET admin dashboard statistics
router.get(
  "/stats",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
  try {

    const patientsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE role = 'patient'`
    );

    const doctorsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM doctors`
    );

    const appointmentsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM appointments`
    );

    const pendingResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE status = 'pending'`
    );

    const approvedResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE status = 'approved'`
    );


    res.json({
      patients: Number(patientsResult.rows[0].count),
      doctors: Number(doctorsResult.rows[0].count),
      appointments: Number(appointmentsResult.rows[0].count),
      pendingAppointments: Number(
        pendingResult.rows[0].count
      ),
      approvedAppointments: Number(
        approvedResult.rows[0].count
      ),
    });

  } catch (error) {

    console.error(
      "Error fetching admin dashboard statistics:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load dashboard statistics.",
    });

  }
  }
);

// =====================================================
// GET PATIENT DETAILS
// =====================================================

router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientResult = await pool.query(
      `SELECT
        id,
        name,
        email,
        created_at
       FROM users
       WHERE id = $1
       AND role = 'patient'`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        message: "Patient not found.",
      });
    }

    const patient = patientResult.rows[0];

    // Get this patient's appointments
    const appointmentsResult = await pool.query(
      `SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.status,
        appointments.notes,
        doctors.name AS doctor_name,
        doctors.specialty
       FROM appointments
       INNER JOIN doctors
         ON appointments.doctor_id = doctors.id
       WHERE appointments.patient_id = $1
       ORDER BY appointments.appointment_date DESC`,
      [patientId]
    );

    res.json({
      patient,
      appointments: appointmentsResult.rows,
    });

  } catch (error) {

    console.error(
      "Error fetching patient details:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch patient details.",
    });
  }
  }
);

module.exports = router;
