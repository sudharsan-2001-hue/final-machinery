const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("../db");
const { signToken } = require("../utils/jwtHelper");
const {
  normalizePhone,
  isEmail,
  isPhone,
  isEmailOrPhone,
  validatePassword,
} = require("../utils/validators");

function mapUser(row) {
  return {
    id: row.UserID,
    email: row.Email,
    phone: row.PhoneNumber,
    fullName: row.FullName,
    role: (row.Role || "").toLowerCase(),
  };
}

async function comparePassword(plain, stored) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
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
    const pool = await poolPromise;
    const trimmed = String(identifier).trim();
    const phone = normalizePhone(trimmed);
    const isEmailLogin = isEmail(trimmed);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, isEmailLogin ? trimmed.toLowerCase() : "")
      .input("phone", sql.NVarChar, isEmailLogin ? "" : phone)
      .query(`
        SELECT UserID, Username, Email, Password, PhoneNumber, Role, Status
        FROM Users
        WHERE (@email <> '' AND LOWER(Email) = LOWER(@email))
           OR (@phone <> '' AND PhoneNumber = @phone)
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email/phone or password." });
    }

    if (user.Status && user.Status.toLowerCase() !== "active") {
      return res.status(403).json({ message: "Account is inactive. Contact support." });
    }

    const valid = await comparePassword(password, user.Password);
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
  const { email, password, phone, fullName, role = "Customer" } = req.body;

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
    const pool = await poolPromise;
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
      .input("phone", sql.NVarChar, normalizedPhone)
      .query(`
        SELECT UserID FROM Users
        WHERE LOWER(Email) = LOWER(@email) OR PhoneNumber = @phone
      `);

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
      .input("password", sql.NVarChar, hashedPassword)
      .input("phone", sql.NVarChar, normalizedPhone)
      .input("fullName", sql.NVarChar, fullName.trim())
      .input("username", sql.NVarChar, normalizedEmail.split('@')[0])
      .input("role", sql.NVarChar, role)
      .query(`
        INSERT INTO Users (Username, Email, Password, PhoneNumber, FullName, Role, Status, CreatedDate)
        OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.PhoneNumber, INSERTED.FullName, INSERTED.Role
        VALUES (@username, @email, @password, @phone, @fullName, @role, 'Active', GETDATE())
      `);

    const userData = mapUser(result.recordset[0]);
    const token = signToken(userData);
    res.status(201).json({
      message: "Registration successful.",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    if (err.message && err.message.includes("UQ_Users")) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
}

async function registerSeller(req, res) {
  const { email, password, phone, fullName } = req.body;

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
    const pool = await poolPromise;
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
      .input("phone", sql.NVarChar, normalizedPhone)
      .query(`
        SELECT UserID FROM Users
        WHERE LOWER(Email) = LOWER(@email) OR PhoneNumber = @phone
      `);

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: "Email or phone number already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
      .input("password", sql.NVarChar, hashedPassword)
      .input("phone", sql.NVarChar, normalizedPhone)
      .input("fullName", sql.NVarChar, fullName.trim())
      .input("username", sql.NVarChar, normalizedEmail.split('@')[0])
      .query(`
        INSERT INTO Users (Username, Email, Password, PhoneNumber, FullName, Role, Status, CreatedDate)
        OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.PhoneNumber, INSERTED.FullName, INSERTED.Role
        VALUES (@username, @email, @password, @phone, @fullName, 'Customer', 'Active', GETDATE())
      `);

    const userData = mapUser(result.recordset[0]);
    const token = signToken(userData);
    res.status(201).json({
      message: "Seller registration successful.",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Seller register error:", err.message);
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
    const pool = await poolPromise;
    const trimmed = String(loginId).trim();
    const phone = normalizePhone(trimmed);
    const isEmailLogin = isEmail(trimmed);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, isEmailLogin ? trimmed.toLowerCase() : "")
      .input("phone", sql.NVarChar, isEmailLogin ? "" : phone)
      .query(`
        SELECT UserID FROM Users
        WHERE Status = 'Active'
          AND ((@email <> '' AND LOWER(Email) = LOWER(@email))
            OR (@phone <> '' AND PhoneNumber = @phone))
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "No active account found with that email or phone." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool
      .request()
      .input("userId", sql.Int, result.recordset[0].UserID)
      .input("newPassword", sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Users SET Password = @newPassword, UpdatedDate = GETDATE()
        WHERE UserID = @userId
      `);

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
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query(`SELECT Password FROM Users WHERE UserID = @userId AND Status = 'Active'`);

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const valid = await comparePassword(currentPassword, user.Password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .input("newPassword", sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Users SET Password = @newPassword, UpdatedDate = GETDATE()
        WHERE UserID = @userId
      `);

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ message: "Server error during password change." });
  }
}

async function getProfile(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query(`
        SELECT UserID, Email, PhoneNumber, FullName, Role, Status
        FROM Users WHERE UserID = @userId
      `);

    const user = result.recordset[0];
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
