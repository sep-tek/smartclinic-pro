// =====================================================
// ACCOUNT-BASED LOGIN FAILURE THROTTLE
// =====================================================
//
// Render cannot confirm a trustworthy client-IP header or a proxy hop
// count, so with `trust proxy` disabled every request to this backend
// resolves to the same proxy address. Any IP-keyed limit therefore
// collapses into a single process-wide bucket that one caller can
// exhaust on behalf of the whole clinic.
//
// This module limits repeated sign-in attempts per account instead. The
// key is a SHA-256 hash of the normalized submitted email address, so
// the raw address is never stored as a key and never logged.
//
// Only FAILED attempts are counted. express-rate-limit cannot do this
// through configuration: it increments its store before it evaluates
// `requestWasSuccessful`, so a successful sign-in cannot be discounted.
// Successful sign-ins explicitly clear the counter here.
//
// The store is in-process. That matches the existing MemoryStore
// limiters and is adequate for the single-instance Render Free
// deployment this backend currently runs on. If the service is ever
// scaled horizontally, this counter becomes per-instance and would need
// a shared store (Render Key Value).

const crypto = require("crypto");

// =====================================================
// CONFIGURATION
// =====================================================

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_FAILURES = 10;

// Safety valve. The generous global login limiter is mounted ahead of
// this throttle and bounds how many distinct keys can be created within
// a single window, so this cap should never be reached in normal
// operation. It exists so that a misconfigured global limit, or a bug
// in this file, cannot let an attacker grow the map without bound.
const DEFAULT_MAX_TRACKED_ACCOUNTS = 50000;

function readPositiveInt(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : fallback;
}

const WINDOW_MS = readPositiveInt(
  process.env.LOGIN_FAILURE_WINDOW_MS,
  DEFAULT_WINDOW_MS
);

const MAX_FAILURES = readPositiveInt(
  process.env.LOGIN_MAX_FAILURES_PER_ACCOUNT,
  DEFAULT_MAX_FAILURES
);

const MAX_TRACKED_ACCOUNTS = readPositiveInt(
  process.env.LOGIN_MAX_TRACKED_ACCOUNTS,
  DEFAULT_MAX_TRACKED_ACCOUNTS
);

/*
 * Requests with a missing or non-string email share one bucket. They are
 * rejected as a 400 before any credential work happens, so this exists to
 * keep malformed floods bounded rather than to model a real account.
 */
const UNUSABLE_EMAIL_KEY = crypto
  .createHash("sha256")
  .update("\u0000unusable")
  .digest("hex");


// =====================================================
// KEY DERIVATION
// =====================================================

/*
 * Normalization matches the login route, which trims the submitted
 * address, and additionally lowercases it. Lowercasing can only ever
 * MERGE two keys, never split one, so two accounts differing only by
 * case share a bucket. That is the restrictive direction: it cannot
 * hand an attacker extra attempts against any single account.
 *
 * The value is hashed so the map keys and this module never hold a
 * readable email address.
 */
function accountKey(email) {
  if (typeof email !== "string") {
    return UNUSABLE_EMAIL_KEY;
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return UNUSABLE_EMAIL_KEY;
  }

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
}


// =====================================================
// FAILURE COUNTERS
// =====================================================

const failures = new Map();

function sweepExpired(now) {
  for (const [key, entry] of failures) {
    if (entry.expiresAt <= now) {
      failures.delete(key);
    }
  }
}

/*
 * Expired entries have to be reclaimed even while the map is well below
 * its capacity, otherwise a long-running process that sees many distinct
 * addresses never shrinks. One pass per window bounds the map to roughly
 * a single window's worth of keys.
 *
 * The timer is unref'd so it can never hold the process open, which also
 * means it will not keep a test run alive. Sweeping on a timer rather
 * than inside recordFailure avoids an O(n) scan on every failed login;
 * the capacity check in recordFailure remains as a backstop for the case
 * where the timer has not fired yet.
 */
const sweepTimer = setInterval(() => {
  sweepExpired(Date.now());
}, WINDOW_MS);

if (typeof sweepTimer.unref === "function") {
  sweepTimer.unref();
}

function stopSweeper() {
  clearInterval(sweepTimer);
}

function recordFailure(key) {
  const now = Date.now();

  let entry = failures.get(key);

  if (!entry || entry.expiresAt <= now) {
    if (failures.size >= MAX_TRACKED_ACCOUNTS) {
      sweepExpired(now);
    }

    if (failures.size >= MAX_TRACKED_ACCOUNTS) {
      // Map preserves insertion order, so this drops the oldest entry.
      const oldest = failures.keys().next();

      if (!oldest.done) {
        failures.delete(oldest.value);
      }
    }

    entry = { count: 0, expiresAt: now + WINDOW_MS };

    failures.set(key, entry);
  }

  entry.count += 1;
}

function clearFailures(key) {
  failures.delete(key);
}

function isBlocked(key) {
  const entry = failures.get(key);

  if (!entry) {
    return false;
  }

  if (entry.expiresAt <= Date.now()) {
    failures.delete(key);

    return false;
  }

  return entry.count >= MAX_FAILURES;
}

function failureCount(key) {
  const entry = failures.get(key);

  if (!entry || entry.expiresAt <= Date.now()) {
    return 0;
  }

  return entry.count;
}

function trackedAccounts() {
  return failures.size;
}

// Test-only helper. Not wired to any request path.
function reset() {
  failures.clear();
}


// =====================================================
// MIDDLEWARE AND ROUTE HELPERS
// =====================================================

/*
 * Mounted ahead of the login route. Derives the account key from the
 * request body (JSON parsing runs earlier in the chain) and rejects the
 * request once the account has exhausted its allowance. The key is
 * attached to the request so the route can record and clear the counter
 * without recomputing or re-parsing anything.
 */
function loginFailureThrottle() {
  return function (req, res, next) {
    const key = accountKey(req.body && req.body.email);

    req.loginAccountKey = key;

    if (!isBlocked(key)) {
      return next();
    }

    res.set("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));

    return res.status(429).json({
      message:
        "Too many failed sign-in attempts. Please try again later.",
    });
  };
}

function recordLoginFailure(req) {
  if (req && typeof req.loginAccountKey === "string") {
    recordFailure(req.loginAccountKey);
  }
}

function clearLoginFailures(req) {
  if (req && typeof req.loginAccountKey === "string") {
    clearFailures(req.loginAccountKey);
  }
}


module.exports = {
  loginFailureThrottle,
  recordLoginFailure,
  clearLoginFailures,
  accountKey,
  failureCount,
  trackedAccounts,
  sweepExpired,
  stopSweeper,
  reset,
  WINDOW_MS,
  MAX_FAILURES,
  MAX_TRACKED_ACCOUNTS,
};
