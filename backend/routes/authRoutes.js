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

router.get("/temp-restore-all-raveens", async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const User = require("../models/User");
    const Complaint = require("../models/Complaint");
    
    await Complaint.deleteMany({});
    
    const filePath = path.join(__dirname, "../scripts/temp_data/Complaints.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const sqlComplaints = JSON.parse(fileContent);
    
    const targetUsers = await User.find({ email: { $regex: /raveen/i }, role: "customer" });
    
    let createdCount = 0;
    for (const targetUser of targetUsers) {
      for (const c of sqlComplaints) {
        let mappedStatus = "pending";
        const statusStr = String(c.Status).toLowerCase();
        if (statusStr.includes("pending")) mappedStatus = "pending";
        else if (statusStr.includes("progress")) mappedStatus = "in_progress";
        else if (statusStr.includes("resolve")) mappedStatus = "resolved";
        else if (statusStr.includes("close")) mappedStatus = "closed";

        let mappedType = "General";
        const typeStr = String(c.ComplaintType || "").toLowerCase();
        if (typeStr.includes("product")) mappedType = "Product";
        else if (typeStr.includes("delivery")) mappedType = "Delivery";
        else if (typeStr.includes("payment")) mappedType = "Payment";
        else if (typeStr.includes("other")) mappedType = "Other";

        await Complaint.create({
          customerId: targetUser._id,
          shopId: "SHOP001",
          title: c.Subject || "General Complaint",
          description: c.Description || "",
          image: c.ImageUrl || null,
          status: mappedStatus,
          adminReply: c.AdminReply || null,
          customerVoiceUrl: c.CustomerVoiceUrl || null,
          voiceReplyUrl: c.VoiceReplyUrl || null,
          replyDate: c.ReplyDate ? new Date(c.ReplyDate) : null,
          complaintType: mappedType,
          orderId: null,
          createdAt: c.CreatedDate ? new Date(c.CreatedDate) : new Date(),
          updatedAt: c.ReplyDate ? new Date(c.ReplyDate) : new Date()
        });
        createdCount++;
      }
    }
    
    res.json({ message: `Success! Created ${createdCount} complaints.`, users: targetUsers.map(u => u.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
