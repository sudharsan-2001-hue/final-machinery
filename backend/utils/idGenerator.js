const { sql, poolPromise } = require("../db");

/**
 * Generate prefixed IDs for database entities
 * Uses SQL Server stored procedures to generate sequential IDs
 * Falls back to JavaScript-based generation if stored procedure doesn't exist
 */
async function generateID(type, role = null) {
  const pool = await poolPromise;
  let procedureName;
  let prefix;

  switch (type) {
    case "user":
      procedureName = "sp_GenerateUserID";
      prefix = role === "Seller" ? "SEL" : "CUS";
      break;
    case "category":
      procedureName = "sp_GenerateCategoryID";
      prefix = "CAT";
      break;
    case "product":
      procedureName = "sp_GenerateProductID";
      prefix = "PRD";
      break;
    case "image":
      procedureName = "sp_GenerateImageID";
      prefix = "IMG";
      break;
    case "stock":
      procedureName = "sp_GenerateStockID";
      prefix = "STK";
      break;
    case "address":
      procedureName = "sp_GenerateAddressID";
      prefix = "ADR";
      break;
    case "cart":
      procedureName = "sp_GenerateCartID";
      prefix = "CRT";
      break;
    case "wishlist":
      procedureName = "sp_GenerateWishlistID";
      prefix = "WSH";
      break;
    case "order":
      procedureName = "sp_GenerateOrderID";
      prefix = "ODR";
      break;
    case "orderDetail":
      procedureName = "sp_GenerateOrderDetailID";
      prefix = "ODT";
      break;
    case "payment":
      procedureName = "sp_GeneratePaymentID";
      prefix = "PAY";
      break;
    case "invoice":
      procedureName = "sp_GenerateInvoiceID";
      prefix = "INV";
      break;
    case "review":
      procedureName = "sp_GenerateReviewID";
      prefix = "REV";
      break;
    default:
      throw new Error(`Unknown ID type: ${type}`);
  }

  try {
    const request = pool.request();
    
    if (type === "user" && role) {
      request.input("Role", sql.NVarChar, role);
      request.output("UserID", sql.NVarChar(20));
    } else if (type === "category") {
      request.output("CategoryID", sql.NVarChar(20));
    } else if (type === "product") {
      request.output("ProductID", sql.NVarChar(20));
    } else if (type === "image") {
      request.output("ImageID", sql.NVarChar(20));
    } else if (type === "stock") {
      request.output("StockID", sql.NVarChar(20));
    } else if (type === "address") {
      request.output("AddressID", sql.NVarChar(20));
    } else if (type === "cart") {
      request.output("CartID", sql.NVarChar(20));
    } else if (type === "wishlist") {
      request.output("WishlistID", sql.NVarChar(20));
    } else if (type === "order") {
      request.output("OrderID", sql.NVarChar(20));
    } else if (type === "orderDetail") {
      request.output("OrderDetailID", sql.NVarChar(20));
    } else if (type === "payment") {
      request.output("PaymentID", sql.NVarChar(20));
    } else if (type === "invoice") {
      request.output("InvoiceID", sql.NVarChar(20));
    } else if (type === "review") {
      request.output("ReviewID", sql.NVarChar(20));
    }

    await request.execute(procedureName);
    
    // Get the output parameter
    const outputParam = Object.keys(request.output)[0];
    return request.output[outputParam];
  } catch (err) {
    console.warn(`Stored procedure ${procedureName} not found, using fallback ID generation`);
    return generateIDFallback(type, prefix);
  }
}

/**
 * Fallback ID generation using JavaScript
 * Used when stored procedures don't exist in the database
 */
async function generateIDFallback(type, prefix) {
  const pool = await poolPromise;
  let tableName;
  let idColumn;

  switch (type) {
    case "user":
      tableName = "Users";
      idColumn = "UserID";
      break;
    case "category":
      tableName = "Categories";
      idColumn = "CategoryID";
      break;
    case "product":
      tableName = "Products";
      idColumn = "ProductID";
      break;
    case "image":
      tableName = "ProductImages";
      idColumn = "ImageID";
      break;
    case "stock":
      tableName = "Stock";
      idColumn = "StockID";
      break;
    case "address":
      tableName = "Addresses";
      idColumn = "AddressID";
      break;
    case "cart":
      tableName = "Cart";
      idColumn = "CartID";
      break;
    case "wishlist":
      tableName = "Wishlist";
      idColumn = "WishlistID";
      break;
    case "order":
      tableName = "Orders";
      idColumn = "OrderID";
      break;
    case "orderDetail":
      tableName = "OrderDetails";
      idColumn = "OrderDetailID";
      break;
    case "payment":
      tableName = "Payments";
      idColumn = "PaymentID";
      break;
    case "invoice":
      tableName = "Invoices";
      idColumn = "InvoiceID";
      break;
    case "review":
      tableName = "Reviews";
      idColumn = "ReviewID";
      break;
    default:
      throw new Error(`Unknown ID type: ${type}`);
  }

  try {
    const result = await pool.request().query(`
      SELECT ISNULL(MAX(CAST(SUBSTRING(${idColumn}, 4, LEN(${idColumn}) - 3) AS INT)), 0) + 1 AS NextNum
      FROM ${tableName}
      WHERE ${idColumn} LIKE '${prefix}%'
    `);
    
    const nextNum = result.recordset[0].NextNum;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error(`Error in fallback ID generation for ${type}:`, err.message);
    // If table doesn't exist, return first ID
    return `${prefix}001`;
  }
}

module.exports = { generateID };
