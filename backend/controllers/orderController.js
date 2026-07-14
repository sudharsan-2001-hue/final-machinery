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
  const orderStatus = paymentDetails.orderStatus || (cod ? "Pending" : "Processing");
  const paymentStatus = paymentDetails.paymentStatus || (cod ? "Pending" : "Completed");

  try {
    await transaction.begin();

    const stockCheck = await transaction
      .request()
      .input("productId", sql.Int, item.id)
      .query("SELECT StockQuantity, MachineName FROM MachineryProducts WHERE ProductID = @productId");

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
    const unitPrice = Number(item.price);

    const orderResult = await transaction
      .request()
      .input("userId", sql.Int, userId)
      .input("addressId", sql.Int, addressId)
      .input("orderNumber", sql.NVarChar, orderNumber)
      .input("totalAmount", sql.Decimal(18, 2), Number(totalAmount))
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("orderStatus", sql.NVarChar, orderStatus)
      .query(`
        INSERT INTO Orders (UserID, AddressID, OrderNumber, TotalAmount, PaymentMethod, OrderStatus, OrderDate)
        OUTPUT INSERTED.OrderID, INSERTED.OrderNumber, INSERTED.TotalAmount, INSERTED.PaymentMethod, INSERTED.OrderDate, INSERTED.OrderStatus
        VALUES (@userId, @addressId, @orderNumber, @totalAmount, @paymentMethod, @orderStatus, GETDATE())
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
    const userId = req.body.userId || req.user?.id;
    if (req.user && req.user.id !== Number(userId)) {
      return res.status(403).json({ message: "Cannot place order for another user." });
    }

    const orderResult = await createOrderRecord({
      userId,
      addressId: req.body.addressId,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      item: req.body.item,
    });

    res.status(201).json(orderResult);
  } catch (err) {
    console.error("Create order error:", err.message);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Failed to place order." });
  }
}

module.exports = {
  createOrderRecord,
  getAllOrders,
  getUserOrders,
  createOrder,
};
