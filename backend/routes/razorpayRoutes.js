const express = require("express");
const router = express.Router();
const razorpayController = require("../controllers/razorpayController");
const { authenticate } = require("../middleware/authMiddleware");

// Create Razorpay Order
router.post("/create-order", authenticate, razorpayController.createRazorpayOrder);

// Verify Razorpay Payment
router.post("/verify", authenticate, razorpayController.verifyRazorpayPayment);

// Handle Payment Failure
router.post("/failure", authenticate, razorpayController.handlePaymentFailure);

// Get Payment Details
router.get("/payment/:paymentId", authenticate, razorpayController.getPaymentDetails);

// Get Order Payments
router.get("/order/:orderId/payments", authenticate, razorpayController.getOrderPayments);

// Refund Payment
router.post("/payment/:paymentId/refund", authenticate, razorpayController.refundPayment);

module.exports = router;