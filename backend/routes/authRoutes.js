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

router.get("/temp-list-all", async (req, res) => {
  try {
    const User = require("../models/User");
    const Complaint = require("../models/Complaint");
    const users = await User.find({});
    const complaints = await Complaint.find({});
    
    res.json({
      users: users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })),
      complaints: complaints.map(c => ({
        id: c._id,
        customerId: c.customerId,
        title: c.title,
        status: c.status,
        voiceUrl: c.customerVoiceUrl,
        voiceReplyUrl: c.voiceReplyUrl,
        adminReply: c.adminReply
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
