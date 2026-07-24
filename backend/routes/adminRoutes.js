const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/admin/metrics", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    const products = await pool.request().query("SELECT COUNT(*) AS cnt FROM MachineryProducts");
    const orders = await pool.request().query("SELECT COUNT(*) AS cnt FROM Orders");
    const revenue = await pool.request().query(`
      SELECT ISNULL(SUM(TotalAmount), 0) AS total FROM Orders
    `);
    const stock = await pool.request().query(`
      SELECT ISNULL(SUM(StockQuantity), 0) AS total FROM MachineryProducts
    `);

    res.json({
      totalProducts: products.recordset[0].cnt,
      totalOrders: orders.recordset[0].cnt,
      totalRevenue: Number(revenue.recordset[0].total),
      totalStock: stock.recordset[0].total,
    });
  } catch (err) {
    console.error("Metrics error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard metrics." });
  }
});

router.post("/notifications", authenticate, async (req, res) => {
  const { email, productId } = req.body;

  if (!email || !productId) {
    return res.status(400).json({ message: "Email and product ID are required." });
  }

  try {
    const pool = await poolPromise;

    const product = await pool
      .request()
      .input("productId", sql.Int, productId)
      .query("SELECT MachineName FROM MachineryProducts WHERE ProductID = @productId");

    if (!product.recordset[0]) {
      return res.status(404).json({ message: "Product not found." });
    }

    await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("productId", sql.Int, productId)
      .query(`
        INSERT INTO Notifications (Email, ProductID, CreatedDate)
        VALUES (@email, @productId, GETDATE())
      `);

    res.json({ message: "Notification saved successfully." });
  } catch (err) {
    console.error("Notification error:", err.message);
    res.status(500).json({ message: "Failed to save notification." });
  }
});

router.post("/complaints", authenticate, async (req, res) => {
  const { subject, description, orderId, complaintType, imageUrl, language } = req.body;
  const userId = req.user.id;
  const userName = req.user.username;
  const userPhone = req.user.phoneNumber;

  if (!subject || !description) {
    return res.status(400).json({ message: "Subject and description are required." });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("customerId", sql.Int, userId)
      .input("customerName", sql.NVarChar, userName)
      .input("mobile", sql.NVarChar, userPhone)
      .input("orderId", sql.NVarChar, orderId || null)
      .input("complaintType", sql.NVarChar, complaintType || 'General')
      .input("subject", sql.NVarChar, subject)
      .input("description", sql.NVarChar, description)
      .input("imageUrl", sql.NVarChar, imageUrl || null)
      .query(`
        INSERT INTO Complaints (CustomerID, CustomerName, Mobile, OrderID, ComplaintType, Subject, Description, ImageUrl, Status, CreatedDate)
        VALUES (@customerId, @customerName, @mobile, @orderId, @complaintType, @subject, @description, @imageUrl, 'Pending', GETDATE())
        SELECT SCOPE_IDENTITY() AS ComplaintID
      `);

    const complaintId = result.recordset[0].ComplaintID;

    // Generate voice for customer complaint
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, '../uploads/customer-voices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `customer_complaint_${complaintId}_${Date.now()}.mp3`;
    const filePath = path.join(uploadsDir, filename);
    const voiceUrl = `/uploads/customer-voices/${filename}`;

    // Determine language code
    const langCode = language === 'english' ? 'en-US' : 'ta-IN';

    // TODO: Integrate with actual TTS service
    // Example with Azure AI Speech:
    // const speechConfig = speechsdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
    // speechConfig.speechSynthesisLanguage = langCode;
    // const audioConfig = speechsdk.AudioConfig.fromAudioFileOutput(filePath);
    // const synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);
    // await synthesizer.speakTextAsync(`${subject}. ${description}`);

    // For now, create a placeholder file
    fs.writeFileSync(filePath, Buffer.from('placeholder'));

    // Update complaint with customer voice URL
    await pool
      .request()
      .input("id", sql.Int, complaintId)
      .input("customerVoiceUrl", sql.NVarChar, voiceUrl)
      .query(`
        UPDATE Complaints
        SET CustomerVoiceUrl = @customerVoiceUrl
        WHERE ComplaintID = @id
      `);

    res.json({ 
      message: "Complaint submitted successfully.",
      complaintId: complaintId
    });
  } catch (err) {
    console.error("Complaint error:", err.message);
    res.status(500).json({ message: "Failed to submit complaint." });
  }
});

// Get complaint by ID
router.get("/complaints/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT * 
        FROM Complaints
        WHERE ComplaintID = @id
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Get complaint error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaint." });
  }
});

// Get all complaints (for admin)
router.get("/complaints", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * 
      FROM Complaints
      ORDER BY CreatedDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaints." });
  }
});

// Get customer complaints (for customers)
router.get("/my-complaints", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("customerId", sql.Int, user.id)
      .query(`
        SELECT * 
        FROM Complaints
        WHERE CustomerID = @customerId
        ORDER BY CreatedDate DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get my complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaints." });
  }
});

// Upload voice reply for complaint
router.post("/upload-voice-reply", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const fs = require('fs');
    const path = require('path');
    
    console.log("Upload voice reply request received");
    console.log("Files:", req.files);
    console.log("Body:", req.body);
    
    if (!req.files || !req.files.audio) {
      console.log("No audio file in request");
      return res.status(400).json({ message: "Audio file is required." });
    }

    const audioFile = req.files.audio;
    const complaintId = req.body.complaintId;

    const uploadsDir = path.join(__dirname, '../uploads/voice-replies');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Created voice-replies directory");
    }

    const filename = `complaint_${complaintId}_${Date.now()}.webm`;
    const filePath = path.join(uploadsDir, filename);
    const voiceUrl = `/uploads/voice-replies/${filename}`;

    console.log("Saving audio file to:", filePath);
    console.log("Voice URL:", voiceUrl);

    audioFile.mv(filePath, (err) => {
      if (err) {
        console.error("Error saving audio file:", err);
        return res.status(500).json({ message: "Failed to save audio file." });
      }

      console.log("Audio file saved successfully");

      // Update complaint with voice URL
      pool.request()
        .input("id", sql.Int, complaintId)
        .input("voiceReplyUrl", sql.NVarChar, voiceUrl)
        .query(`
          UPDATE Complaints
          SET VoiceReplyUrl = @voiceReplyUrl
          WHERE ComplaintID = @id
        `)
        .then(() => {
          console.log("Voice URL updated in database:", voiceUrl);
          res.json({ 
            message: "Voice reply uploaded successfully.",
            voiceUrl: voiceUrl
          });
        })
        .catch((dbErr) => {
          console.error("Error updating complaint:", dbErr);
          res.status(500).json({ message: "Failed to update complaint with voice URL." });
        });
    });
  } catch (err) {
    console.error("Upload voice reply error:", err.message);
    res.status(500).json({ message: "Failed to upload voice reply." });
  }
});

// Update complaint with admin reply
router.put("/complaints/:id/reply", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { adminReply } = req.body;

  if (!adminReply) {
    return res.status(400).json({ message: "Admin reply is required." });
  }

  try {
    console.log("Saving admin reply for complaint:", id);
    console.log("Admin reply text:", adminReply);
    
    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("adminReply", sql.NVarChar, adminReply)
      .input("replyDate", sql.DateTime, new Date())
      .query(`
        UPDATE Complaints
        SET AdminReply = @adminReply,
            ReplyDate = @replyDate,
            Status = 'Resolved'
        WHERE ComplaintID = @id
      `);

    console.log("Admin reply saved successfully");
    res.json({ message: "Reply saved successfully." });
  } catch (err) {
    console.error("Update complaint error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Failed to save reply: " + err.message });
  }
});

// Generate voice for complaint reply
router.post("/complaints/:id/generate-voice", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { text, language } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text is required for voice generation." });
  }

  try {
    console.log("AI Voice Generation - Complaint ID:", id);
    console.log("AI Voice Generation - Text:", text);
    console.log("AI Voice Generation - Language:", language);

    // For AI voice conversion, we'll use the text directly
    // The frontend will use Web Speech API to play the voice
    // This is more reliable than server-side TTS
    
    // Update complaint with voice text (will be used by frontend TTS)
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("adminReply", sql.NVarChar, text)
      .input("replyDate", sql.DateTime, new Date())
      .query(`
        UPDATE Complaints
        SET AdminReply = @adminReply,
            ReplyDate = @replyDate,
            Status = 'Resolved'
        WHERE ComplaintID = @id
      `);

    console.log("Admin reply saved successfully for AI voice generation");

    res.json({ 
      message: "Reply saved successfully. Voice will be generated on customer side.",
      success: true
    });
  } catch (err) {
    console.error("Generate voice error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Failed to save reply: " + err.message });
  }
});

// Customer contact messages endpoint
router.post("/contact-messages", authenticate, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }

  try {
    const pool = await poolPromise;

    // Check if CustomerMessages table exists, if not create it
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CustomerMessages'
    `);

    if (tableCheck.recordset.length === 0) {
      await pool.request().query(`
        CREATE TABLE CustomerMessages (
          MessageID INT IDENTITY(1,1) PRIMARY KEY,
          CustomerName NVARCHAR(100) NOT NULL,
          CustomerEmail NVARCHAR(100) NOT NULL,
          Message NVARCHAR(MAX) NOT NULL,
          CreatedDate DATETIME DEFAULT GETDATE(),
          IsRead BIT DEFAULT 0
        )
      `);
    }

    await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("email", sql.NVarChar, email.trim())
      .input("message", sql.NVarChar, message.trim())
      .query(`
        INSERT INTO CustomerMessages (CustomerName, CustomerEmail, Message, CreatedDate, IsRead)
        VALUES (@name, @email, @message, GETDATE(), 0)
      `);

    res.status(201).json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("Contact message error:", err.message);
    res.status(500).json({ message: "Failed to send message." });
  }
});

// Get all customer messages for admin
router.get("/contact-messages", authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CustomerMessages'
    `);

    if (tableCheck.recordset.length === 0) {
      return res.json([]);
    }

    const messages = await pool.request().query(`
      SELECT MessageID, CustomerName, CustomerEmail, Message, CreatedDate, IsRead
      FROM CustomerMessages
      ORDER BY CreatedDate DESC
    `);

    res.json(messages.recordset);
  } catch (err) {
    console.error("Get contact messages error:", err.message);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
});

// Mark message as read
router.put("/contact-messages/:messageId/read", authenticate, requireAdmin, async (req, res) => {
  const { messageId } = req.params;

  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("messageId", sql.Int, parseInt(messageId))
      .query(`
        UPDATE CustomerMessages
        SET IsRead = 1
        WHERE MessageID = @messageId
      `);

    res.json({ message: "Message marked as read." });
  } catch (err) {
    console.error("Mark message read error:", err.message);
    res.status(500).json({ message: "Failed to mark message as read." });
  }
});

module.exports = router;
