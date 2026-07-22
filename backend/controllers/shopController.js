const { sql, poolPromise } = require("../db");

function mapShop(row) {
  return {
    id: row.ShopID,
    name: row.ShopName,
    description: row.ShopDescription,
    image: row.ShopImage,
    ownerId: row.OwnerUserID,
    status: row.Status,
    createdDate: row.CreatedDate,
  };
}

async function getAllShops(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT ShopID, ShopName, ShopDescription, ShopImage, OwnerUserID, Status, CreatedDate
        FROM Shops
        WHERE Status = 'Active'
        ORDER BY ShopName
      `);
    res.json(result.recordset.map(mapShop));
  } catch (err) {
    console.error("Get shops error:", err.message);
    res.status(500).json({ message: "Failed to fetch shops." });
  }
}

async function getShopById(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT ShopID, ShopName, ShopDescription, ShopImage, OwnerUserID, Status, CreatedDate
        FROM Shops
        WHERE ShopID = @id AND Status = 'Active'
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "Shop not found." });
    }
    res.json(mapShop(result.recordset[0]));
  } catch (err) {
    console.error("Get shop error:", err.message);
    res.status(500).json({ message: "Failed to fetch shop." });
  }
}

async function createShop(req, res) {
  const { name, description, image } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Shop name is required." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("description", sql.NVarChar, description || "")
      .input("image", sql.NVarChar, image || "")
      .input("ownerId", sql.Int, req.user?.id || null)
      .query(`
        INSERT INTO Shops (ShopName, ShopDescription, ShopImage, OwnerUserID, Status)
        OUTPUT INSERTED.ShopID, INSERTED.ShopName, INSERTED.ShopDescription, INSERTED.ShopImage, INSERTED.OwnerUserID, INSERTED.Status, INSERTED.CreatedDate
        VALUES (@name, @description, @image, @ownerId, 'Active')
      `);

    res.status(201).json(mapShop(result.recordset[0]));
  } catch (err) {
    console.error("Create shop error:", err.message);
    res.status(500).json({ message: "Failed to create shop." });
  }
}

async function updateShop(req, res) {
  const { name, description, image, status } = req.body;

  try {
    const pool = await poolPromise;
    const request = pool.request().input("id", sql.Int, req.params.id);
    const sets = [];

    if (name) {
      request.input("name", sql.NVarChar, name.trim());
      sets.push("ShopName = @name");
    }
    if (description !== undefined) {
      request.input("description", sql.NVarChar, description);
      sets.push("ShopDescription = @description");
    }
    if (image !== undefined) {
      request.input("image", sql.NVarChar, image);
      sets.push("ShopImage = @image");
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
      UPDATE Shops SET ${sets.join(", ")}
      WHERE ShopID = @id
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const updated = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT ShopID, ShopName, ShopDescription, ShopImage, OwnerUserID, Status, CreatedDate
        FROM Shops
        WHERE ShopID = @id
      `);

    res.json(mapShop(updated.recordset[0]));
  } catch (err) {
    console.error("Update shop error:", err.message);
    res.status(500).json({ message: "Failed to update shop." });
  }
}

async function deleteShop(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        UPDATE Shops 
        SET Status = 'Inactive', UpdatedDate = GETDATE()
        WHERE ShopID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

    res.json({ message: "Shop deactivated successfully." });
  } catch (err) {
    console.error("Delete shop error:", err.message);
    res.status(500).json({ message: "Failed to deactivate shop." });
  }
}

module.exports = {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
};
