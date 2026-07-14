const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sql, poolPromise } = require("../db");

// Initialize Razorpay instance lazily
let razorpay = null;

function getRazorpayInstance() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured in environment variables");
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

/**
 * Create Razorpay Order
 */
async function createRazorpayOrder(req, res) {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay credentials not configured." });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.create(options);

   res.json({
  success: true,
  key: process.env.RAZORPAY_KEY_ID,
  orderId: order.id,
  amount: order.amount,
  currency: order.currency,
  receipt: order.receipt,
  status: order.status,
});
  } catch (err) {
    console.error("Razorpay order creation error:", err.message);
    res.status(500).json({ message: "Failed to create Razorpay order." });
  }
}

/**
 * Verify Razorpay Payment
 */
async function verifyRazorpayPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      addressId,
      totalAmount,
      item,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification details." });
    }

    if (!userId || !addressId || !totalAmount || !item) {
      return res.status(400).json({ message: "Missing order details." });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    // Fetch payment details from Razorpay
    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      return res.status(400).json({ message: "Payment not successful." });
    }

    const pool = await poolPromise;

    // Generate prefixed order number
    const orderNumber = `ORD${Date.now()}`;

    // Generate prefixed payment ID
    const paymentId = `PAY${Date.now()}`;

    // Create order first
    const orderResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("addressId", sql.Int, addressId)
      .input("orderNumber", sql.NVarChar, orderNumber)
      .input("totalAmount", sql.Decimal(18, 2), Number(totalAmount))
      .input("paymentMethod", sql.NVarChar, "Razorpay")
      .input("orderStatus", sql.NVarChar, "Processing")
      .query(`
        INSERT INTO Orders (UserID, AddressID, OrderNumber, TotalAmount, PaymentMethod, OrderStatus, OrderDate)
        OUTPUT INSERTED.OrderID, INSERTED.OrderNumber, INSERTED.TotalAmount, INSERTED.OrderStatus
        VALUES (@userId, @addressId, @orderNumber, @totalAmount, @paymentMethod, @orderStatus, GETDATE())
      `);

    const orderId = orderResult.recordset[0].OrderID;

    // Insert order item
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("productId", sql.Int, item.id)
      .input("quantity", sql.Int, item.quantity)
      .input("unitPrice", sql.Decimal(18, 2), Number(item.price))
      .input("totalPrice", sql.Decimal(18, 2), Number(item.price) * Number(item.quantity))
      .query(`
        INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice, TotalPrice, CreatedDate)
        VALUES (@orderId, @productId, @quantity, @unitPrice, @totalPrice, GETDATE())
      `);

    // Store payment in database with prefixed payment ID
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("transactionId", sql.NVarChar, razorpay_payment_id)
      .input("paymentId", sql.NVarChar, paymentId)
      .input("amount", sql.Decimal(18, 2), Number(totalAmount))
      .input("paymentMethod", sql.NVarChar, "Razorpay")
      .input("paymentStatus", sql.NVarChar, "Completed")
      .query(`
        INSERT INTO Payments (OrderID, TransactionID, PaymentMethod, PaymentStatus, Amount, PaymentDate)
        VALUES (@orderId, @transactionId, @paymentMethod, @paymentStatus, @amount, GETDATE())
      `);

    // Update product stock
    await pool
      .request()
      .input("productId", sql.Int, item.id)
      .input("quantity", sql.Int, item.quantity)
      .query(`
        UPDATE MachineryProducts
        SET StockQuantity = StockQuantity - @quantity,
            Status = CASE WHEN StockQuantity - @quantity <= 0 THEN 'Out of Stock' ELSE 'Active' END,
            UpdatedDate = GETDATE()
        WHERE ProductID = @productId
      `);

    res.json({
      message: "Payment verified successfully.",
      paymentStatus: "Completed",
      order: orderResult.recordset[0],
    });
  } catch (err) {
    console.error("Razorpay payment verification error:", err.message);
    res.status(500).json({ message: "Failed to verify payment." });
  }
}

/**
 * Handle Payment Failure
 */
async function handlePaymentFailure(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      error_code,
      error_description,
      error_source,
      error_step,
      order_id,
      amount,
    } = req.body;

    const pool = await poolPromise;

    // Store failed payment
    await pool
      .request()
      .input("orderId", sql.Int, order_id)
      .input("razorpayOrderId", sql.NVarChar, razorpay_order_id)
      .input("razorpayPaymentId", sql.NVarChar, razorpay_payment_id)
      .input("transactionId", sql.NVarChar, razorpay_payment_id)
      .input("amount", sql.Decimal(18, 2), Number(amount))
      .input("paymentMethod", sql.NVarChar, "Razorpay")
      .input("paymentStatus", sql.NVarChar, "Failed")
      .query(`
        INSERT INTO Payments (OrderID, TransactionID, PaymentMethod, PaymentStatus, Amount, PaymentDate)
        VALUES (@orderId, @transactionId, @paymentMethod, @paymentStatus, @amount, GETDATE())
      `);

    // Update order payment status
    await pool
      .request()
      .input("orderId", sql.Int, order_id)
      .input("orderStatus", sql.NVarChar, "Cancelled")
      .query(`
        UPDATE Orders 
        SET OrderStatus = @orderStatus, UpdatedDate = GETDATE()
        WHERE OrderID = @orderId
      `);

    res.json({
      message: "Payment failure recorded.",
      paymentStatus: "Failed",
    });
  } catch (err) {
    console.error("Payment failure handling error:", err.message);
    res.status(500).json({ message: "Failed to record payment failure." });
  }
}

/**
 * Get Payment Details
 */
async function getPaymentDetails(req, res) {
  try {
    const { paymentId } = req.params;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("paymentId", sql.Int, paymentId)
      .query(`
        SELECT p.*, o.OrderNumber, o.TotalAmount, o.OrderStatus
        FROM Payments p
        INNER JOIN Orders o ON p.OrderID = o.OrderID
        WHERE p.PaymentID = @paymentId
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "Payment not found." });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Get payment details error:", err.message);
    res.status(500).json({ message: "Failed to fetch payment details." });
  }
}

/**
 * Get Order Payments
 */
async function getOrderPayments(req, res) {
  try {
    const { orderId } = req.params;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT * FROM Payments WHERE OrderID = @orderId ORDER BY PaymentDate DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get order payments error:", err.message);
    res.status(500).json({ message: "Failed to fetch order payments." });
  }
}

/**
 * Refund Payment
 */
async function refundPayment(req, res) {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    // Fetch payment details
    const pool = await poolPromise;
    const paymentResult = await pool
      .request()
      .input("paymentId", sql.Int, paymentId)
      .query("SELECT * FROM Payments WHERE PaymentID = @paymentId");

    const payment = paymentResult.recordset[0];
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (payment.PaymentStatus !== "Completed") {
      return res.status(400).json({ message: "Only completed payments can be refunded." });
    }

    // Initiate refund via Razorpay
    const razorpayInstance = getRazorpayInstance();
    const refundAmount = amount ? amount * 100 : payment.Amount * 100;
    const refund = await razorpayInstance.payments.refund(payment.TransactionID, {
      amount: refundAmount,
      notes: { reason: reason || "Customer requested refund" },
    });

    // Update payment status
    await pool
      .request()
      .input("paymentId", sql.Int, paymentId)
      .input("paymentStatus", sql.NVarChar, "Refunded")
      .query(`
        UPDATE Payments 
        SET PaymentStatus = @paymentStatus, UpdatedDate = GETDATE()
        WHERE PaymentID = @paymentId
      `);

    res.json({
      message: "Refund initiated successfully.",
      refundId: refund.id,
      refundStatus: refund.status,
    });
  } catch (err) {
    console.error("Refund payment error:", err.message);
    res.status(500).json({ message: "Failed to process refund." });
  }
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handlePaymentFailure,
  getPaymentDetails,
  getOrderPayments,
  refundPayment,
};
