const express = require("express");
const razorpayController = require("../controllers/razorpayController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/payments/razorpay/create-order", authenticate, razorpayController.createRazorpayOrder);
router.post("/payments/razorpay/verify", authenticate, razorpayController.verifyRazorpayPayment);

module.exports = router;
