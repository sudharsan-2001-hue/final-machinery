const bcrypt = require("bcrypt");
const User = require("../models/User");
const { signToken } = require("../utils/jwtHelper");
const {
  normalizePhone,
  isEmail,
  isPhone,
  isEmailOrPhone,
  validatePassword,
} = require("../utils/validators");

function mapUser(user) {
  return {
    id: user._id,
    email: user.email,
    phone: user.mobile,
    fullName: user.name,
    role: user.role,
    shopId: user.shopId || null,
    shopRegistered: user.shopRegistered || false,
  };
}

async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/phone and password are required." });
  }

  if (!isEmailOrPhone(identifier)) {
    return res.status(400).json({ message: "Enter a valid email address or 10-digit phone number." });
  }

  try {
    const trimmed = String(identifier).trim();
    const phone = normalizePhone(trimmed);
    const isEmailLogin = isEmail(trimmed);

    const user = await User.findOne({
      $or: [
        { email: isEmailLogin ? trimmed.toLowerCase() : "" },
        { mobile: isEmailLogin ? "" : phone }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/phone or password." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is inactive. Contact support." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email/phone or password." });
    }

    const userData = mapUser(user);
    const token = signToken(userData);
    res.json({ ...userData, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
}

async function register(req, res) {
  const { email, password, phone, fullName, role = "customer", customerType = "individual" } = req.body;

  if (!email || !password || !phone || !fullName) {
    return res.status(400).json({ message: "Email, phone, full name, and password are required." });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (!isPhone(phone)) {
    return res.status(400).json({ message: "Enter a valid 10-digit Indian phone number." });
  }

  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile: normalizedPhone }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }

    const user = await User.create({
      name: fullName,
      email: normalizedEmail,
      mobile: normalizedPhone,
      password: password,
      role: role,
      customerType: customerType
    });

    const userData = mapUser(user);
    const token = signToken(userData);
    res.status(201).json({
      message: "Successfully registered.",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
}

async function registerSeller(req, res) {
  const { email, password, phone, fullName, gstNumber, businessName, profileImage } = req.body;

  if (!email || !password || !phone || !fullName) {
    return res.status(400).json({ message: "Email, phone, full name, and password are required." });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (!isPhone(phone)) {
    return res.status(400).json({ message: "Enter a valid 10-digit Indian phone number." });
  }

  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile: normalizedPhone }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }

    const shopId = `SHOP${Date.now()}`;
    const user = await User.create({
      name: fullName,
      email: normalizedEmail,
      mobile: normalizedPhone,
      password: password,
      role: "shopadmin",
      shopId: shopId,
      gstNumber: gstNumber || null,
      address: businessName || null,
      profileImage: profileImage || null,
      status: "active"
    });

    const userData = mapUser(user);
    const token = signToken(userData);
    res.status(201).json({
      message: "Seller registration successful.",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Seller register error:", err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }
    res.status(500).json({ message: "Server error during seller registration." });
  }
}

async function forgotPassword(req, res) {
  const { identifier, email, newPassword } = req.body;
  const loginId = identifier || email;

  if (!loginId || !newPassword) {
    return res.status(400).json({ message: "Email/phone and new password are required." });
  }

  const pwdError = validatePassword(newPassword);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const trimmed = String(loginId).trim();
    const phone = normalizePhone(trimmed);
    const isEmailLogin = isEmail(trimmed);

    const user = await User.findOne({
      status: "active",
      $or: [
        { email: isEmailLogin ? trimmed.toLowerCase() : "" },
        { mobile: isEmailLogin ? "" : phone }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "No active account found with that email or phone." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Server error during password reset." });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required." });
  }

  const pwdError = validatePassword(newPassword);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ message: "Server error during password change." });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error fetching profile." });
  }
}

module.exports = {
  login,
  register,
  registerSeller,
  forgotPassword,
  changePassword,
  getProfile,
};
