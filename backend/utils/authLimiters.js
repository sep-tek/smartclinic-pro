// =====================================================
// GLOBAL AUTHENTICATION LIMITERS
// =====================================================
//
// Render cannot confirm a trustworthy client-IP header or a proxy hop
// count. With `trust proxy` disabled, Express resolves every request to
// the same proxy address, so these limiters are keyed on that address
// and are in practice a clinic-wide ceiling rather than a per-client one.
//
// That is deliberate and acceptable here: they exist only as a generous
// backstop against an attack spread across many addresses, bounding how
// much work an attacker can force the backend to do. The actual per-account
// control is utils/loginThrottle, which needs no client address at all.
//
// Login and registration carry separate limiters so a burst of failed
// sign-ins cannot lock users out of creating an account.
//
// These live outside server.js so the test suite can exercise the real
// configured thresholds without booting the server, opening a database
// pool or binding a port.

const rateLimit = require("express-rate-limit");

const WINDOW_MS = 15 * 60 * 1000;

// Total login requests, successful ones included, per window. Generous
// for a small clinic, and far above the per-account failure allowance.
const LOGIN_GLOBAL_LIMIT = 200;

// Registrations are rarer than sign-ins, so this stays tight.
const REGISTER_GLOBAL_LIMIT = 20;

/*
 * Builds a fresh pair of limiters with exactly the production
 * configuration below.
 *
 * The server uses the single pair created at the bottom of this file.
 * Tests use this factory instead, so they get independent counters and do
 * not exhaust the instances the application is actually serving with.
 * Both paths read the same constants, so the configuration cannot drift.
 */
function createAuthLimiters() {
  return {
    loginGlobalLimiter: rateLimit({
      windowMs: WINDOW_MS,
      limit: LOGIN_GLOBAL_LIMIT,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many attempts, please try again later.",
      },
    }),

    registerGlobalLimiter: rateLimit({
      windowMs: WINDOW_MS,
      limit: REGISTER_GLOBAL_LIMIT,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many attempts, please try again later.",
      },
    }),
  };
}

// The instances the running application uses.
const productionLimiters = createAuthLimiters();

const loginGlobalLimiter = productionLimiters.loginGlobalLimiter;
const registerGlobalLimiter = productionLimiters.registerGlobalLimiter;

module.exports = {
  WINDOW_MS,
  LOGIN_GLOBAL_LIMIT,
  REGISTER_GLOBAL_LIMIT,
  createAuthLimiters,
  loginGlobalLimiter,
  registerGlobalLimiter,
};
