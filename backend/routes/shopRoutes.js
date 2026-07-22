const express = require("express");
const shopController = require("../controllers/shopController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes - customers can view shops
router.get("/", shopController.getAllShops);
router.get("/:id", shopController.getShopById);

// Admin only routes
router.post("/", authenticate, requireAdmin, shopController.createShop);
router.put("/:id", authenticate, requireAdmin, shopController.updateShop);
router.delete("/:id", authenticate, requireAdmin, shopController.deleteShop);

module.exports = router;
