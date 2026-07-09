const crypto = require("crypto");
const Razorpay = require("razorpay");
const { sql, poolPromise } = require("../db");
const { createOrderRecord } = require("./orderController");

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function createRazorpayOrder(req, res) {
  const { amount, currency = "INR" } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Valid amount is required." });
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    return res.status(503).json({
      message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env",
    });
  }

  try {
    const amountPaise = Math.round(Number(amount) * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: `scm_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay create order error:", err.message);
    res.status(500).json({ message: "Failed to create Razorpay order." });
  }
}

async function verifyRazorpayPayment(req, res) {
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
    return res.status(400).json({ message: "Payment verification data is incomplete." });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({ message: "Razorpay is not configured on the server." });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment signature verification failed." });
  }

  try {
    const orderResult = await createOrderRecord({
      userId: userId || req.user?.id,
      addressId,
      totalAmount,
      paymentMethod: "Razorpay Online",
      item,
      paymentDetails: {
        paymentStatus: "Completed",
        orderStatus: "Processing",
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        currency: "INR",
      },
    });

    res.status(201).json(orderResult);
  } catch (err) {
    console.error("Verify payment error:", err.message);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Failed to complete order after payment." });
  }
}

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
