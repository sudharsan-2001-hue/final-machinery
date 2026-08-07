const Order = require("../models/Order");
const User = require("../models/User");

/**
 * Generate Invoice for an Order
 */
async function generateInvoice(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const order = await Order.findOne({ orderNumber: orderId, customerId: userId })
      .populate('customerId', 'name email mobile')
      .populate('products.productId', 'productName image');

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(201).json({
      invoice: order,
      items: order.products,
    });
  } catch (err) {
    console.error("Generate invoice error:", err.message);
    res.status(500).json({ message: "Failed to generate invoice." });
  }
}

/**
 * Get Invoice by ID
 */
async function getInvoice(req, res) {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;

    // Fetch order as invoice
    const order = await Order.findOne({ orderNumber: invoiceId, customerId: userId })
      .populate('customerId', 'name email mobile')
      .populate('products.productId', 'productName image');

    if (!order) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    res.json({
      invoice: order,
      items: order.products,
    });
  } catch (err) {
    console.error("Get invoice error:", err.message);
    res.status(500).json({ message: "Failed to fetch invoice." });
  }
}

/**
 * Get User Invoices
 */
async function getUserInvoices(req, res) {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ customerId: userId })
      .sort({ orderedAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Get user invoices error:", err.message);
    res.status(500).json({ message: "Failed to fetch invoices." });
  }
}

/**
 * Update Invoice Status
 */
async function updateInvoiceStatus(req, res) {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber: invoiceId },
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({ message: "Order status updated successfully." });
  } catch (err) {
    console.error("Update invoice status error:", err.message);
    res.status(500).json({ message: "Failed to update order status." });
  }
}

/**
 * Delete Invoice
 */
async function deleteInvoice(req, res) {
  try {
    const { invoiceId } = req.params;

    const order = await Order.findOneAndDelete({ orderNumber: invoiceId });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({ message: "Order deleted successfully." });
  } catch (err) {
    console.error("Delete invoice error:", err.message);
    res.status(500).json({ message: "Failed to delete order." });
  }
}

module.exports = {
  generateInvoice,
  getInvoice,
  getUserInvoices,
  updateInvoiceStatus,
  deleteInvoice,
};
