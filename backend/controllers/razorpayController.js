const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createOrderRecord } = require("./orderController");

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

    // Create order using the existing order creation function
    const orderResult = await createOrderRecord({
      userId: userId || req.user?.id,
      addressId,
      totalAmount,
      paymentMethod: "Razorpay Online",
      item,
      paymentDetails: {
        paymentStatus: "paid",
        orderStatus: "preparing",
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    res.json({
      message: "Payment verified successfully.",
      paymentStatus: "Completed",
      order: orderResult,
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

    const Order = require("../models/Order");
    const Payment = require("../models/Payment");

    // Find order by order number
    const order = await Order.findOne({ orderNumber: order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Store failed payment
    await Payment.create({
      orderId: order._id,
      customerId: order.customerId,
      shopId: order.shopId,
      amount: Number(amount),
      paymentMethod: "razorpay",
      paymentStatus: "failed",
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    // Update order payment status
    await Order.findByIdAndUpdate(order._id, { orderStatus: "cancelled" });

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

    const Payment = require("../models/Payment");
    const Order = require("../models/Order");

    const payment = await Payment.findById(paymentId)
      .populate('orderId', 'orderNumber totalAmount orderStatus');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    res.json(payment);
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

    const Payment = require("../models/Payment");
    const Order = require("../models/Order");

    // Find order by order number first
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.json([]);
    }

    const payments = await Payment.find({ orderId: order._id })
      .sort({ createdAt: -1 });

    res.json(payments);
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

    const Payment = require("../models/Payment");

    // Fetch payment details
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (payment.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only completed payments can be refunded." });
    }

    // Initiate refund via Razorpay
    const razorpayInstance = getRazorpayInstance();
    const refundAmount = amount ? amount * 100 : payment.amount * 100;
    const refund = await razorpayInstance.payments.refund(payment.transactionId, {
      amount: refundAmount,
      notes: { reason: reason || "Customer requested refund" },
    });

    // Update payment status
    await Payment.findByIdAndUpdate(paymentId, { paymentStatus: "refunded" });

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
