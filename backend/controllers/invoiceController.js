const { sql, poolPromise } = require("../db");

/**
 * Generate Invoice for an Order
 */
async function generateInvoice(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const pool = await poolPromise;

    // Check if order exists and belongs to user
    const orderResult = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT o.*, u.FullName, u.PhoneNumber, u.Email,
               a.FullName AS AddressName, a.AddressLine1, a.AddressLine2, 
               a.City, a.State, a.Pincode, a.Country
        FROM Orders o
        INNER JOIN Users u ON o.UserID = u.UserID
        INNER JOIN CustomerAddresses a ON o.AddressID = a.AddressID
        WHERE o.OrderID = @orderId AND o.UserID = @userId
      `);

    const order = orderResult.recordset[0];
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Return order details as invoice (since Invoices table doesn't exist in schema)
    // Fetch order items
    const itemsResult = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT oi.*, p.MachineName AS ProductName
        FROM OrderItems oi
        INNER JOIN MachineryProducts p ON oi.ProductID = p.ProductID
        WHERE oi.OrderID = @orderId
      `);

    res.status(201).json({
      invoice: order,
      items: itemsResult.recordset,
    });
  } catch (err) {
    console.error("Generate invoice error:", err.message);
    res.status(500).json({ message: "Failed to generate invoice." });
  }
}

/**
 * Get Invoice by ID
 */
async function getInvoice(req, res) {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;

    const pool = await poolPromise;

    // Fetch order as invoice (since Invoices table doesn't exist)
    const orderResult = await pool
      .request()
      .input("orderId", sql.Int, invoiceId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT o.*, u.FullName AS CustomerName, u.PhoneNumber AS CustomerPhone, 
               u.Email AS CustomerEmail,
               a.AddressLine1, a.AddressLine2, a.City, a.State, a.Pincode, a.Country
        FROM Orders o
        INNER JOIN Users u ON o.UserID = u.UserID
        INNER JOIN CustomerAddresses a ON o.AddressID = a.AddressID
        WHERE o.OrderID = @orderId AND o.UserID = @userId
      `);

    const order = orderResult.recordset[0];
    if (!order) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    // Fetch order items
    const itemsResult = await pool
      .request()
      .input("orderId", sql.Int, invoiceId)
      .query(`
        SELECT oi.*, p.MachineName AS ProductName
        FROM OrderItems oi
        INNER JOIN MachineryProducts p ON oi.ProductID = p.ProductID
        WHERE oi.OrderID = @orderId
      `);

    res.json({
      invoice: order,
      items: itemsResult.recordset,
    });
  } catch (err) {
    console.error("Get invoice error:", err.message);
    res.status(500).json({ message: "Failed to fetch invoice." });
  }
}

/**
 * Get User Invoices
 */
async function getUserInvoices(req, res) {
  try {
    const userId = req.user.id;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT o.* 
        FROM Orders o
        WHERE o.UserID = @userId
        ORDER BY o.OrderDate DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get user invoices error:", err.message);
    res.status(500).json({ message: "Failed to fetch invoices." });
  }
}

/**
 * Update Invoice Status
 */
async function updateInvoiceStatus(req, res) {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    if (!status || !["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("orderId", sql.Int, invoiceId)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE Orders 
        SET OrderStatus = @status, UpdatedDate = GETDATE()
        WHERE OrderID = @orderId
      `);

    res.json({ message: "Order status updated successfully." });
  } catch (err) {
    console.error("Update invoice status error:", err.message);
    res.status(500).json({ message: "Failed to update order status." });
  }
}

/**
 * Delete Invoice
 */
async function deleteInvoice(req, res) {
  try {
    const { invoiceId } = req.params;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, invoiceId)
      .query("DELETE FROM Orders WHERE OrderID = @orderId");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({ message: "Order deleted successfully." });
  } catch (err) {
    console.error("Delete invoice error:", err.message);
    res.status(500).json({ message: "Failed to delete order." });
  }
}

module.exports = {
  generateInvoice,
  getInvoice,
  getUserInvoices,
  updateInvoiceStatus,
  deleteInvoice,
};
