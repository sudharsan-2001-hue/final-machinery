const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/admin/metrics", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    const products = await pool.request().query("SELECT COUNT(*) AS cnt FROM MachineryProducts");
    const orders = await pool.request().query("SELECT COUNT(*) AS cnt FROM Orders");
    const revenue = await pool.request().query(`
      SELECT ISNULL(SUM(TotalAmount), 0) AS total FROM Orders
    `);
    const stock = await pool.request().query(`
      SELECT ISNULL(SUM(StockQuantity), 0) AS total FROM MachineryProducts
    `);

    res.json({
      totalProducts: products.recordset[0].cnt,
      totalOrders: orders.recordset[0].cnt,
      totalRevenue: Number(revenue.recordset[0].total),
      totalStock: stock.recordset[0].total,
    });
  } catch (err) {
    console.error("Metrics error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard metrics." });
  }
});

router.post("/notifications", authenticate, async (req, res) => {
  const { email, productId } = req.body;

  if (!email || !productId) {
    return res.status(400).json({ message: "Email and product ID are required." });
  }

  try {
    const pool = await poolPromise;

    const product = await pool
      .request()
      .input("productId", sql.Int, productId)
      .query("SELECT MachineName FROM MachineryProducts WHERE ProductID = @productId");

    if (!product.recordset[0]) {
      return res.status(404).json({ message: "Product not found." });
    }

    await pool
      .request()
      .input("email", sql.NVarChar, email.trim())
      .input("description", sql.NVarChar, `Restock notification requested for product #${productId} (${product.recordset[0].MachineName}) by ${email}`)
      .query(`
        INSERT INTO AdminActivityLogs (AdminUserID, ActivityType, Description, CreatedDate)
        VALUES (1, 'RestockNotification', @description, GETDATE())
      `);

    res.status(201).json({ message: "Notification registered. We will notify you when restocked." });
  } catch (err) {
    console.error("Notification error:", err.message);
    res.status(500).json({ message: "Failed to register notification." });
  }
});

module.exports = router;
