const express = require("express");
const cors = require("cors");const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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
const profileRoutes = require("./routes/profileRoutes");
const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// PRODUCTION CONFIGURATION VALIDATION
// =====================================================

if (process.env.NODE_ENV === "production") {
  const missing = [];

  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.CLIENT_URL) missing.push("CLIENT_URL");
  if (!process.env.DB_USER) missing.push("DB_USER");
  if (!process.env.DB_HOST) missing.push("DB_HOST");
  if (!process.env.DB_NAME) missing.push("DB_NAME");
  if (!process.env.DB_PASSWORD) missing.push("DB_PASSWORD");
  if (!process.env.DB_PORT) missing.push("DB_PORT");

  if (
    process.env.JWT_SECRET ===
    "smartclinic_super_secret_change_this_later"
  ) {
    console.error(
      "Refusing to start in production with the default placeholder JWT_SECRET."
    );
    process.exit(1);
  }

  if (missing.length > 0) {
    console.error(
      `Missing required production environment variables: ${missing.join(", ")}. ` +
        "The server will not start in production without them."
    );
    process.exit(1);
  }
}

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

app.use(
  helmet({
    // This is a JSON API; no HTML documents are served, so disabling
    // CSP is safe and avoids interfering with the deployed frontend.
    contentSecurityPolicy: false,
    // HSTS is only appropriate once HTTPS is terminated in production.
    strictTransportSecurity:
      process.env.NODE_ENV === "production"
        ? { maxAge: 15552000, includeSubDomains: true }
        : false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));

// General API limiter: generous enough for dashboards, blocks basic abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

app.use("/api", apiLimiter);

// Stricter limiter for auth attempts (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many attempts, please try again later.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Public contact-form limiter (spam protection).
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many messages, please try again later.",
  },
});

app.use("/api/contact", contactLimiter);

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
app.use("/api/profile", profileRoutes);

// Test API
app.get("/api", (req, res) => {
  res.json({
    message: "SmartClinic Pro API is running!",
  });
});

// Lightweight health check for deployment monitors.
// Intentionally does NOT touch the database or expose any internals.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

let shuttingDown = false;

function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received, shutting down gracefully...`);

  // Force-exit fallback so the process never hangs forever
  const forceExit = setTimeout(() => {
    console.error(
      "Graceful shutdown timed out, forcing exit."
    );
    process.exit(1);
  }, 10000);

  forceExit.unref();

  server.close(async () => {
    try {
      await pool.end();
      console.log("Server and database connections closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error.message);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));