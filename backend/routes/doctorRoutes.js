const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();


// =====================================================
// GET ALL DOCTORS
// =====================================================

router.get("/", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT
        doctors.id,
        doctors.name,
        doctors.specialty,
        doctors.experience_years,
        doctors.description,
        doctors.user_id,
        doctors.is_available,
        users.email
       FROM doctors
       LEFT JOIN users
         ON doctors.user_id = users.id
       ORDER BY doctors.id ASC`
    );

    res.json(result.rows);

  } catch (error) {

    console.error(
      "Error fetching doctors:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch doctors.",
    });

  }
});


// =====================================================
// CREATE DOCTOR ACCOUNT + DOCTOR PROFILE
// =====================================================

router.post("/", async (req, res) => {

  const client = await pool.connect();

  try {

    const {
      name,
      email,
      password,
      specialty,
      experience_years,
      description,
    } = req.body;


    if (
      !name ||
      !email ||
      !password ||
      !specialty
    ) {

      return res.status(400).json({
        message:
          "Name, email, password, and specialty are required.",
      });

    }


    await client.query("BEGIN");


    // Check if email already exists

    const existingUser =
      await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );


    if (existingUser.rows.length > 0) {

      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "A user with this email already exists.",
      });

    }


    // Hash password

    const hashedPassword =
      await bcrypt.hash(password, 10);


    // Create doctor user account

    const userResult =
      await client.query(
        `INSERT INTO users
         (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING
          id,
          name,
          email,
          role`,
        [
          name,
          email,
          hashedPassword,
          "doctor",
        ]
      );


    const user =
      userResult.rows[0];


    // Create doctor profile

    // is_available automatically becomes TRUE
    // because of the database DEFAULT.

    const doctorResult =
      await client.query(
        `INSERT INTO doctors
         (
           name,
           specialty,
           experience_years,
           description,
           user_id
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          name,
          specialty,
          experience_years || 0,
          description || null,
          user.id,
        ]
      );


    await client.query("COMMIT");


    res.status(201).json({

      message:
        "Doctor created successfully.",

      user,

      doctor:
        doctorResult.rows[0],

    });


  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Error creating doctor:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create doctor.",
    });

  } finally {

    client.release();

  }

});


// =====================================================
// UPDATE DOCTOR
// =====================================================

router.put("/:id", async (req, res) => {

  const client = await pool.connect();

  try {

    const { id } =
      req.params;


    const {
      name,
      email,
      specialty,
      experience_years,
      description,
    } = req.body;


    if (
      !name ||
      !email ||
      !specialty
    ) {

      return res.status(400).json({
        message:
          "Name, email, and specialty are required.",
      });

    }


    await client.query("BEGIN");


    // Find doctor

    const doctorResult =
      await client.query(
        `SELECT user_id
         FROM doctors
         WHERE id = $1`,
        [id]
      );


    if (doctorResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Doctor not found.",
      });

    }


    const userId =
      doctorResult.rows[0].user_id;


    // Check email

    const emailCheck =
      await client.query(
        `SELECT id
         FROM users
         WHERE email = $1
         AND id != $2`,
        [
          email,
          userId,
        ]
      );


    if (emailCheck.rows.length > 0) {

      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Another user already uses this email.",
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

    const updatedDoctor =
      await client.query(
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
          experience_years || 0,
          description || null,
          id,
        ]
      );


    await client.query("COMMIT");


    res.json({

      message:
        "Doctor updated successfully.",

      doctor:
        updatedDoctor.rows[0],

    });


  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Error updating doctor:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update doctor.",
    });

  } finally {

    client.release();

  }

});


// =====================================================
// CHANGE DOCTOR AVAILABILITY
// =====================================================

router.patch("/:id/availability", async (req, res) => {

  try {

    const { id } =
      req.params;


    const {
      is_available
    } = req.body;


    // Validate value

    if (
      typeof is_available !== "boolean"
    ) {

      return res.status(400).json({
        message:
          "is_available must be true or false.",
      });

    }


    // Check doctor exists

    const doctorCheck =
      await pool.query(
        `SELECT id, name
         FROM doctors
         WHERE id = $1`,
        [id]
      );


    if (doctorCheck.rows.length === 0) {

      return res.status(404).json({
        message:
          "Doctor not found.",
      });

    }


    // Update availability

    const result =
      await pool.query(
        `UPDATE doctors
         SET is_available = $1
         WHERE id = $2
         RETURNING
          id,
          name,
          specialty,
          experience_years,
          description,
          user_id,
          is_available`,
        [
          is_available,
          id,
        ]
      );


    res.json({

      message:
        is_available
          ? "Doctor is now available for appointments."
          : "Doctor is now unavailable for appointments.",

      doctor:
        result.rows[0],

    });


  } catch (error) {

    console.error(
      "Error updating doctor availability:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update doctor availability.",
    });

  }

});


// =====================================================
// DELETE DOCTOR
// =====================================================

router.delete("/:id", async (req, res) => {

  const client =
    await pool.connect();

  try {

    const { id } =
      req.params;


    await client.query("BEGIN");


    // Find doctor's user account

    const doctorResult =
      await client.query(
        `SELECT user_id
         FROM doctors
         WHERE id = $1`,
        [id]
      );


    if (doctorResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Doctor not found.",
      });

    }


    const userId =
      doctorResult.rows[0].user_id;


    // Check appointments

    const appointmentsResult =
      await client.query(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE doctor_id = $1`,
        [id]
      );


    const appointmentCount =
      Number(
        appointmentsResult.rows[0].count
      );


    if (appointmentCount > 0) {

      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "This doctor cannot be deleted because they have existing appointments.",
      });

    }


    // Delete doctor profile

    await client.query(
      `DELETE FROM doctors
       WHERE id = $1`,
      [id]
    );


    // Delete doctor user account

    await client.query(
      `DELETE FROM users
       WHERE id = $1`,
      [userId]
    );


    await client.query("COMMIT");


    res.json({
      message:
        "Doctor deleted successfully.",
    });


  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Error deleting doctor:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete doctor.",
    });

  } finally {

    client.release();

  }

});


module.exports = router;