const express = require("express");
const pool = require("../db");
const {
  authenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET PATIENT DETAILS + APPOINTMENT HISTORY
// =====================================================

router.get(
  "/patient/:patientId",
  authenticate,
  authorizeRole("doctor"),
  async (req, res) => {

  try {

    const { patientId } = req.params;

    const appointmentAccessResult = await pool.query(
      `SELECT 1
       FROM appointments
       INNER JOIN doctors
         ON appointments.doctor_id = doctors.id
       WHERE appointments.patient_id = $1
       AND doctors.user_id = $2
       LIMIT 1`,
      [patientId, req.user.id]
    );

    if (appointmentAccessResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "You do not have permission to access this patient's details.",
      });
    }


    // -------------------------------------------------
    // Find patient
    // -------------------------------------------------

    const patientResult = await pool.query(
      `SELECT
        id,
        name,
        email,
        created_at,
        role
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


    // -------------------------------------------------
    // Get patient's appointment history
    // -------------------------------------------------

    const appointmentsResult = await pool.query(
      `SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.status,
        appointments.notes,
        appointments.created_at,

        doctors.name AS doctor_name,
        doctors.specialty

       FROM appointments

       INNER JOIN doctors
         ON appointments.doctor_id = doctors.id

       WHERE appointments.patient_id = $1

       ORDER BY appointments.appointment_date DESC`,
      [patientId]
    );


    // -------------------------------------------------
    // Return patient + history
    // -------------------------------------------------

    res.json({
      patient,
      appointments: appointmentsResult.rows,
    });


  } catch (error) {

    console.error(
      "Error loading patient details:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load patient details.",
    });

  }

  }
);

// =====================================================
// UPDATE APPOINTMENT STATUS
// =====================================================

router.patch(
  "/appointments/:appointmentId/status",
  authenticate,
  authorizeRole("doctor"),
  async (req, res) => {

    try {

      const { appointmentId } = req.params;
      const { status } = req.body;


      const allowedStatuses = [
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ];


      if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
          message:
            "Invalid appointment status.",
        });

      }

      const appointmentResult = await pool.query(
        `SELECT
          appointments.id,
          doctors.user_id
         FROM appointments
         INNER JOIN doctors
           ON appointments.doctor_id = doctors.id
         WHERE appointments.id = $1`,
        [appointmentId]
      );

      if (appointmentResult.rows.length === 0) {

        return res.status(404).json({
          message:
            "Appointment not found.",
        });

      }

      if (
        appointmentResult.rows[0].user_id !==
        req.user.id
      ) {

        return res.status(403).json({
          message:
            "You do not have permission to update this appointment.",
        });

      }


      const result = await pool.query(
        `UPDATE appointments
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [
          status,
          appointmentId,
        ]
      );


      if (result.rows.length === 0) {

        return res.status(404).json({
          message:
            "Appointment not found.",
        });

      }


      res.json({
        message:
          "Appointment status updated.",
        appointment:
          result.rows[0],
      });


    } catch (error) {

      console.error(
        "Error updating appointment:",
        error
      );


      res.status(500).json({
        message:
          "Failed to update appointment.",
      });

    }

  }
);


// =====================================================
// GET DOCTOR PROFILE + APPOINTMENTS
// =====================================================

router.get(
  "/:userId",
  authenticate,
  authorizeRole("doctor"),
  async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== Number(userId)) {
      return res.status(403).json({
        message:
          "You do not have permission to access this doctor dashboard.",
      });
    }

    // Find doctor connected to this user account
    const doctorResult = await pool.query(
      `SELECT
        doctors.id,
        doctors.name,
        doctors.specialty,
        doctors.experience_years,
        doctors.description,
        doctors.user_id,
        users.email
       FROM doctors
       INNER JOIN users
         ON doctors.user_id = users.id
       WHERE doctors.user_id = $1`,
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor profile not found.",
      });
    }

    const doctor = doctorResult.rows[0];

    // Get appointments belonging to this doctor
    const appointmentsResult = await pool.query(
      `SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.status,
        appointments.notes,
        appointments.created_at,

        users.id AS patient_id,
        users.name AS patient_name,
        users.email AS patient_email

       FROM appointments

       INNER JOIN users
         ON appointments.patient_id = users.id

       WHERE appointments.doctor_id = $1

       ORDER BY appointments.appointment_date ASC`,
      [doctor.id]
    );

    res.json({
      doctor,
      appointments: appointmentsResult.rows,
    });

  } catch (error) {

    console.error(
      "Error loading doctor dashboard:",
      error
    );

    res.status(500).json({
      message: "Failed to load doctor dashboard.",
    });
  }
  }
);


// =====================================================
// UPDATE DOCTOR PROFILE
// =====================================================

router.put(
  "/profile/:userId",
  authenticate,
  authorizeRole("doctor"),
  async (req, res) => {
  const { userId } = req.params;

  if (req.user.id !== Number(userId)) {
    return res.status(403).json({
      message:
        "You do not have permission to update this doctor profile.",
    });
  }

  const client = await pool.connect();

  try {
    const {
      name,
      email,
      specialty,
      experience_years,
      description,
    } = req.body;

    // Validate required fields
    if (!name || !email || !specialty) {
      return res.status(400).json({
        message: "Name, email, and specialty are required.",
      });
    }

    await client.query("BEGIN");

    // Find doctor connected to this user
    const doctorResult = await client.query(
      `SELECT id, user_id
       FROM doctors
       WHERE user_id = $1`,
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Doctor profile not found.",
      });
    }

    const doctorId = doctorResult.rows[0].id;

    // Check whether another user already has this email
    const emailCheck = await client.query(
      `SELECT id
       FROM users
       WHERE email = $1
       AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Another user already uses this email.",
      });
    }

    // Update user account
    await client.query(
      `UPDATE users
       SET name = $1,
           email = $2
       WHERE id = $3`,
      [
        name,
        email,
        userId,
      ]
    );

    // Update doctor profile
    const updatedDoctor = await client.query(
      `UPDATE doctors
       SET name = $1,
           specialty = $2,
           experience_years = $3,
           description = $4
       WHERE id = $5
       RETURNING *`,
      [
        name,
        specialty,
        Number(experience_years) || 0,
        description || null,
        doctorId,
      ]
    );

    await client.query("COMMIT");

    // Get updated doctor including email
    const finalDoctor = await pool.query(
      `SELECT
        doctors.id,
        doctors.name,
        doctors.specialty,
        doctors.experience_years,
        doctors.description,
        doctors.user_id,
        users.email
       FROM doctors
       INNER JOIN users
         ON doctors.user_id = users.id
       WHERE doctors.id = $1`,
      [doctorId]
    );

    res.json({
      message: "Doctor profile updated successfully.",
      doctor: finalDoctor.rows[0],
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Error updating doctor profile:",
      error
    );

    res.status(500).json({
      message: "Failed to update doctor profile.",
    });

  } finally {

    client.release();

  }
  }
);

module.exports = router;
