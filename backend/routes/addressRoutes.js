const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/users/:userId/addresses", authenticate, addressController.getUserAddresses);
router.post("/users/:userId/addresses", authenticate, addressController.createAddress);

module.exports = router;
