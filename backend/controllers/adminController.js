const Complaint = require("../models/Complaint");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const fs = require("fs");
const path = require("path");
const https = require("https");

async function getMetrics(req, res) {
  try {
    const totalProducts = await Product.countDocuments({ status: { $ne: "inactive" } });
    const totalOrders = await Order.countDocuments();
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const stockResult = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$stock" } } }
    ]);
    const totalStock = stockResult[0]?.total || 0;

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      totalStock,
    });
  } catch (err) {
    console.error("Metrics error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard metrics." });
  }
}

async function getShopMetrics(req, res) {
  try {
    const shopId = req.params.shopId || req.user.shopId;

    if (!shopId) {
      return res.status(400).json({ message: "Shop ID is required." });
    }

    const totalProducts = await Product.countDocuments({ shopId, status: { $ne: "inactive" } });
    const totalOrders = await Order.countDocuments({ shopId });
    const revenueResult = await Order.aggregate([
      { $match: { shopId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const stockResult = await Product.aggregate([
      { $match: { shopId } },
      { $group: { _id: null, total: { $sum: "$stock" } } }
    ]);
    const totalStock = stockResult[0]?.total || 0;

    // Get transactions count
    const transactions = await Order.countDocuments({ shopId, paymentStatus: 'paid' });

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      totalStock,
      transactions
    });
  } catch (err) {
    console.error("Shop metrics error:", err.message);
    res.status(500).json({ message: "Failed to fetch shop dashboard metrics." });
  }
}

async function createNotification(req, res) {
  const { email, productId } = req.body;

  if (!email || !productId) {
    return res.status(400).json({ message: "Email and product ID are required." });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await Notification.create({
      userId: user._id,
      title: "Product Available",
      message: `The product ${product.productName} is now available.`,
      type: "product",
      isRead: false
    });

    res.json({ message: "Notification saved successfully." });
  } catch (err) {
    console.error("Notification error:", err.message);
    res.status(500).json({ message: "Failed to save notification." });
  }
}

function mapComplaint(c) {
  if (!c) return null;
  return {
    ComplaintID: c._id.toString(),
    CustomerID: c.customerId?._id || c.customerId,
    CustomerName: c.customerId?.name || "Customer",
    Username: c.customerId?.name || "Customer",
    Mobile: c.customerId?.mobile || "N/A",
    Subject: c.title,
    Description: c.description,
    Image: c.image,
    Status: c.status,
    AdminReply: c.adminReply,
    CustomerVoiceUrl: c.customerVoiceUrl,
    VoiceReplyUrl: c.voiceReplyUrl,
    ReplyDate: c.replyDate,
    ComplaintType: c.complaintType,
    OrderID: c.orderId?.orderNumber || (c.orderId ? c.orderId.toString() : null),
    CreatedDate: c.createdAt,
    UpdatedDate: c.updatedAt
  };
}

async function createComplaint(req, res) {
  const { subject, description, orderId, complaintType, imageUrl, language, customerVoiceUrl } = req.body;
  const userId = req.user.id;
  const userName = req.user.fullName || req.user.name || "Customer";

  if (!subject || !description) {
    return res.status(400).json({ message: "Subject and description are required." });
  }

  try {
    let finalOrderId = null;
    let finalShopId = "SHOP001";

    if (orderId && orderId.trim()) {
      const trimmedOrderId = orderId.trim();
      const order = await Order.findOne({ orderNumber: trimmedOrderId });
      if (order) {
        finalOrderId = order._id;
        finalShopId = order.shopId;
      } else {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(trimmedOrderId)) {
          finalOrderId = trimmedOrderId;
        } else {
          return res.status(400).json({ message: `Invalid Order Number/ID "${orderId}". Please verify the order number and try again.` });
        }
      }
    }

    const complaint = await Complaint.create({
      customerId: userId,
      shopId: finalShopId,
      title: subject,
      description: description,
      image: imageUrl || null,
      status: "pending",
      complaintType: complaintType || 'General',
      orderId: finalOrderId,
      customerVoiceUrl: customerVoiceUrl || null
    });

    // Create notification for admin
    await Notification.create({
      title: `New Complaint from ${userName}`,
      message: `${subject}: ${description}`,
      type: "complaint",
      isRead: false,
      link: "/complaints"
    });

    res.json({ 
      message: "Complaint submitted successfully.",
      complaintId: complaint._id
    });
  } catch (err) {
    console.error("Complaint error:", err.message);
    res.status(500).json({ message: "Failed to submit complaint." });
  }
}

async function uploadCustomerVoice(req, res) {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: "Audio file is required." });
    }

    const audioFile = req.files.audio;
    const base64Data = audioFile.data.toString('base64');
    const mimeType = audioFile.mimetype || 'audio/webm';
    const voiceUrl = `data:${mimeType};base64,${base64Data}`;

    res.json({ 
      message: "Customer voice uploaded successfully.",
      voiceUrl: voiceUrl
    });
  } catch (err) {
    console.error("Upload customer voice error:", err.message);
    res.status(500).json({ message: "Failed to upload customer voice." });
  }
}

async function getComplaintById(req, res) {
  const { id } = req.params;

  try {
    const complaint = await Complaint.findById(id)
      .populate('customerId', 'name email mobile')
      .populate('orderId', 'orderNumber');

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    res.json(mapComplaint(complaint));
  } catch (err) {
    console.error("Get complaint error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaint." });
  }
}

async function getAllComplaints(req, res) {
  try {
    const complaints = await Complaint.find()
      .populate('customerId', 'name email mobile')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    res.json(complaints.map(mapComplaint));
  } catch (err) {
    console.error("Get complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaints." });
  }
}

async function getMyComplaints(req, res) {
  try {
    const user = req.user;
    const complaints = await Complaint.find({ customerId: user.id })
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    res.json(complaints.map(mapComplaint));
  } catch (err) {
    console.error("Get my complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaints." });
  }
}

async function getShopComplaints(req, res) {
  try {
    const shopId = req.params.shopId || req.user.shopId;

    if (!shopId) {
      return res.status(400).json({ message: "Shop ID is required." });
    }

    const complaints = await Complaint.find({ shopId })
      .populate('customerId', 'name email mobile')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    res.json(complaints.map(mapComplaint));
  } catch (err) {
    console.error("Get shop complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch shop complaints." });
  }
}

async function uploadVoiceReply(req, res) {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: "Audio file is required." });
    }

    const audioFile = req.files.audio;
    const complaintId = req.body.complaintId;

    const base64Data = audioFile.data.toString('base64');
    const mimeType = audioFile.mimetype || 'audio/webm';
    const voiceUrl = `data:${mimeType};base64,${base64Data}`;

    try {
      // Update complaint with voice URL
      await Complaint.findByIdAndUpdate(complaintId, { voiceReplyUrl: voiceUrl });
      console.log("Voice URL updated in database as base64");
      
      res.json({ 
        message: "Voice reply uploaded successfully.",
        voiceUrl: voiceUrl
      });
    } catch (dbErr) {
      console.error("Error updating complaint:", dbErr);
      res.status(500).json({ message: "Failed to update complaint with voice URL." });
    }
  } catch (err) {
    console.error("Upload voice reply error:", err.message);
    res.status(500).json({ message: "Failed to upload voice reply." });
  }
}

async function updateComplaintReply(req, res) {
  const { id } = req.params;
  const { adminReply } = req.body;

  if (!adminReply) {
    return res.status(400).json({ message: "Admin reply is required." });
  }

  try {
    console.log("Saving admin reply for complaint:", id);
    console.log("Admin reply text:", adminReply);
    
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        adminReply: adminReply,
        replyDate: new Date(),
        status: 'resolved'
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    console.log("Admin reply saved successfully");
    res.json({ message: "Reply saved successfully." });
  } catch (err) {
    console.error("Update complaint error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Failed to save reply: " + err.message });
  }
}

async function generateVoiceForComplaint(req, res) {
  try {
    const { id } = req.params;
    const { text, language = "english" } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required for voice generation." });
    }

    console.log("AI Voice Generation - Complaint ID:", id);
    console.log("AI Voice Generation - Text:", text);
    console.log("AI Voice Generation - Language:", language);

    // Generate audio file using Google Translate TTS API directly
    const voiceDir = path.join(__dirname, "../uploads/voice-replies");
    if (!fs.existsSync(voiceDir)) {
      fs.mkdirSync(voiceDir, { recursive: true });
    }

    const fileName = `voice-reply-${id}-${Date.now()}.mp3`;
    const filePath = path.join(voiceDir, fileName);
    const voiceUrl = `/uploads/voice-replies/${fileName}`;

    // Use Google Translate TTS API directly (no gtts dependency)
    let voiceGenerated = false;
    let finalVoiceUrl = null;
    try {
      const langCode = language === 'tamil' ? 'ta' : 'en';
      const encodedText = encodeURIComponent(text);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(ttsUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              voiceGenerated = true;
              resolve();
            });
          } else {
            file.close();
            fs.unlinkSync(filePath);
            reject(new Error(`TTS API returned status ${response.statusCode}`));
          }
        }).on('error', (err) => {
          file.close();
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(err);
        });
      });

      if (voiceGenerated && fs.existsSync(filePath)) {
        const audioData = fs.readFileSync(filePath).toString('base64');
        finalVoiceUrl = `data:audio/mp3;base64,${audioData}`;
        fs.unlinkSync(filePath); // Clean up the file immediately
        console.log("Voice generated and converted to base64 successfully");
      }
    } catch (voiceErr) {
      console.error("Voice generation failed:", voiceErr.message);
      // Fallback: save text reply without voice
      console.log("Falling back to text-only reply");
    }

    // Update complaint with admin reply and voice URL (if generated)
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        adminReply: text,
        voiceReplyUrl: finalVoiceUrl,
        replyDate: new Date(),
        status: 'resolved'
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    console.log("Admin reply saved successfully");

    res.json({
      message: complaint.voiceReplyUrl ? "Reply saved successfully with AI voice." : "Reply saved successfully. Voice generation skipped.",
      success: true,
      voiceReplyUrl: complaint.voiceReplyUrl
    });
  } catch (err) {
    console.error("Generate voice error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Failed to save reply: " + err.message });
  }
}

async function createContactMessage(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }

  try {
    await Notification.create({
      title: `Contact from ${name}`,
      message: `${email}: ${message}`,
      type: "system",
      isRead: false
    });

    res.status(201).json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("Contact message error:", err.message);
    res.status(500).json({ message: "Failed to send message." });
  }
}

async function getContactMessages(req, res) {
  try {
    console.log("Fetching contact messages...");
    const messages = await Notification.find({ type: { $in: ["system", "complaint"] } })
      .sort({ createdAt: -1 });

    console.log("Found messages:", messages.length);

    const formattedMessages = messages.map(m => {
      let emailVal = "";
      let nameVal = "";
      let msgVal = m.message;
      
      if (m.type === 'complaint') {
        nameVal = m.title.replace('New Complaint from ', '');
        emailVal = 'Customer Complaint';
      } else {
        nameVal = m.title.replace('Contact from ', '');
        const parts = m.message.split(':');
        emailVal = parts[0] || '';
        msgVal = parts.slice(1).join(':').trim() || m.message;
      }
      
      return {
        MessageID: m._id.toString(),
        CustomerName: nameVal,
        CustomerEmail: emailVal,
        Message: msgVal,
        CreatedDate: m.createdAt,
        IsRead: m.isRead,
        Type: m.type,
        Link: m.link
      };
    });

    res.json(formattedMessages);
  } catch (err) {
    console.error("Get contact messages error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
}

async function markMessageAsRead(req, res) {
  const { messageId } = req.params;

  try {
    await Notification.findByIdAndUpdate(messageId, { isRead: true });

    res.json({ message: "Message marked as read." });
  } catch (err) {
    console.error("Mark message read error:", err.message);
    res.status(500).json({ message: "Failed to mark message as read." });
  }
}

module.exports = {
  getMetrics,
  getShopMetrics,
  createNotification,
  createComplaint,
  getComplaintById,
  getAllComplaints,
  getMyComplaints,
  getShopComplaints,
  uploadCustomerVoice,
  uploadVoiceReply,
  updateComplaintReply,
  generateVoiceForComplaint,
  createContactMessage,
  getContactMessages,
  markMessageAsRead
};
