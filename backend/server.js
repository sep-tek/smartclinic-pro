const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const doctorDashboardRoutes = require(
  "./routes/doctorDashboardRoutes"
);
const userRoutes = require("./routes/userRoutes");
const adminAppointmentRoutes = require(
  "./routes/adminAppointmentRoutes"
);
const adminDashboardRoutes = require(
  "./routes/adminDashboardRoutes"
);

const contactRoutes = require("./routes/contactRoutes");
const contactMessageRoutes = require(
  "./routes/contactMessageRoutes"
);

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use(
  "/api/doctor-dashboard",
  doctorDashboardRoutes
);
app.use("/api/users", userRoutes);
app.use(
  "/api/admin/appointments",
  adminAppointmentRoutes
);
app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);
app.use("/api/contact", contactRoutes);
app.use(
  "/api/admin/contact-messages",
  contactMessageRoutes
);

// Test API
app.get("/api", (req, res) => {
  res.json({
    message: "SmartClinic Pro API is running!",
  });
});

// Database test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connection successful!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database connection failed.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});