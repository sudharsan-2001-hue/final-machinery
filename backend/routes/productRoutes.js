const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", authenticate, productController.createProduct);
router.put("/:id", authenticate, requireAdmin, productController.updateProduct);
router.delete("/:id", authenticate, requireAdmin, productController.deleteProduct);
router.put("/:id/stock", authenticate, requireAdmin, productController.updateStock);

module.exports = router;
