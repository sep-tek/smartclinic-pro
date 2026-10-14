// =====================================================
// LOGIN TIMING-LEAK TESTS
// =====================================================
//
// Run with:  node --test backend/tests/
//
// Verifies that an unregistered email address still incurs a bcrypt
// comparison, at the same cost factor used for real passwords, so that
// response timing does not reveal whether an address is registered.
//
// Like the throttle tests, no database is touched: the `../db` module is
// replaced in the require cache with an in-memory stub before the auth
// routes load. A throwaway JWT secret is set on this process only.

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-secret-not-used-anywhere-else-0000000000000000";

const bcrypt = require("bcryptjs");


// =====================================================
// FAKE DATABASE
// =====================================================

const VALID_PASSWORD = "correct-password-battery";

const KNOWN_USER = {
  id: 1,
  name: "Victim",
  email: "victim@clinic.test",
  // Cost 4 keeps this suite fast; the timing assertions below compare the
  // COST FACTOR, not absolute duration, so a cheap stored hash is fine.
  password: bcrypt.hashSync(VALID_PASSWORD, 4),
  role: "patient",
  is_active: true,
};

const USERS = new Map([[KNOWN_USER.email, KNOWN_USER]]);

// Registered, but deactivated. Used to prove the response is
// indistinguishable from every other failed sign-in.
const DEACTIVATED_USER = {
  id: 2,
  name: "Retired",
  email: "retired@clinic.test",
  password: bcrypt.hashSync(VALID_PASSWORD, 4),
  role: "patient",
  is_active: false,
};

USERS.set(DEACTIVATED_USER.email, DEACTIVATED_USER);

function fakePoolQuery(sql, params) {
  if (!/\$1/.test(sql)) return Promise.resolve({ rows: [] });

  const email = params && params[0];

  return Promise.resolve({
    rows: USERS.has(email) ? [USERS.get(email)] : [],
  });
}

const dbPath = require.resolve("../db");

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { query: fakePoolQuery },
  children: [],
  paths: [],
};

const express = require("express");
const authRoutes = require("../routes/authRoutes");


// =====================================================
// BCRYPT INSTRUMENTATION
// =====================================================

// authRoutes holds a reference to the bcryptjs module object, so patching
// the method on that object is observed by the route.
const realCompare = bcrypt.compare;
let calls = [];

function costOf(hash) {
  const parts = String(hash).split("$");

  return parts.length >= 3 ? parts[2] : null;
}

function installSpy() {
  calls = [];
  bcrypt.compare = function (password, hash) {
    calls.push({ password, hash });

    return realCompare.call(bcrypt, password, hash);
  };
}

function removeSpy() {
  bcrypt.compare = realCompare;
}


// =====================================================
// TEST APP
// =====================================================

const app = express();
let server = null;
let basePort = 0;

app.use(express.json());
app.use("/api/auth", authRoutes);

function login(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        host: "127.0.0.1",
        port: basePort,
        path: "/api/auth/login",
        method: "POST",
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
          resolve({
            status: res.statusCode,
            body: parsed,
            raw: data,
            headers: res.headers,
          });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

test.before(async () => {
  installSpy();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      basePort = server.address().port;
      resolve();
    });
  });
});

test.after(() => {
  if (server) server.close();
  removeSpy();
  // The auth routes pull the throttle in transitively; release its sweep
  // timer so this run leaves nothing scheduled behind it.
  require("../utils/loginThrottle").stopSweeper();
});

test.beforeEach(() => {
  calls = [];
});


// =====================================================
// THE UNKNOWN-USER PATH
// =====================================================

test("an unknown address still performs a bcrypt comparison", async () => {
  const r = await login({
    email: "nobody@clinic.test",
    password: "some-password",
  });

  assert.equal(r.status, 401);
  assert.equal(calls.length, 1, "expected exactly one bcrypt.compare call");
});

test("the dummy hash is a real bcrypt hash at cost 12", async () => {
  await login({ email: "nobody@clinic.test", password: "some-password" });

  assert.equal(calls.length, 1);

  const { hash } = calls[0];

  assert.match(hash, /^\$2[aby]\$/, "must be a bcrypt hash, not arbitrary text");
  assert.equal(costOf(hash), "12",
    "cost factor must match the 12 used when storing passwords");
  assert.notEqual(hash, KNOWN_USER.password,
    "dummy hash must not be the stored user hash");
});

test("the dummy hash is fixed, never generated per request", async () => {
  const hashes = [];

  for (let i = 0; i < 4; i++) {
    await login({ email: `ghost-${i}@clinic.test`, password: "pw" });
    hashes.push(calls[calls.length - 1].hash);
  }

  assert.equal(new Set(hashes).size, 1,
    "the same hash must be reused on every unknown-address login");
});

test("the dummy hash does not depend on the submitted password", async () => {
  const submitted = [];

  for (const pw of ["a", "b", "c", "x".repeat(200)]) {
    await login({ email: "nobody@clinic.test", password: pw });
    submitted.push({
      sent: pw,
      usedHash: calls[calls.length - 1].hash,
      usedPassword: calls[calls.length - 1].password,
    });
  }

  assert.equal(new Set(submitted.map((s) => s.usedHash)).size, 1);
  // The submitted password is passed through unchanged, exactly as the
  // real comparison does.
  assert.deepEqual(submitted.map((s) => s.usedPassword),
    submitted.map((s) => s.sent));
});

test("the wrong-password path compares against the stored user hash", async () => {
  await login({ email: "victim@clinic.test", password: "wrong-password" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].hash, KNOWN_USER.password);
  assert.notEqual(costOf(calls[0].hash), "12",
    "test fixture uses a cheap hash; the route passes it through as stored");
});


// =====================================================
// RESPONSES STAY GENERIC AND CONSISTENT
// =====================================================

test("unknown address and wrong password remain byte-identical responses", async () => {
  const unknown = await login({
    email: "nobody@clinic.test",
    password: "irrelevant",
  });

  const wrongPassword = await login({
    email: "victim@clinic.test",
    password: "irrelevant",
  });

  assert.equal(unknown.status, wrongPassword.status);
  assert.equal(unknown.raw, wrongPassword.raw);
  assert.equal(unknown.body.message, "Invalid email or password.");
});

test("unknown address does not leak a token, user object or hash", async () => {
  const r = await login({
    email: "nobody@clinic.test",
    password: "irrelevant",
  });

  assert.deepEqual(Object.keys(r.body), ["message"]);
  assert.ok(!r.raw.includes("$2"), "no bcrypt hash in the response");
  assert.ok(!r.raw.toLowerCase().includes("nobody"), "no echo of the address");
  assert.ok(!r.raw.includes("irrelevant"), "no echo of the password");
});


// =====================================================
// ROBUSTNESS
// =====================================================

test("a malformed request never reaches the dummy comparison", async () => {
  // These are rejected with 400 before any credential work happens.
  for (const payload of [
    {},
    { email: "nobody@clinic.test" },
    { email: "nobody@clinic.test", password: "" },
    { email: "not-an-email", password: "pw" },
  ]) {
    calls = [];
    const r = await login(payload);
    assert.ok(r.status >= 400 && r.status < 500, `${JSON.stringify(payload)} -> ${r.status}`);
    assert.equal(calls.length, 0, "no bcrypt work on a malformed request");
  }
});

test("over-long and unusual passwords do not throw on the unknown path", async () => {
  for (const password of ["x".repeat(72), "x".repeat(73), "x".repeat(500), "🔐🔐🔐"]) {
    calls = [];
    const r = await login({ email: "nobody@clinic.test", password });
    assert.equal(r.status, 401, `password length ${password.length}`);
    assert.equal(calls.length, 1);
  }
});

test("the unknown path performs exactly one comparison, never two", async () => {
  calls = [];
  await login({ email: "nobody@clinic.test", password: "pw" });
  assert.equal(calls.length, 1,
    "a second comparison would double the bcrypt cost for unknown addresses");
});


// =====================================================
// DEACTIVATED ACCOUNTS
// =====================================================

test("a deactivated account gets the generic status and body", async () => {
  const r = await login({
    email: "retired@clinic.test",
    password: VALID_PASSWORD,
  });

  assert.equal(r.status, 401, "must not be 403 or any other distinct status");
  assert.deepEqual(Object.keys(r.body), ["message"]);
  assert.equal(r.body.message, "Invalid email or password.");
});

test("unknown, wrong-password and deactivated responses are byte-identical", async () => {
  const unknown = await login({
    email: "nobody@clinic.test",
    password: "irrelevant",
  });

  const wrongPassword = await login({
    email: "victim@clinic.test",
    password: "irrelevant",
  });

  const deactivated = await login({
    email: "retired@clinic.test",
    password: VALID_PASSWORD,
  });

  const deactivatedWrongPassword = await login({
    email: "retired@clinic.test",
    password: "irrelevant",
  });

  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(deactivated.status, 401);
  assert.equal(deactivatedWrongPassword.status, 401);

  assert.equal(unknown.raw, wrongPassword.raw);
  assert.equal(unknown.raw, deactivated.raw,
    "deactivated response must be indistinguishable from the others");
  assert.equal(unknown.raw, deactivatedWrongPassword.raw);

  // Headers must agree too, not just the body.
  assert.deepEqual(deactivated.headers["content-type"],
    unknown.headers["content-type"]);
  assert.equal(deactivated.headers["set-cookie"], undefined);
  assert.equal(unknown.headers["set-cookie"], undefined);
});

test("the deactivated response leaks no account detail", async () => {
  const r = await login({
    email: "retired@clinic.test",
    password: VALID_PASSWORD,
  });

  const raw = r.raw.toLowerCase();

  assert.ok(!raw.includes("deactivat"), "must not mention deactivation");
  assert.ok(!raw.includes("administrator"), "must not mention the admin");
  assert.ok(!raw.includes("retired"), "must not echo the name or address");
  assert.ok(!raw.includes("$2"), "must not contain a bcrypt hash");
  assert.ok(!r.raw.includes(VALID_PASSWORD), "must not echo the password");
  assert.equal(r.headers["set-cookie"], undefined,
    "no session cookie may be issued for a deactivated account");
  assert.equal(r.body.token, undefined, "no JWT may be issued");
  assert.equal(r.body.user, undefined, "no user object may be returned");
});

test("the deactivated path still performs exactly one comparison", async () => {
  calls = [];
  await login({ email: "retired@clinic.test", password: VALID_PASSWORD });

  assert.equal(calls.length, 1,
    "the status check must follow a real comparison so timing still matches");
  assert.equal(calls[0].hash, DEACTIVATED_USER.password,
    "it must compare against the account's own stored hash, not the dummy");
});

test("a deactivated account with a wrong password behaves as any failure", async () => {
  const r = await login({
    email: "retired@clinic.test",
    password: "wrong-password",
  });

  assert.equal(r.status, 401);
  assert.equal(r.body.message, "Invalid email or password.");
});

test("an active account is unaffected and still receives a token", async () => {
  const r = await login({
    email: "victim@clinic.test",
    password: VALID_PASSWORD,
  });

  assert.equal(r.status, 200);
  assert.ok(r.body.token, "an active account must still be able to sign in");
  assert.ok(r.headers["set-cookie"], "and still receives a session cookie");
});
