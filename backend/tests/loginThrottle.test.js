// =====================================================
// LOGIN FAILURE THROTTLE TESTS
// =====================================================
//
// Run with:  node --test backend/tests/
//
// These tests never touch a database. The `../db` module is replaced in
// the require cache with an in-memory stub before the auth routes are
// loaded, so no PostgreSQL connection is opened and no query is issued.
//
// A throwaway JWT secret is set on the test process only. It is not read
// from, or written to, any .env file.

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const crypto = require("crypto");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-secret-not-used-anywhere-else-0000000000000000";

const bcrypt = require("bcryptjs");

const throttle = require("../utils/loginThrottle");


// =====================================================
// FAKE DATABASE
// =====================================================

const VALID_PASSWORD = "correct-password-battery";

const USERS = new Map();

// Cost 4 keeps the suite fast. bcrypt.compare reads the cost from the
// stored hash, so the login route still exercises its real comparison
// path rather than a stubbed one.
USERS.set("victim@clinic.test", {
  id: 1,
  name: "Victim",
  email: "victim@clinic.test",
  password: bcrypt.hashSync(VALID_PASSWORD, 4),
  role: "patient",
  is_active: true,
});

let dbBehaviour = "normal";

function fakePoolQuery(sql, params) {
  if (dbBehaviour === "throw") {
    return Promise.reject(
      Object.assign(new Error("simulated database failure"), {
        code: "ECONNREFUSED",
      })
    );
  }

  if (!/\$1/.test(sql)) {
    return Promise.resolve({ rows: [] });
  }

  const email = params && params[0];

  return Promise.resolve({
    rows: USERS.has(email) ? [USERS.get(email)] : [],
  });
}

const fakePool = { query: fakePoolQuery };

const dbPath = require.resolve("../db");

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

const express = require("express");
const authRoutes = require("../routes/authRoutes");


// =====================================================
// TEST APP
// =====================================================

// Mirrors the real wiring in backend/server.js: the account throttle runs
// ahead of the login route. The generous global login limiter is omitted
// so that account behaviour is measured in isolation.
function buildApp() {
  const app = express();

  app.use(express.json());
  app.use("/api/auth/login", throttle.loginFailureThrottle());
  app.use("/api/auth", authRoutes);

  return app;
}

let server = null;
let basePort = 0;

function send(pathname, rawBody) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: basePort,
        path: pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(rawBody),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { /* not JSON */ }
          resolve({
            status: res.statusCode,
            body: parsed,
            raw: data,
            retryAfter: res.headers["retry-after"],
          });
        });
      }
    );
    req.on("error", reject);
    req.write(rawBody);
    req.end();
  });
}

const login = (payload) =>
  send("/api/auth/login", JSON.stringify(payload));

const wrongFor = (email) => login({ email, password: "wrong-password" });

test.before(async () => {
  await new Promise((resolve) => {
    server = buildApp().listen(0, "127.0.0.1", () => {
      basePort = server.address().port;
      resolve();
    });
  });
});

test.after(() => {
  if (server) server.close();
  throttle.stopSweeper();
});

test.beforeEach(() => {
  throttle.reset();
  dbBehaviour = "normal";
});


// =====================================================
// KEY DERIVATION
// =====================================================

test("account key is a sha256 hex digest, never the raw address", () => {
  const key = throttle.accountKey("victim@clinic.test");
  const expected = crypto
    .createHash("sha256")
    .update("victim@clinic.test")
    .digest("hex");

  assert.equal(key, expected);
  assert.equal(key.length, 64);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.ok(!key.includes("@"));
  assert.ok(!key.includes("victim"));
});

test("key normalization trims and lowercases", () => {
  const canonical = throttle.accountKey("victim@clinic.test");

  assert.equal(throttle.accountKey("  VICTIM@Clinic.Test  "), canonical);
  assert.equal(throttle.accountKey("\tVictim@Clinic.Test\n"), canonical);
});

test("different addresses produce different keys", () => {
  assert.notEqual(
    throttle.accountKey("a@clinic.test"),
    throttle.accountKey("b@clinic.test")
  );
});

test("missing or malformed email shares one bucket", () => {
  const shared = throttle.accountKey(undefined);

  assert.equal(throttle.accountKey(null), shared);
  assert.equal(throttle.accountKey(12345), shared);
  assert.equal(throttle.accountKey({}), shared);
  assert.equal(throttle.accountKey(""), shared);
  assert.equal(throttle.accountKey("    "), shared);
  assert.match(shared, /^[0-9a-f]{64}$/);
});


// =====================================================
// FAILURE COUNTING
// =====================================================

test("counter increments per recorded failure and clears", () => {
  const key = throttle.accountKey("victim@clinic.test");

  assert.equal(throttle.failureCount(key), 0);

  throttle.recordLoginFailure({ loginAccountKey: key });
  assert.equal(throttle.failureCount(key), 1);

  throttle.recordLoginFailure({ loginAccountKey: key });
  assert.equal(throttle.failureCount(key), 2);

  throttle.clearLoginFailures({ loginAccountKey: key });
  assert.equal(throttle.failureCount(key), 0);
  assert.equal(throttle.trackedAccounts(), 0);
});

test("clearing an unknown key is a no-op, not a throw", () => {
  assert.doesNotThrow(() => throttle.clearLoginFailures({
    loginAccountKey: "0".repeat(64),
  }));
});

test("helpers are safe when called without a request", () => {
  assert.doesNotThrow(() => throttle.recordLoginFailure(undefined));
  assert.doesNotThrow(() => throttle.recordLoginFailure(null));
  assert.doesNotThrow(() => throttle.recordLoginFailure({}));
  assert.doesNotThrow(() => throttle.clearLoginFailures(undefined));
  assert.doesNotThrow(() => throttle.clearLoginFailures({}));
});


// =====================================================
// REPEATED FAILURES AGAINST ONE ACCOUNT
// =====================================================

test("11th consecutive failure for one account is throttled", async () => {
  for (let i = 0; i < 10; i++) {
    const r = await wrongFor("victim@clinic.test");
    assert.equal(r.status, 401, `attempt ${i + 1}`);
  }

  const blocked = await wrongFor("victim@clinic.test");

  assert.equal(blocked.status, 429);
  assert.ok(blocked.retryAfter, "429 should carry a Retry-After header");
  assert.match(blocked.body.message, /Too many failed sign-in attempts/);
});

test("throttling is per account: other accounts are unaffected", async () => {
  for (let i = 0; i < 10; i++) {
    await wrongFor("victim@clinic.test");
  }

  assert.equal((await wrongFor("victim@clinic.test")).status, 429);

  for (let i = 0; i < 10; i++) {
    const r = await wrongFor("someone-else@clinic.test");
    assert.equal(r.status, 401, `other account attempt ${i + 1}`);
  }
});

test("case and whitespace variants cannot buy extra attempts", async () => {
  for (let i = 0; i < 10; i++) {
    await wrongFor("victim@clinic.test");
  }

  assert.equal(
    (await wrongFor("  VICTIM@Clinic.Test  ")).status,
    429
  );
});


// =====================================================
// SUCCESSFUL LOGIN RESET
// =====================================================

test("a successful login clears the account's failure counter", async () => {
  for (let i = 0; i < 9; i++) {
    await wrongFor("victim@clinic.test");
  }

  const key = throttle.accountKey("victim@clinic.test");
  assert.equal(throttle.failureCount(key), 9);

  const success = await login({
    email: "victim@clinic.test",
    password: VALID_PASSWORD,
  });

  assert.equal(success.status, 200);
  assert.equal(throttle.failureCount(key), 0);
  assert.equal(throttle.trackedAccounts(), 0);

  // A full fresh allowance is available again.
  for (let i = 0; i < 10; i++) {
    const r = await wrongFor("victim@clinic.test");
    assert.equal(r.status, 401, `post-reset attempt ${i + 1}`);
  }

  assert.equal((await wrongFor("victim@clinic.test")).status, 429);
});

test("a successful login only clears its own account", async () => {
  const victimKey = throttle.accountKey("victim@clinic.test");
  const otherKey = throttle.accountKey("other@clinic.test");

  for (let i = 0; i < 5; i++) {
    throttle.recordLoginFailure({ loginAccountKey: victimKey });
    throttle.recordLoginFailure({ loginAccountKey: otherKey });
  }

  await login({
    email: "victim@clinic.test",
    password: VALID_PASSWORD,
  });

  assert.equal(throttle.failureCount(victimKey), 0);
  assert.equal(throttle.failureCount(otherKey), 5);
});

test("a deactivated account is not counted as a credential failure", async () => {
  USERS.set("deactivated@clinic.test", {
    id: 2,
    name: "Deactivated",
    email: "deactivated@clinic.test",
    password: bcrypt.hashSync(VALID_PASSWORD, 4),
    role: "patient",
    is_active: false,
  });

  // Reaching the deactivation check requires the correct password, so
  // these are not credential guesses and must not consume the allowance.
  // The response is the generic 401, indistinguishable from any other
  // failed sign-in.
  for (let i = 0; i < 12; i++) {
    const r = await login({
      email: "deactivated@clinic.test",
      password: VALID_PASSWORD,
    });
    assert.equal(r.status, 401, `attempt ${i + 1}`);
    assert.equal(r.body.message, "Invalid email or password.");
  }

  assert.equal(
    throttle.failureCount(
      throttle.accountKey("deactivated@clinic.test")
    ),
    0
  );

  USERS.delete("deactivated@clinic.test");
});


// =====================================================
// GENERIC RESPONSES
// =====================================================

test("unknown address and wrong password return identical responses", async () => {
  const unknown = await wrongFor("does-not-exist@clinic.test");
  const wrongPassword = await wrongFor("victim@clinic.test");

  assert.equal(unknown.status, wrongPassword.status);
  assert.deepEqual(unknown.body, wrongPassword.body);
  assert.equal(unknown.body.message, "Invalid email or password.");
});

test("the throttled response does not reveal account existence", async () => {
  for (let i = 0; i < 10; i++) {
    await wrongFor("does-not-exist@clinic.test");
  }
  const unknown = await wrongFor("does-not-exist@clinic.test");

  for (let i = 0; i < 10; i++) {
    await wrongFor("victim@clinic.test");
  }
  const known = await wrongFor("victim@clinic.test");

  assert.equal(unknown.status, 429);
  assert.equal(known.status, 429);
  assert.deepEqual(unknown.body, known.body);
});


// =====================================================
// MALFORMED INPUT
// =====================================================

test("malformed bodies are rejected without throwing", async () => {
  const cases = [
    {},
    { email: "" },
    { email: "   " },
    { password: "x" },
    { email: 12345, password: "x" },
    { email: null, password: "x" },
    { email: {}, password: "x" },
    { email: ["a@b.test"], password: "x" },
    { email: "victim@clinic.test" },
    { email: "victim@clinic.test", password: "" },
    { email: "victim@clinic.test", password: 999 },
    { email: "victim@clinic.test", password: null },
  ];

  for (const payload of cases) {
    const r = await login(payload);
    assert.ok(
      r.status >= 400 && r.status < 500,
      `${JSON.stringify(payload)} -> ${r.status}`
    );
  }
});

test("empty and non-JSON bodies do not crash the route", async () => {
  const empty = await send("/api/auth/login", "");
  assert.ok(empty.status >= 400 && empty.status < 500, empty.status);

  const broken = await send("/api/auth/login", "{not json");
  assert.ok(broken.status >= 400 && broken.status < 500, broken.status);
});

test("an over-long email is rejected, not retained", async () => {
  const before = throttle.trackedAccounts();

  const r = await login({
    email: `${"a".repeat(5000)}@clinic.test`,
    password: "wrong",
  });

  assert.ok(r.status >= 400 && r.status < 500, r.status);
  assert.ok(throttle.trackedAccounts() <= before + 1);
});


// =====================================================
// LIMITER AND BACKEND ERRORS
// =====================================================

test("a database failure yields 500 and does not throw", async () => {
  dbBehaviour = "throw";

  const r = await wrongFor("victim@clinic.test");

  assert.equal(r.status, 500);
  assert.match(r.body.message, /Something went wrong/);
});

test("a database failure does not consume the account allowance", async () => {
  dbBehaviour = "throw";
  await wrongFor("victim@clinic.test");

  dbBehaviour = "normal";

  assert.equal(
    throttle.failureCount(
      throttle.accountKey("victim@clinic.test")
    ),
    0
  );
});


// =====================================================
// WINDOW EXPIRY
// =====================================================

test("the block lifts once the failure window expires", async () => {
  // Reload the module with a 150ms window to exercise real expiry using
  // the module's own configuration seam.
  const modPath = require.resolve("../utils/loginThrottle");

  delete require.cache[modPath];
  process.env.LOGIN_FAILURE_WINDOW_MS = "150";

  let fast;

  try {
    fast = require("../utils/loginThrottle");
  } finally {
    delete process.env.LOGIN_FAILURE_WINDOW_MS;
  }

  assert.equal(fast.WINDOW_MS, 150);

  const mini = express();
  let miniPort = 0;
  let miniServer = null;

  mini.use(express.json());
  mini.post("/login", fast.loginFailureThrottle(), (req, res) => {
    res.json({ ok: true });
  });

  await new Promise((resolve) => {
    miniServer = mini.listen(0, "127.0.0.1", () => {
      miniPort = miniServer.address().port;
      resolve();
    });
  });

  const hit = () =>
    new Promise((resolve, reject) => {
      const body = JSON.stringify({ email: "x@clinic.test" });
      const req = http.request(
        {
          host: "127.0.0.1",
          port: miniPort,
          path: "/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode));
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });

  const key = fast.accountKey("x@clinic.test");

  for (let i = 0; i < 10; i++) {
    fast.recordLoginFailure({ loginAccountKey: key });
  }

  assert.equal(await hit(), 429, "blocked while the window is open");

  await new Promise((r) => setTimeout(r, 250));

  assert.equal(fast.failureCount(key), 0, "expired entries stop counting");
  assert.equal(await hit(), 200, "allowed again once the window lapses");

  miniServer.close();
  fast.stopSweeper();
  delete require.cache[modPath];
});


// =====================================================
// MEMORY BOUNDEDNESS
// =====================================================

test("a spray of distinct addresses stays bounded", () => {
  for (let i = 0; i < 5000; i++) {
    throttle.recordLoginFailure({
      loginAccountKey: throttle.accountKey(`spray-${i}@clinic.test`),
    });
  }

  assert.equal(throttle.trackedAccounts(), 5000);
  assert.ok(throttle.trackedAccounts() <= 50000);
});


// =====================================================
// EXPIRED-ENTRY CLEANUP
// =====================================================

test("sweepExpired removes only entries whose window has lapsed", () => {
  throttle.reset();

  const live = throttle.accountKey("live@clinic.test");
  const alsoLive = throttle.accountKey("also-live@clinic.test");

  throttle.recordLoginFailure({ loginAccountKey: live });
  throttle.recordLoginFailure({ loginAccountKey: alsoLive });

  assert.equal(throttle.trackedAccounts(), 2);

  // A sweep at the current instant finds nothing expired.
  throttle.sweepExpired(Date.now());
  assert.equal(throttle.trackedAccounts(), 2);

  // A sweep past the window reclaims both.
  throttle.sweepExpired(Date.now() + throttle.WINDOW_MS + 1);
  assert.equal(throttle.trackedAccounts(), 0);
  assert.equal(throttle.failureCount(live), 0);
});

test("sweeping an empty store is a no-op, not a throw", () => {
  throttle.reset();

  assert.equal(throttle.trackedAccounts(), 0);
  assert.doesNotThrow(() => throttle.sweepExpired(Date.now()));
  assert.equal(throttle.trackedAccounts(), 0);
});

test("the sweep timer is unref'd and can be stopped", () => {
  // stopSweeper is exported so tests and one-off scripts can release it.
  // Calling it more than once must stay harmless.
  assert.equal(typeof throttle.stopSweeper, "function");
  assert.doesNotThrow(() => throttle.stopSweeper());
  assert.doesNotThrow(() => throttle.stopSweeper());
});


/*
 * The capacity branch is exercised with a small, environment-configured
 * cap rather than 50,000 real failures. A dedicated instance of the
 * module is loaded with a tiny window so the automatic timer can also be
 * observed doing real work.
 */
function loadThrottle(env, cleanup) {
  const modPath = require.resolve("../utils/loginThrottle");
  const saved = {};

  for (const key of Object.keys(env)) {
    saved[key] = process.env[key];
    process.env[key] = String(env[key]);
  }

  delete require.cache[modPath];

  let instance;

  try {
    instance = require("../utils/loginThrottle");
  } finally {
    for (const key of Object.keys(env)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }

  return { instance, stop: () => {
    instance.stopSweeper();
    delete require.cache[modPath];
    if (cleanup) cleanup();
  } };
}

test("the capacity cap evicts the oldest entry instead of growing", () => {
  const { instance, stop } = loadThrottle({
    LOGIN_MAX_TRACKED_ACCOUNTS: 10,
  });

  try {
    assert.equal(instance.MAX_TRACKED_ACCOUNTS, 10);

    const keys = [];
    for (let i = 0; i < 25; i++) {
      const key = instance.accountKey(`cap-${i}@clinic.test`);
      keys.push(key);
      instance.recordLoginFailure({ loginAccountKey: key });
    }

    // Well past the cap, but never above it.
    assert.equal(instance.trackedAccounts(), 10);

    // The oldest entries were evicted...
    for (const key of keys.slice(0, 15)) {
      assert.equal(instance.failureCount(key), 0,
        "an evicted key must report no failures");
    }

    // ...and the most recent ones survived.
    for (const key of keys.slice(-5)) {
      assert.equal(instance.failureCount(key), 1,
        "a recent key must retain its failure");
    }
  } finally {
    stop();
  }
});

test("the timer reclaims expired entries below the capacity cap", async () => {
  const { instance, stop } = loadThrottle({
    LOGIN_FAILURE_WINDOW_MS: 60,
    LOGIN_MAX_TRACKED_ACCOUNTS: 1000,
  });

  try {
    assert.equal(instance.WINDOW_MS, 60);
    assert.equal(instance.MAX_TRACKED_ACCOUNTS, 1000);

    const key = instance.accountKey("timer@clinic.test");
    instance.recordLoginFailure({ loginAccountKey: key });
    assert.equal(instance.trackedAccounts(), 1);

    // Nothing to reclaim yet.
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(instance.trackedAccounts(), 1);

    // Wait past both the window and one sweep interval.
    await new Promise((r) => setTimeout(r, 200));

    assert.equal(instance.trackedAccounts(), 0,
      "the unref'd timer must reclaim expired entries below the cap");
    assert.equal(instance.failureCount(key), 0);
  } finally {
    stop();
  }
});
