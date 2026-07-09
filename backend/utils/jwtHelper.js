const jwt = require("jsonwebtoken");

function signToken(user) {
  const payload = {
    id: user.id || user.UserID,
    email: user.email || user.Email,
    phone: user.phone || user.PhoneNumber,
    role: (user.role || user.Role || "customer").toLowerCase(),
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "scm_dev_secret_change_in_production", {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
}

module.exports = { signToken };
