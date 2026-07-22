const { sql, poolPromise } = require("../db");
const { formatOrderResponse, formatAdminOrder } = require("../utils/mappers");

function generateOrderNumber() {
  return `ORD${Date.now()}`;
}

function isCodPayment(method) {
  const m = (method || "").toLowerCase();
  return m.includes("cash") || m.includes("cod");
}

async function fetchOrderDetails(pool, orderId) {
  const orderResult = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .query(`
      SELECT o.*, u.Username, u.Email AS UserEmail, u.PhoneNumber AS UserPhone,
             a.FullName, a.PhoneNumber, a.Email, a.AddressLine1, a.City, a.State, a.Pincode,
             pay.PaymentStatus
      FROM Orders o
      INNER JOIN Users u ON o.UserID = u.UserID
      INNER JOIN CustomerAddresses a ON o.AddressID = a.AddressID
      LEFT JOIN Payments pay ON pay.OrderID = o.OrderID
      WHERE o.OrderID = @orderId
    `);

  const itemsResult = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .query(`
      SELECT oi.*, p.MachineName, p.MachineImage
      FROM OrderItems oi
      INNER JOIN MachineryProducts p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = @orderId
    `);

  return { order: orderResult.recordset[0], items: itemsResult.recordset };
}

async function createOrderRecord(orderData) {
  const {
    userId,
    addressId,
    totalAmount,
    paymentMethod,
    item,
    shopId,
    paymentDetails = {},
  } = orderData;

  if (!userId || !addressId || !totalAmount || !paymentMethod || !item?.id) {
    const err = new Error("Invalid order data.");
    err.status = 400;
    throw err;
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  const cod = isCodPayment(paymentMethod);
  const orderStatus = paymentDetails.orderStatus || (cod ? "Pending" : "Preparing");
  const paymentStatus = paymentDetails.paymentStatus || (cod ? "Pending" : "Completed");

  try {
    await transaction.begin();

    const stockCheck = await transaction
      .request()
      .input("productId", sql.Int, item.id)
      .query("SELECT StockQuantity, MachineName, ShopID FROM MachineryProducts WHERE ProductID = @productId");

    const product = stockCheck.recordset[0];
    if (!product) {
      await transaction.rollback();
      const err = new Error("Product not found.");
      err.status = 404;
      throw err;
    }

    const qty = Number(item.quantity) || 1;
    if (product.StockQuantity < qty) {
      await transaction.rollback();
      const err = new Error("Insufficient stock for this order.");
      err.status = 400;
      throw err;
    }

    const orderNumber = generateOrderNumber();
    const unitPrice = Number(item.price || item.offerPrice || item.originalPrice);
    const finalShopId = shopId || product.ShopID || 1;

    const orderResult = await transaction
      .request()
      .input("userId", sql.Int, userId)
      .input("addressId", sql.Int, addressId)
      .input("orderNumber", sql.NVarChar, orderNumber)
      .input("totalAmount", sql.Decimal(18, 2), Number(totalAmount))
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("orderStatus", sql.NVarChar, orderStatus)
      .input("shopId", sql.Int, finalShopId)
      .query(`
        INSERT INTO Orders (UserID, AddressID, OrderNumber, TotalAmount, PaymentMethod, OrderStatus, ShopID, OrderDate)
        OUTPUT INSERTED.OrderID, INSERTED.OrderNumber, INSERTED.TotalAmount, INSERTED.PaymentMethod, INSERTED.OrderDate, INSERTED.OrderStatus
        VALUES (@userId, @addressId, @orderNumber, @totalAmount, @paymentMethod, @orderStatus, @shopId, GETDATE())
      `);

    const order = orderResult.recordset[0];
    const totalPrice = unitPrice * qty;

    await transaction
      .request()
      .input("orderId", sql.Int, order.OrderID)
      .input("productId", sql.Int, item.id)
      .input("quantity", sql.Int, qty)
      .input("unitPrice", sql.Decimal(18, 2), unitPrice)
      .input("totalPrice", sql.Decimal(18, 2), totalPrice)
      .query(`
        INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice, TotalPrice, CreatedDate)
        VALUES (@orderId, @productId, @quantity, @unitPrice, @totalPrice, GETDATE())
      `);

    const transactionId = paymentDetails.transactionId || paymentDetails.razorpayPaymentId || `PAY${Date.now()}`;

    await transaction
      .request()
      .input("orderId", sql.Int, order.OrderID)
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("paymentStatus", sql.NVarChar, paymentStatus)
      .input("amount", sql.Decimal(18, 2), Number(totalAmount))
      .input("transactionId", sql.NVarChar, transactionId)
      .query(`
        INSERT INTO Payments (OrderID, PaymentMethod, TransactionID, PaymentStatus, Amount, PaymentDate)
        VALUES (@orderId, @paymentMethod, @transactionId, @paymentStatus, @amount, GETDATE())
      `);

    const newStock = product.StockQuantity - qty;
    const newStatus = newStock > 0 ? "Active" : "Out of Stock";

    await transaction
      .request()
      .input("productId", sql.Int, item.id)
      .input("newStock", sql.Int, newStock)
      .input("newStatus", sql.NVarChar, newStatus)
      .query(`
        UPDATE MachineryProducts
        SET StockQuantity = @newStock, Status = @newStatus, UpdatedDate = GETDATE()
        WHERE ProductID = @productId
      `);

    await transaction
      .request()
      .input("productId", sql.Int, item.id)
      .input("previousStock", sql.Int, product.StockQuantity)
      .input("currentStock", sql.Int, newStock)
      .input("remarks", sql.NVarChar, `Order ${orderNumber}`)
      .query(`
        INSERT INTO StockHistory (ProductID, PreviousStock, CurrentStock, ActionType, Remarks, CreatedDate)
        VALUES (@productId, @previousStock, @currentStock, 'Sale', @remarks, GETDATE())
      `);

    await transaction.commit();

    const { order: fullOrder, items } = await fetchOrderDetails(pool, order.OrderID);
    const address = {
      AddressLine1: fullOrder.AddressLine1,
      City: fullOrder.City,
      State: fullOrder.State,
      Pincode: fullOrder.Pincode,
    };

    return formatOrderResponse(
      fullOrder,
      items,
      {
        FullName: fullOrder.FullName,
        Username: fullOrder.Username,
        PhoneNumber: fullOrder.PhoneNumber,
        Email: fullOrder.Email,
      },
      address
    );
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {}
    throw err;
  }
}

async function getAllOrders(req, res) {
  try {
    const pool = await poolPromise;
    const orders = await pool.request().query(`
      SELECT o.OrderID, o.OrderNumber, o.TotalAmount, o.PaymentMethod, o.OrderDate, o.OrderStatus,
             u.Username, u.PhoneNumber, u.Email
      FROM Orders o
      INNER JOIN Users u ON o.UserID = u.UserID
      ORDER BY o.OrderDate DESC
    `);

    const formatted = [];
    for (const order of orders.recordset) {
      const items = await pool
        .request()
        .input("orderId", sql.Int, order.OrderID)
        .query(`
          SELECT oi.Quantity, p.MachineName
          FROM OrderItems oi
          INNER JOIN MachineryProducts p ON oi.ProductID = p.ProductID
          WHERE oi.OrderID = @orderId
        `);

      formatted.push(
        formatAdminOrder(order, items.recordset, {
          Username: order.Username,
          PhoneNumber: order.PhoneNumber,
        })
      );
    }

    res.json(formatted);
  } catch (err) {
    console.error("Get orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    console.log("Update order status - orderId:", orderId, "type:", typeof orderId, "orderStatus:", orderStatus);

    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, numericOrderId)
      .input("orderStatus", sql.NVarChar, orderStatus)
      .query(`
        UPDATE Orders
        SET OrderStatus = @orderStatus, UpdatedDate = GETDATE()
        WHERE OrderID = @orderId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updated = await pool
      .request()
      .input("orderId", sql.Int, numericOrderId)
      .query(`
        SELECT OrderID, OrderNumber, OrderStatus, TotalAmount
        FROM Orders
        WHERE OrderID = @orderId
      `);

    res.json(updated.recordset[0]);
  } catch (err) {
    console.error("Update order status error:", err.message);
    res.status(500).json({ message: "Failed to update order status." });
  }
}

async function getUserOrders(req, res) {
  try {
    const userId = Number(req.params.userId);
    if (req.user && req.user.role === "customer" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const pool = await poolPromise;
    const orders = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT OrderID, OrderNumber, TotalAmount, PaymentMethod, OrderDate, OrderStatus
        FROM Orders
        WHERE UserID = @userId
        ORDER BY OrderDate DESC
      `);

    res.json(
      orders.recordset.map((o) => ({
        orderId: o.OrderNumber,
        totalAmount: Number(o.TotalAmount),
        paymentMethod: o.PaymentMethod,
        orderDate: o.OrderDate ? new Date(o.OrderDate).toLocaleDateString("en-IN") : "",
        status: o.OrderStatus,
      }))
    );
  } catch (err) {
    console.error("Get user orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch user orders." });
  }
}

async function createOrder(req, res) {
  try {
    const orderData = req.body;
    orderData.userId = req.user.id;
    
    const result = await createOrderRecord(orderData);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Failed to create order." });
  }
}

module.exports = {
  createOrderRecord,
  getAllOrders,
  getUserOrders,
  createOrder,
  updateOrderStatus,
};
