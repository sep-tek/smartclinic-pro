/**
 * Lightweight production smoke/security test.
 *
 * Spawns the backend on a test port, runs a series of HTTP checks,
 * cleans up all temporary database records, then shuts the server down.
 *
 * Usage: node scripts/smoke-test.js
 * Requires: backend dependencies installed, local PostgreSQL running.
 */

const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const TEST_PORT = 5099;
const TEST_PORTS = [5099, 5199, 5299, 5399];
const BASE = `http://127.0.0.1:${TEST_PORT}`;

const TEST_USER = {
  name: "Smoke Test",
  email: "smoke@test.com",
  password: "Smoke@12345",
};

const TEST_DOCTOR = {
  name: "Smoke Doc",
  email: "smoke-doc@test.com",
  password: "Smoke@12345",
};

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function tryStartServer(port) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(__dirname, "..", "server.js")],
      {
        env: {
          ...process.env,
          NODE_ENV: "development",
          PORT: String(port),
          JWT_SECRET: process.env.JWT_SECRET || "smoke-test-secret",
          CLIENT_URL: "http://localhost:5173",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let settled = false;

    const fail = () => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    };

    child.once("error", fail);
    child.once("exit", fail);

    // Poll the health endpoint until the server is ready or fails
    const deadline = Date.now() + 10000;

    async function poll() {
      if (settled) return;

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/api/health`
        );

        if (response.ok) {
          settled = true;
          resolve(child);
          return;
        }
      } catch {
        // not up yet
      }

      if (Date.now() > deadline) {
        fail();
        return;
      }

      setTimeout(poll, 300);
    }

    poll();
  });
}

async function main() {
  console.log("Starting backend for smoke tests...");

  let server = null;

  for (const port of TEST_PORTS) {
    server = await tryStartServer(port);

    if (server) {
      break;
    }

    console.log(
      `Port ${port} unavailable, trying next port...`
    );
  }

  if (!server) {
    throw new Error(
      "Could not start backend on any test port"
    );
  }

  try {
    console.log("\n== Health ==");
    const health = await fetch(`${BASE}/api/health`);
    check("GET /api/health returns 200", health.status === 200);
    const healthBody = await health.json();
    check(
      "health body is { status: 'ok' }",
      healthBody.status === "ok" &&
        Object.keys(healthBody).length === 1
    );

    console.log("\n== Security headers ==");
    const headers = health.headers;
    check(
      "X-Content-Type-Options: nosniff",
      headers.get("x-content-type-options") === "nosniff"
    );
    check(
      "X-Frame-Options present",
      Boolean(headers.get("x-frame-options"))
    );
    check(
      "Referrer-Policy present",
      Boolean(headers.get("referrer-policy"))
    );
    check(
      "no HSTS over local HTTP in development",
      !headers.get("strict-transport-security")
    );

    console.log("\n== Registration ==");
    const badReg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "X",
        email: "not-an-email",
        password: "Smoke@12345",
      }),
    });
    check("invalid email registration -> 400", badReg.status === 400);

    const shortReg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "X",
        email: "x@test.com",
        password: "short",
      }),
    });
    check("short password registration -> 400", shortReg.status === 400);

    const goodReg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });
    check("valid registration -> 201", goodReg.status === 201);

    console.log("\n== Login ==");
    const badLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "x" }),
    });
    check("malformed login -> 400", badLogin.status === 400);

    const wrongLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: "WrongPass9",
      }),
    });
    check("wrong password -> 401", wrongLogin.status === 401);

    const goodLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });
    check("valid login -> 200", goodLogin.status === 200);
    const patientCookie = goodLogin.headers.get("set-cookie");

    console.log("\n== Authorization ==");
    const unauth = await fetch(`${BASE}/api/admin/dashboard/stats`);
    check("unauthenticated admin API -> 401", unauth.status === 401);

    const patientAdmin = await fetch(
      `${BASE}/api/admin/dashboard/stats`,
      { headers: { Cookie: patientCookie } }
    );
    check("patient -> admin API -> 403", patientAdmin.status === 403);

    const patientDoctorDash = await fetch(
      `${BASE}/api/doctor-dashboard/1`,
      { headers: { Cookie: patientCookie } }
    );
    check(
      "patient -> doctor dashboard -> 403",
      patientDoctorDash.status === 403
    );

    console.log("\n== Validation ==");
    const adminCookie = await getAdminCookie();

    const badUserId = await fetch(
      `${BASE}/api/users/abc/deactivate`,
      {
        method: "PATCH",
        headers: { Cookie: adminCookie },
      }
    );
    check("malformed user ID -> 400", badUserId.status === 400);

    const badMsgId = await fetch(
      `${BASE}/api/admin/contact-messages/xyz`,
      {
        method: "DELETE",
        headers: { Cookie: adminCookie },
      }
    );
    check("malformed message ID -> 400", badMsgId.status === 400);

    const badContact = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "N",
        email: "bad",
        subject: "s",
        message: "m",
      }),
    });
    check("malformed contact email -> 400", badContact.status === 400);

    const bigContact = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "N",
        email: "big@test.com",
        subject: "s",
        message: "M".repeat(5001),
      }),
    });
    check("oversized contact message -> 400", bigContact.status === 400);

    const badAppt = await fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: patientCookie,
      },
      body: JSON.stringify({
        doctor_id: "abc",
        appointment_date: "2026-12-01T10:00:00",
      }),
    });
    check("invalid doctor ID -> 400", badAppt.status === 400);

    const badDate = await fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: patientCookie,
      },
      body: JSON.stringify({
        doctor_id: 1,
        appointment_date: "not-a-date",
      }),
    });
    check("invalid appointment date -> 400", badDate.status === 400);

    console.log("\n== Valid flows ==");
    const goodContact = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Contact",
        email: "smoke-contact@test.com",
        subject: "Hello",
        message: "Smoke test message",
      }),
    });
    check("valid contact -> 201", goodContact.status === 201);

    const goodAppt = await fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: patientCookie,
      },
      body: JSON.stringify({
        doctor_id: 1,
        appointment_date: "2026-12-01T10:00:00",
        notes: "smoke",
      }),
    });
    check("valid appointment -> 201", goodAppt.status === 201);

    console.log("\n== Doctor cross-access ==");
    const { cookie: doctorCookie, userId: doctorUserId } =
      await createDoctorUser();
    const doctorDash = await fetch(
      `${BASE}/api/doctor-dashboard/${doctorUserId}`,
      { headers: { Cookie: doctorCookie } }
    );
    check(
      "doctor -> own dashboard -> 200",
      doctorDash.status === 200
    );

    console.log("\n== Auth rate limiting ==");
    let lastStatus = 0;

    for (let i = 0; i < 21; i += 1) {
      const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: "WrongPass9",
        }),
      });
      lastStatus = response.status;
    }

    check("21st login attempt -> 429", lastStatus === 429);

    console.log(`\nResults: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await cleanupDatabase();
  }
}

async function getAdminCookie() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@smartclinic.com",
      password: "Admin@12345",
    }),
  });

  if (!response.ok) {
    throw new Error("Smoke test: admin login failed");
  }

  return response.headers.get("set-cookie");
}

async function createDoctorUser() {
  const client = await dbConnect();

  try {
    const hash = await bcrypt.hash(TEST_DOCTOR.password, 10);

    await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'doctor')",
      [TEST_DOCTOR.name, TEST_DOCTOR.email, hash]
    );

    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [TEST_DOCTOR.email]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      "INSERT INTO doctors (name, specialty, experience_years, description, user_id) VALUES ($1, 'Test Specialty', 1, 'x', $2)",
      [TEST_DOCTOR.name, userId]
    );

    return { cookie: await loginAs(userId), userId };
  } finally {
    await client.end();
  }
}

async function loginAs() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_DOCTOR.email,
      password: TEST_DOCTOR.password,
    }),
  });

  if (!response.ok) {
    throw new Error("Smoke test: doctor login failed");
  }

  return response.headers.get("set-cookie");
}

function dbConnect() {
  return new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  }).connect();
}

async function cleanupDatabase() {
  const client = await dbConnect();

  try {
    await client.query(
      "DELETE FROM appointments WHERE notes = 'smoke' RETURNING id"
    );
    await client.query(
      "DELETE FROM contact_messages WHERE email = $1 RETURNING id",
      ["smoke-contact@test.com"]
    );
    await client.query(
      "DELETE FROM doctors WHERE name = $1 RETURNING id",
      [TEST_DOCTOR.name]
    );
    await client.query(
      "DELETE FROM users WHERE email IN ($1, $2) RETURNING id",
      [TEST_USER.email, TEST_DOCTOR.email]
    );
    console.log("Smoke test data cleaned up.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Smoke test error:", error.message);
  process.exit(1);
});
