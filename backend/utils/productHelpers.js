const { sql, poolPromise } = require("../db");

const PRODUCT_SELECT = `
  SELECT p.ProductID, p.MachineName, p.Description, p.OriginalPrice, p.OfferPrice,
         p.StockQuantity, p.MachineImage, p.BrandName, p.ModelNumber, p.Weight, p.Status,
         c.CategoryName
  FROM MachineryProducts p
  INNER JOIN MachineryCategories c ON p.CategoryID = c.CategoryID
`;

async function getCategoryId(pool, categoryName, transaction) {
  const request = transaction ? transaction.request() : pool.request();
  const existing = await request
    .input("categoryName", sql.NVarChar, categoryName)
    .query("SELECT CategoryID FROM MachineryCategories WHERE CategoryName = @categoryName");

  if (existing.recordset[0]) {
    return existing.recordset[0].CategoryID;
  }

  const insertReq = transaction ? transaction.request() : pool.request();
  const inserted = await insertReq
    .input("categoryName", sql.NVarChar, categoryName)
    .query(`
      INSERT INTO MachineryCategories (CategoryName, CreatedDate)
      OUTPUT INSERTED.CategoryID
      VALUES (@categoryName, GETDATE())
    `);
  return inserted.recordset[0].CategoryID;
}

function productStatus(stock) {
  return stock > 0 ? "Active" : "Out of Stock";
}

module.exports = {
  PRODUCT_SELECT,
  getCategoryId,
  productStatus,
};
