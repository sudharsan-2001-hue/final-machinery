const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { mapProduct } = require("../utils/mappers");
const { PRODUCT_SELECT, getCategoryId, productStatus } = require("../utils/productHelpers");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`${PRODUCT_SELECT} ORDER BY p.ProductID DESC`);
    res.json(result.recordset.map(mapProduct));
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ message: "Failed to fetch products." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`${PRODUCT_SELECT} WHERE p.ProductID = @id`);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(mapProduct(result.recordset[0]));
  } catch (err) {
    console.error("Get product error:", err.message);
    res.status(500).json({ message: "Failed to fetch product." });
  }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { name, description, originalPrice, offerPrice, stock, category, image } = req.body;

  if (!name || !description || originalPrice == null || offerPrice == null || stock == null || !category) {
    return res.status(400).json({ message: "All product fields are required." });
  }

  try {
    const pool = await poolPromise;
    const categoryId = await getCategoryId(pool, category);
    const status = productStatus(Number(stock));

    const result = await pool
      .request()
      .input("categoryId", sql.Int, categoryId)
      .input("name", sql.NVarChar, name.trim())
      .input("description", sql.NVarChar, description.trim())
      .input("originalPrice", sql.Decimal(18, 2), Number(originalPrice))
      .input("offerPrice", sql.Decimal(18, 2), Number(offerPrice))
      .input("stock", sql.Int, Number(stock))
      .input("image", sql.NVarChar, image || "")
      .input("status", sql.NVarChar, status)
      .query(`
        INSERT INTO MachineryProducts
          (CategoryID, MachineName, Description, OriginalPrice, OfferPrice, StockQuantity, MachineImage, Status, CreatedDate)
        OUTPUT INSERTED.ProductID
        VALUES (@categoryId, @name, @description, @originalPrice, @offerPrice, @stock, @image, @status, GETDATE())
      `);

    const productId = result.recordset[0].ProductID;

    await pool
      .request()
      .input("productId", sql.Int, productId)
      .input("previousStock", sql.Int, 0)
      .input("currentStock", sql.Int, Number(stock))
      .query(`
        INSERT INTO StockHistory (ProductID, PreviousStock, CurrentStock, ActionType, Remarks, CreatedDate)
        VALUES (@productId, @previousStock, @currentStock, 'Initial', 'Product registered', GETDATE())
      `);

    const saved = await pool
      .request()
      .input("id", sql.Int, productId)
      .query(`${PRODUCT_SELECT} WHERE p.ProductID = @id`);

    res.status(201).json(mapProduct(saved.recordset[0]));
  } catch (err) {
    console.error("Add product error:", err.message);
    res.status(500).json({ message: "Failed to register product." });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const { name, description, originalPrice, offerPrice, stock, category } = req.body;

  try {
    const pool = await poolPromise;
    const categoryId = category ? await getCategoryId(pool, category) : null;
    const status = stock != null ? productStatus(Number(stock)) : null;

    const request = pool.request().input("id", sql.Int, req.params.id);
    const sets = [];

    if (categoryId) {
      request.input("categoryId", sql.Int, categoryId);
      sets.push("CategoryID = @categoryId");
    }
    if (name) {
      request.input("name", sql.NVarChar, name.trim());
      sets.push("MachineName = @name");
    }
    if (description) {
      request.input("description", sql.NVarChar, description.trim());
      sets.push("Description = @description");
    }
    if (originalPrice != null) {
      request.input("originalPrice", sql.Decimal(18, 2), Number(originalPrice));
      sets.push("OriginalPrice = @originalPrice");
    }
    if (offerPrice != null) {
      request.input("offerPrice", sql.Decimal(18, 2), Number(offerPrice));
      sets.push("OfferPrice = @offerPrice");
    }
    if (stock != null) {
      request.input("stock", sql.Int, Number(stock));
      sets.push("StockQuantity = @stock");
    }
    if (status) {
      request.input("status", sql.NVarChar, status);
      sets.push("Status = @status");
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    sets.push("UpdatedDate = GETDATE()");

    const result = await request.query(`
      UPDATE MachineryProducts SET ${sets.join(", ")}
      WHERE ProductID = @id
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updated = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`${PRODUCT_SELECT} WHERE p.ProductID = @id`);

    res.json(mapProduct(updated.recordset[0]));
  } catch (err) {
    console.error("Update product error:", err.message);
    res.status(500).json({ message: "Failed to update product." });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = req.params.id;

    await pool.request().input("id", sql.Int, id).query("DELETE FROM OrderItems WHERE ProductID = @id");
    await pool.request().input("id", sql.Int, id).query("DELETE FROM StockHistory WHERE ProductID = @id");
    await pool.request().input("id", sql.Int, id).query("DELETE FROM ProductImages WHERE ProductID = @id");

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM MachineryProducts WHERE ProductID = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ message: "Failed to delete product." });
  }
});

router.put("/:id/stock", authenticate, requireAdmin, async (req, res) => {
  const { stock, remarks } = req.body;

  if (stock == null) {
    return res.status(400).json({ message: "Stock value is required." });
  }

  try {
    const pool = await poolPromise;
    const current = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT StockQuantity FROM MachineryProducts WHERE ProductID = @id");

    if (!current.recordset[0]) {
      return res.status(404).json({ message: "Product not found." });
    }

    const previousStock = current.recordset[0].StockQuantity;
    const newStock = Number(stock);
    const status = productStatus(newStock);

    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("stock", sql.Int, newStock)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE MachineryProducts
        SET StockQuantity = @stock, Status = @status, UpdatedDate = GETDATE()
        WHERE ProductID = @id
      `);

    await pool
      .request()
      .input("productId", sql.Int, req.params.id)
      .input("previousStock", sql.Int, previousStock)
      .input("currentStock", sql.Int, newStock)
      .input("remarks", sql.NVarChar, remarks || "Stock updated")
      .query(`
        INSERT INTO StockHistory (ProductID, PreviousStock, CurrentStock, ActionType, Remarks, CreatedDate)
        VALUES (@productId, @previousStock, @currentStock, 'Update', @remarks, GETDATE())
      `);

    const updated = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`${PRODUCT_SELECT} WHERE p.ProductID = @id`);

    res.json(mapProduct(updated.recordset[0]));
  } catch (err) {
    console.error("Update stock error:", err.message);
    res.status(500).json({ message: "Failed to update stock." });
  }
});

module.exports = router;
