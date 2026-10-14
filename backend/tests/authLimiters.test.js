// =====================================================
// GLOBAL AUTHENTICATION LIMITER TESTS
// =====================================================
//
// Run with:  node --test backend/tests/
//
// Exercises the production thresholds from backend/utils/authLimiters.js:
// login 200 per 15 minutes, registration 20 per 15 minutes.
//
// Limiter instances come from createAuthLimiters(), not from the module's
// shared exports. Each test run therefore gets its own counters, so the
// production instances the server serves with are never exhausted and this
// file stays re-runnable and independent of test ordering.
//
// backend/server.js is deliberately never required: requiring it would
// open a database pool and bind a port. The mount chain from server.js is
// reproduced here against stub handlers, and a static check asserts that
// server.js still mounts the same limiters in the same order, so the two
// cannot drift apart silently.
//
// No database, no network beyond loopback, no new dependencies.

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";

const express = require("express");

const {
  WINDOW_MS,
  LOGIN_GLOBAL_LIMIT,
  REGISTER_GLOBAL_LIMIT,
  createAuthLimiters,
  loginGlobalLimiter,
  registerGlobalLimiter,
} = require("../utils/authLimiters");

const {
  loginFailureThrottle,
  stopSweeper,
} = require("../utils/loginThrottle");

const BACKEND = path.join(__dirname, "..");


// =====================================================
// HARNESS
// =====================================================

// Mirrors the mount chain in backend/server.js, with stub handlers in
// place of the real auth routes.
function buildApp(limiters) {
  const app = express();

  app.use(express.json());
  app.use(
    "/api/auth/login",
    limiters.loginGlobalLimiter,
    loginFailureThrottle()
  );
  app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login successful." });
  });
  app.use("/api/auth/register", limiters.registerGlobalLimiter);
  app.post("/api/auth/register", (req, res) => {
    res.status(201).json({ message: "Account created successfully." });
  });

  return app;
}

let agent = null;

function post(port, pathname, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload || {});
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: pathname,
        method: "POST",
        agent,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { /* not JSON */ }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/*
 * Starts a server on its own port with the supplied limiter pair, runs the
 * callback, then closes it. Each call is fully independent: fresh
 * instances, fresh counters, fresh port.
 */
async function withServer(limiters, run) {
  const instance = buildApp(limiters).listen(0, "127.0.0.1");
  const port = await new Promise((resolve) => {
    instance.on("listening", () => resolve(instance.address().port));
  });

  try {
    await run(port);
  } finally {
    instance.close();
  }
}

test.before(() => {
  // One keep-alive socket, reused across ports, keeps the 200+ request
  // runs fast.
  agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
});

test.after(() => {
  if (agent) agent.destroy();
  stopSweeper();
});

const loginRequest = (port, run, i) =>
  post(port, "/api/auth/login", {
    email: `r${run}-user-${i}@clinic.test`,
    password: "pw",
  });

const registerRequest = (port, run, i) =>
  post(port, "/api/auth/register", { email: `r${run}-new-${i}@clinic.test` });


// =====================================================
// DRIFT GUARD
// =====================================================

test("server.js mounts the same limiters in the same order", () => {
  const src = fs.readFileSync(path.join(BACKEND, "server.js"), "utf8");

  assert.match(src, /require\("\.\/utils\/authLimiters"\)/,
    "server.js must source the limiters from utils/authLimiters");
  assert.match(src, /app\.use\(\s*"\/api\/auth\/login",\s*loginGlobalLimiter,\s*loginFailureThrottle\(\)\s*\);/,
    "login must mount the global limiter then the account throttle");
  assert.match(src, /app\.use\("\/api\/auth\/register", registerGlobalLimiter\);/,
    "register must mount its own limiter");
  assert.doesNotMatch(src, /app\.set\("trust proxy"/,
    "trust proxy must stay at Express's secure default");
});

test("the configured thresholds are the documented ones", () => {
  assert.equal(LOGIN_GLOBAL_LIMIT, 200);
  assert.equal(REGISTER_GLOBAL_LIMIT, 20);
  assert.equal(WINDOW_MS, 15 * 60 * 1000);
});

test("server.js still imports the production singletons, not the factory", () => {
  const src = fs.readFileSync(path.join(BACKEND, "server.js"), "utf8");

  assert.doesNotMatch(src, /createAuthLimiters/,
    "the server must use the shared instances, not build new ones per call");

  // The shared exports are the very instances the factory produced.
  const fresh = createAuthLimiters();

  assert.notEqual(fresh.loginGlobalLimiter, loginGlobalLimiter,
    "the factory must not hand back the production instance");
  assert.notEqual(fresh.registerGlobalLimiter, registerGlobalLimiter);
  assert.equal(typeof loginGlobalLimiter, "function");
  assert.equal(typeof registerGlobalLimiter, "function");
});

test("the factory returns independent instances on every call", () => {
  const a = createAuthLimiters();
  const b = createAuthLimiters();

  assert.notEqual(a.loginGlobalLimiter, b.loginGlobalLimiter,
    "each call must yield its own login limiter");
  assert.notEqual(a.registerGlobalLimiter, b.registerGlobalLimiter,
    "each call must yield its own register limiter");
  assert.equal(typeof a.loginGlobalLimiter, "function");
  assert.equal(typeof a.registerGlobalLimiter, "function");
});


// =====================================================
// BEHAVIOUR
// =====================================================

/*
 * Runs the full login/register scenario on its own server built from the
 * supplied limiter pair. Kept as a function so it can be invoked more than
 * once: the second run passes only because the factory produced a fresh,
 * independent pair rather than reusing the previous run's counters.
 */
async function runScenario(run) {
  await withServer(createAuthLimiters(), async (port) => {
    // --- fill the login allowance exactly ---
    let last = null;

    for (let i = 0; i < LOGIN_GLOBAL_LIMIT; i++) {
      last = await loginRequest(port, run, i);
      if (last.status !== 200) break;
    }

    assert.equal(last.status, 200,
      `run ${run}: all ${LOGIN_GLOBAL_LIMIT} login requests must be served`);
    assert.equal(last.body.message, "Login successful.");

    // --- one past the login threshold ---
    const overLogin = await loginRequest(port, run, LOGIN_GLOBAL_LIMIT);

    assert.equal(overLogin.status, 429,
      `run ${run}: request 201 must be rejected by the global login limiter`);
    assert.equal(overLogin.body.message,
      "Too many attempts, please try again later.");

    assert.equal((await loginRequest(port, run, LOGIN_GLOBAL_LIMIT + 1)).status, 429,
      `run ${run}: further login requests stay rejected`);

    // --- login traffic must not touch the register allowance ---
    const firstRegister = await registerRequest(port, run, 0);
    assert.equal(firstRegister.status, 201,
      `run ${run}: register must still work while login is exhausted`);

    // --- register gets its own independent 20 ---
    for (let i = 1; i < REGISTER_GLOBAL_LIMIT; i++) {
      const r = await registerRequest(port, run, i);
      assert.equal(r.status, 201,
        `run ${run}: register attempt ${i + 1} of ${REGISTER_GLOBAL_LIMIT}`);
    }

    const overRegister = await registerRequest(port, run, REGISTER_GLOBAL_LIMIT);
    assert.equal(overRegister.status, 429,
      `run ${run}: request 21 must be rejected by the register limiter`);
    assert.equal(overRegister.body.message,
      "Too many attempts, please try again later.");

    // --- exhausting register leaves login capped, not opened up ---
    assert.equal((await loginRequest(port, run, LOGIN_GLOBAL_LIMIT + 2)).status, 429);
    assert.equal((await registerRequest(port, run, REGISTER_GLOBAL_LIMIT + 1)).status, 429);
  });
}

test("login caps at 200, register caps at 20, and neither starves the other", async () => {
  await runScenario(1);
});

test("the scenario repeats against fresh factory instances", async () => {
  // Passes only because these are new limiters with empty counters. With
  // the shared singletons this would fail immediately at the first login.
  await runScenario(2);
});
