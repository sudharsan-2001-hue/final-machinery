const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/register-seller", authController.registerSeller);
router.post("/forgot-password", authController.forgotPassword);
router.post("/change-password", authenticate, authController.changePassword);
router.get("/profile", authenticate, authController.getProfile);

module.exports = router;
