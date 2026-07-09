const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { authenticate } = require("../middleware/authMiddleware");

// Generate Invoice for Order
router.post("/order/:orderId/invoice", authenticate, invoiceController.generateInvoice);

// Get Invoice by ID
router.get("/invoice/:invoiceId", authenticate, invoiceController.getInvoice);

// Get User Invoices
router.get("/invoices", authenticate, invoiceController.getUserInvoices);

// Update Invoice Status
router.put("/invoice/:invoiceId/status", authenticate, invoiceController.updateInvoiceStatus);

// Delete Invoice
router.delete("/invoice/:invoiceId", authenticate, invoiceController.deleteInvoice);

module.exports = router;
