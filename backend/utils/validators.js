const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").slice(-10);
}

function isEmail(value) {
  return EMAIL_REGEX.test(String(value).trim());
}

function isPhone(value) {
  return PHONE_REGEX.test(normalizePhone(value));
}

function isEmailOrPhone(value) {
  const trimmed = String(value || "").trim();
  return isEmail(trimmed) || isPhone(trimmed);
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

function generateUsername(email, phone) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "user";
  const suffix = normalizePhone(phone).slice(-4) || Math.floor(Math.random() * 9000 + 1000);
  return `${base}${suffix}`.slice(0, 50);
}

module.exports = {
  normalizePhone,
  isEmail,
  isPhone,
  isEmailOrPhone,
  validatePassword,
  generateUsername,
};
