const EMAIL_MAX = 254;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isNonNegativeInteger(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Number.isInteger(num);
}

function isValidISODate(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isPositiveIntegerId(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isNonNegativeInteger,
  isValidISODate,
  isPositiveIntegerId,
};
