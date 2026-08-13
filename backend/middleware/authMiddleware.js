const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "scm_dev_secret_change_in_production");
    req.user = decoded;

    // Fallback: If user is shopadmin/seller and shopId is missing in token, fetch from DB
    if ((req.user.role === "shopadmin" || req.user.role === "seller") && !req.user.shopId) {
      try {
        const user = await User.findById(req.user.id);
        if (user && user.shopId) {
          req.user.shopId = user.shopId;
        }
      } catch (dbErr) {
        console.error("Auth middleware DB fallback error:", dbErr.message);
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "shopadmin")) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function requireCustomer(req, res, next) {
  if (!req.user || req.user.role !== "customer") {
    return res.status(403).json({ message: "Customer access required." });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireCustomer };
