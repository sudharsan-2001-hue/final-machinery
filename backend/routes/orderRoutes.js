const express = require("express");
const orderController = require("../controllers/orderController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/orders", authenticate, requireAdmin, orderController.getAllOrders);
router.get("/users/:userId/orders", authenticate, orderController.getUserOrders);
router.post("/orders", authenticate, orderController.createOrder);

module.exports = router;
