const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/admin/metrics", authenticate, requireAdmin, adminController.getMetrics);
router.get("/shop/:shopId/metrics", authenticate, adminController.getShopMetrics);
router.post("/notifications", authenticate, adminController.createNotification);
router.post("/complaints", authenticate, adminController.createComplaint);
router.get("/complaints/:id", authenticate, adminController.getComplaintById);
router.get("/complaints", authenticate, requireAdmin, adminController.getAllComplaints);
router.get("/my-complaints", authenticate, adminController.getMyComplaints);
router.get("/shop/:shopId/complaints", authenticate, adminController.getShopComplaints);
router.post("/upload-customer-voice", authenticate, adminController.uploadCustomerVoice);
router.post("/upload-voice-reply", authenticate, requireAdmin, adminController.uploadVoiceReply);
router.put("/complaints/:id/reply", authenticate, requireAdmin, adminController.updateComplaintReply);
router.post("/complaints/:id/generate-voice", authenticate, requireAdmin, adminController.generateVoiceForComplaint);
router.post("/contact-messages", authenticate, adminController.createContactMessage);
router.get("/contact-messages", authenticate, requireAdmin, adminController.getContactMessages);
router.put("/contact-messages/:messageId/read", authenticate, requireAdmin, adminController.markMessageAsRead);

module.exports = router;
