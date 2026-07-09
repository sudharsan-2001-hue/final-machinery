const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { mapAddress } = require("../utils/mappers");
const { authenticate } = require("../middleware/authMiddleware");

function assertUserAccess(req, res, userId) {
  if (req.user.role === "admin") return true;
  if (req.user.id !== Number(userId)) {
    res.status(403).json({ message: "Access denied." });
    return false;
  }
  return true;
}

router.get("/users/:userId/addresses", authenticate, async (req, res) => {
  if (!assertUserAccess(req, res, req.params.userId)) return;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.params.userId)
      .query(`
        SELECT * FROM CustomerAddresses
        WHERE UserID = @userId
        ORDER BY CreatedDate DESC
      `);
    res.json(result.recordset.map(mapAddress));
  } catch (err) {
    console.error("Get addresses error:", err.message);
    res.status(500).json({ message: "Failed to fetch addresses." });
  }
});

router.post("/users/:userId/addresses", authenticate, async (req, res) => {
  if (!assertUserAccess(req, res, req.params.userId)) return;
  const { fullName, phone, email, addressLine1, addressLine2, city, state, pincode, country } = req.body;

  if (!fullName || !phone || !email || !addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ message: "All address fields are required." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.params.userId)
      .input("fullName", sql.NVarChar, fullName.trim())
      .input("phone", sql.NVarChar, phone.trim())
      .input("email", sql.NVarChar, email.trim())
      .input("addressLine1", sql.NVarChar, addressLine1.trim())
      .input("addressLine2", sql.NVarChar, addressLine2 || "")
      .input("city", sql.NVarChar, city.trim())
      .input("state", sql.NVarChar, state.trim())
      .input("pincode", sql.NVarChar, pincode.trim())
      .input("country", sql.NVarChar, country || "India")
      .query(`
        INSERT INTO CustomerAddresses
          (UserID, FullName, PhoneNumber, Email, AddressLine1, AddressLine2, City, State, Pincode, Country, CreatedDate)
        OUTPUT INSERTED.*
        VALUES (@userId, @fullName, @phone, @email, @addressLine1, @addressLine2, @city, @state, @pincode, @country, GETDATE())
      `);

    res.status(201).json(mapAddress(result.recordset[0]));
  } catch (err) {
    console.error("Add address error:", err.message);
    res.status(500).json({ message: "Failed to save address." });
  }
});

module.exports = router;
