/**
 * Shared environment classification.
 *
 * Several security decisions in this backend depend on whether the
 * process is running in production: startup validation, HSTS, the
 * database TLS mode, and the secure flag on the auth cookie.
 *
 * Previously each of those files re-derived the answer on its own with
 * `NODE_ENV === "production"`. That comparison fails open: a missing,
 * misspelled or unexpected value (for example "prod", "Production" or
 * "staging") silently disabled every one of those safeguards.
 *
 * This module centralises the decision. Only an explicit "development"
 * or "test" is treated as non-production. Everything else is treated as
 * production, so a typo or an unset variable can never quietly weaken a
 * deployment.
 *
 * It must be required *after* dotenv has loaded the environment file so
 * that a local NODE_ENV value is visible. Every entry point in this
 * backend (server.js, database/init.js, createAdmin.js) already loads
 * dotenv before requiring the database module.
 */

const NON_PRODUCTION_ENVIRONMENTS = ["development", "test"];

const configuredEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.trim().toLowerCase()
    : "";

const isNonProduction =
  NON_PRODUCTION_ENVIRONMENTS.includes(configuredEnvironment);

/* Fail closed: anything not explicitly recognised as a non-production
   environment is handled as production. */
const isProduction = !isNonProduction;

/* The configured value is deliberately never included in these
   messages, so no environment value can reach the logs. */
if (configuredEnvironment === "") {
  console.warn(
    "NODE_ENV is not set; treating this process as production. " +
      "Set NODE_ENV=development for local development."
  );
} else if (!isNonProduction && configuredEnvironment !== "production") {
  console.warn(
    "NODE_ENV is not a recognised environment name; treating this " +
      "process as production. Recognised non-production values are: " +
      NON_PRODUCTION_ENVIRONMENTS.join(", ") +
      "."
  );
}

module.exports = {
  isProduction,
  isNonProduction,
};