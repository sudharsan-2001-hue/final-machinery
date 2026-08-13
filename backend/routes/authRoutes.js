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

router.get("/temp-clone-complaints", async (req, res) => {
  try {
    const User = require("../models/User");
    const Complaint = require("../models/Complaint");
    
    const allComplaints = await Complaint.find({});
    const emails = ["raveen2001@gmail.com", "raveen2002@gmail.com", "raveen2003@gmail.com"];
    const targetUsers = await User.find({ email: { $in: emails } });
    
    let clonedCount = 0;
    for (const targetUser of targetUsers) {
      const existingUserComplaints = await Complaint.find({ customerId: targetUser._id });
      const existingTitles = existingUserComplaints.map(c => c.title);
      
      for (const comp of allComplaints) {
        if (comp.customerId.toString() !== targetUser._id.toString() && !existingTitles.includes(comp.title)) {
          await Complaint.create({
            customerId: targetUser._id,
            shopId: comp.shopId || "SHOP001",
            title: comp.title,
            description: comp.description,
            image: comp.image,
            status: comp.status,
            adminReply: comp.adminReply,
            customerVoiceUrl: comp.customerVoiceUrl,
            voiceReplyUrl: comp.voiceReplyUrl,
            replyDate: comp.replyDate,
            complaintType: comp.complaintType || "General",
            orderId: comp.orderId
          });
          clonedCount++;
        }
      }
    }
    
    res.json({ message: `Success! Cloned ${clonedCount} complaints.`, users: targetUsers.map(u => u.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
