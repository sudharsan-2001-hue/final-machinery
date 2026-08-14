const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const Stock = require("../models/Stock");
const Address = require("../models/Address");

function generateOrderNumber() {
  return `ORD${Date.now()}`;
}

function isCodPayment(method) {
  const m = (method || "").toLowerCase();
  return m.includes("cash") || m.includes("cod");
}

async function createOrderRecord(orderData) {
  const {
    userId,
    addressId,
    totalAmount,
    paymentMethod,
    item,
    shopId,
    paymentDetails = {},
  } = orderData;

  console.log("Order data received:", JSON.stringify({ userId, addressId, totalAmount, paymentMethod, item }, null, 2));

  if (!userId) {
    const err = new Error("User ID is required.");
    err.status = 400;
    throw err;
  }
  if (!addressId) {
    const err = new Error("Address ID is required.");
    err.status = 400;
    throw err;
  }
  if (!totalAmount) {
    const err = new Error("Total amount is required.");
    err.status = 400;
    throw err;
  }
  if (!paymentMethod) {
    const err = new Error("Payment method is required.");
    err.status = 400;
    throw err;
  }

  // Check for product ID with multiple possible field names
  const productId = item?.id || item?.productId || item?._id;
  if (!productId) {
    console.error("Item object:", item);
    const err = new Error("Product ID is required. Item received: " + JSON.stringify(item));
    err.status = 400;
    throw err;
  }

  // Update item with the found product ID
  item.id = productId;

  const session = await Order.startSession();
  session.startTransaction();

  try {
    const cod = isCodPayment(paymentMethod);
    const normalizedPaymentMethod = cod ? "cod" : (paymentMethod.toLowerCase().includes("razorpay") ? "razorpay" : paymentMethod.toLowerCase());
    const orderStatus = paymentDetails.orderStatus || (cod ? "pending" : "preparing");
    const paymentStatus = paymentDetails.paymentStatus || (cod ? "pending" : "paid");

    const product = await Product.findById(item.id).session(session);
    if (!product) {
      await session.abortTransaction();
      const err = new Error("Product not found.");
      err.status = 404;
      throw err;
    }

    const qty = Number(item.quantity) || 1;
    if (product.stock < qty) {
      await session.abortTransaction();
      const err = new Error("Insufficient stock for this order.");
      err.status = 400;
      throw err;
    }

    const orderNumber = generateOrderNumber();
    const unitPrice = Number(item.price || item.offerPrice || product.price);
    const finalShopId = shopId || product.shopId || "SHOP001";

    const address = await Address.findById(addressId).session(session);
    if (!address) {
      await session.abortTransaction();
      const err = new Error("Address not found.");
      err.status = 404;
      throw err;
    }

    const order = await Order.create([{
      orderNumber,
      customerId: userId,
      shopId: finalShopId,
      products: [{
        productId: item.id,
        quantity: qty,
        price: unitPrice
      }],
      subtotal: unitPrice * qty,
      discount: 0,
      deliveryCharge: 1500,
      totalAmount: Number(totalAmount),
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus,
      transactionId: paymentDetails.transactionId || paymentDetails.razorpayPaymentId || `PAY${Date.now()}`,
      orderStatus: orderStatus,
      deliveryAddress: address.toObject()
    }], { session });

    const createdOrder = order[0];

    await Payment.create([{
      orderId: createdOrder._id,
      customerId: userId,
      shopId: finalShopId,
      amount: Number(totalAmount),
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus,
      transactionId: paymentDetails.transactionId || paymentDetails.razorpayPaymentId || `PAY${Date.now()}`,
      razorpayOrderId: paymentDetails.razorpayOrderId || null,
      razorpayPaymentId: paymentDetails.razorpayPaymentId || null
    }], { session });

    const newStock = product.stock - qty;
    const newStatus = newStock > 0 ? "active" : "out_of_stock";

    await Product.findByIdAndUpdate(item.id, {
      stock: newStock,
      status: newStatus
    }, { session });

    await Stock.findOneAndUpdate(
      { productId: item.id },
      {
        availableStock: newStock,
        updatedBy: userId.toString()
      },
      { session }
    );

    await session.commitTransaction();

    const fullOrder = await Order.findById(createdOrder._id)
      .populate('customerId', 'name email mobile')
      .populate('products.productId', 'productName image');

    return {
      orderId: fullOrder.orderNumber,
      orderNumber: fullOrder.orderNumber,
      totalAmount: fullOrder.totalAmount,
      paymentMethod: fullOrder.paymentMethod,
      orderDate: fullOrder.orderedAt,
      orderStatus: fullOrder.orderStatus,
      products: fullOrder.products.map(p => ({
        productId: p.productId._id,
        productName: p.productId.productName,
        quantity: p.quantity,
        price: p.price,
        image: p.productId.image
      })),
      deliveryAddress: fullOrder.deliveryAddress
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function getAllOrders(req, res) {
  try {
    let query = {};
    
    // If user is shop admin, filter by their shopId
    if (req.user.role === 'shopadmin' || req.user.role === 'seller') {
      if (!req.user.shopId) {
        return res.status(400).json({ message: "Shop ID is required for shop admin." });
      }
      query.shopId = req.user.shopId;
    }
    
    const orders = await Order.find(query)
      .populate('customerId', 'name email mobile')
      .populate('products.productId', 'productName image')
      .sort({ orderedAt: -1 });

    const formatted = orders.map(order => ({
      orderId: order.orderNumber,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      orderDate: order.orderedAt,
      orderStatus: order.orderStatus,
      shopId: order.shopId,
      customer: {
        name: order.customerId?.name,
        email: order.customerId?.email,
        mobile: order.customerId?.mobile
      },
      deliveryAddress: order.deliveryAddress,
      products: order.products.map(p => ({
        productName: p.productId?.productName,
        quantity: p.quantity
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Get orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber: orderId },
      { orderStatus: orderStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
      await order.save();
    }

    res.json({
      orderId: order.orderNumber,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount
    });
  } catch (err) {
    console.error("Update order status error:", err.message);
    res.status(500).json({ message: "Failed to update order status." });
  }
}

async function getUserOrders(req, res) {
  try {
    const userId = req.params.userId;
    if (req.user && req.user.role === "customer" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const orders = await Order.find({ customerId: userId })
      .sort({ orderedAt: -1 });

    res.json(
      orders.map((o) => ({
        orderId: o.orderNumber,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        orderDate: o.orderedAt ? new Date(o.orderedAt).toLocaleDateString("en-IN") : "",
        status: o.orderStatus,
      }))
    );
  } catch (err) {
    console.error("Get user orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch user orders." });
  }
}

async function createOrder(req, res) {
  try {
    const orderData = req.body;
    orderData.userId = req.user.id;
    
    const result = await createOrderRecord(orderData);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Failed to create order." });
  }
}

module.exports = {
  createOrderRecord,
  getAllOrders,
  getUserOrders,
  createOrder,
  updateOrderStatus,
};
