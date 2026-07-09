/**
 * One-time migration: hash existing plaintext passwords with bcrypt.
 * Run: node scripts/hashExistingPasswords.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("../db");

async function main() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT UserID, Password FROM Users
  `);

  let updated = 0;
  for (const row of result.recordset) {
    if (row.Password.startsWith("$2")) continue;
    const hash = await bcrypt.hash(row.Password, 10);
    await pool
      .request()
      .input("userId", sql.Int, row.UserID)
      .input("hash", sql.NVarChar, hash)
      .query(`UPDATE Users SET Password = @hash, UpdatedDate = GETDATE() WHERE UserID = @userId`);
    updated++;
  }
  console.log(`Hashed ${updated} password(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
