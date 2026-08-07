const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

const DATA_DIR = path.join(__dirname, "temp_data");

const loadJson = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  let content = fs.readFileSync(filePath, "utf8");
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const runMigration = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB cluster successfully!");

    // 1. Clear existing target collections
    console.log("Clearing existing target collections...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Stock.deleteMany({});
    await Address.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    console.log("Collections cleared!");

    // Load JSON files
    const sqlUsers = loadJson("Users.json");
    const sqlCategories = loadJson("MachineryCategories.json");
    const sqlProducts = loadJson("MachineryProducts.json");
    const sqlAddresses = loadJson("CustomerAddresses.json");
    const sqlOrders = loadJson("Orders.json");
    const sqlOrderItems = loadJson("OrderItems.json");
    const sqlPayments = loadJson("Payments.json");
    const sqlComplaints = loadJson("Complaints.json");
    const sqlMessages = loadJson("CustomerMessages.json");
    const sqlShops = loadJson("Shops.json");

    const usedMobiles = new Set();
    const usedEmails = new Set();

    const getUniqueMobile = (mobile) => {
      let m = String(mobile || "").trim();
      if (!m || m === "null" || m === "undefined") {
        m = `987654${Math.floor(1000 + Math.random() * 9000)}`;
      }
      while (usedMobiles.has(m)) {
        // Change the last digit
        const lastDigit = parseInt(m.slice(-1));
        const nextDigit = isNaN(lastDigit) ? 1 : (lastDigit + 1) % 10;
        m = m.slice(0, -1) + nextDigit;
      }
      usedMobiles.add(m);
      return m;
    };

    const getUniqueEmail = (email) => {
      let e = String(email || "").trim().toLowerCase();
      if (!e || e === "null" || e === "undefined") {
        e = `user_${Math.floor(Math.random() * 1000000)}@sudharsan.com`;
      }
      let parts = e.split("@");
      let base = parts[0];
      let domain = parts[1] || "sudharsan.com";
      let counter = 1;
      while (usedEmails.has(e)) {
        e = `${base}_dup${counter}@${domain}`;
        counter++;
      }
      usedEmails.add(e);
      return e;
    };

    const mapOrderStatus = (status) => {
      const s = String(status).toLowerCase();
      if (s.includes("pending")) return "pending";
      if (s.includes("confirm")) return "confirmed";
      if (s.includes("process") || s.includes("prepar")) return "preparing";
      if (s.includes("ship")) return "shipped";
      if (s.includes("deliver")) return "delivered";
      if (s.includes("cancel")) return "cancelled";
      return "pending"; // default
    };

    // Mapping maps to track SQL INT ID -> MongoDB ObjectId conversions
    const userMap = {};       // SQL UserID -> Mongoose User ObjectId
    const categoryMap = {};   // SQL CategoryID -> Mongoose Category ObjectId
    const productMap = {};    // SQL ProductID -> Mongoose Product ObjectId
    const addressMap = {};    // SQL AddressID -> Mongoose Address ObjectId
    const orderMap = {};      // SQL OrderID -> Mongoose Order ObjectId
    const shopMap = {};       // SQL ShopID -> Mongoose User (Seller) ObjectId

    // 2. Migrate Shops & Users
    console.log("Migrating Users & Shops...");
    
    // First, migrate Shops from Shops.json.
    // In MongoDB, a shop is represented as a User document with role = 'seller'.
    for (const shop of sqlShops) {
      const sellerId = new mongoose.Types.ObjectId();
      const shopEmail = getUniqueEmail(`seller_${shop.ShopID}@sudharsan.com`);
      const shopMobile = getUniqueMobile(shop.ShopID === 1 ? "9000000001" : `900000000${shop.ShopID}`);
      
      const newSeller = new User({
        _id: sellerId,
        name: shop.ShopName,
        email: shopEmail,
        mobile: shopMobile,
        password: "$2b$10$gYR1eYt7NhFu3UQOe.krluVmoTJphdhT1HX8nRCGK26RedpP06ziC", // Default password 'customer123'
        role: "seller",
        status: "active",
        address: shop.ShopDescription || "Default Shop Address",
        district: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        gstNumber: "27AAAAA0000A1Z5",
        profileImage: shop.ShopImage || null,
        createdAt: shop.CreatedDate ? new Date(shop.CreatedDate) : new Date(),
        updatedAt: shop.UpdatedDate ? new Date(shop.UpdatedDate) : new Date()
      });
      await newSeller.save();
      shopMap[shop.ShopID] = sellerId;
      console.log(` - Migrated Shop: ${shop.ShopName} (Mapped ShopID ${shop.ShopID} -> Seller User ${sellerId})`);
    }

    // Fallback default shop if none imported
    const defaultShopObjectId = shopMap[1] || new mongoose.Types.ObjectId();
    if (!shopMap[1]) {
      const defaultSeller = new User({
        _id: defaultShopObjectId,
        name: "Sudharsan Cottage Machinery",
        email: getUniqueEmail("seller@sudharsan.com"),
        mobile: getUniqueMobile("9000000001"),
        password: "$2b$10$gYR1eYt7NhFu3UQOe.krluVmoTJphdhT1HX8nRCGK26RedpP06ziC",
        role: "seller",
        status: "active",
        address: "123 Industrial Estate, Singanallur Road, Coimbatore",
        district: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        gstNumber: "27AAAAA0000A1Z5",
        profileImage: "shop1.jpg"
      });
      await defaultSeller.save();
      shopMap[1] = defaultShopObjectId;
      console.log(" - Created default Seller User");
    }

    // Now, migrate standard users from Users.json.
    for (const u of sqlUsers) {
      const newId = new mongoose.Types.ObjectId();
      const roleStr = String(u.Role).toLowerCase();
      
      // If the SQL user was a ShopAdmin, map their role to 'shopadmin' for frontend compatibility
      const finalRole = roleStr === "shopadmin" ? "shopadmin" : (roleStr === "admin" ? "admin" : "customer");
      const finalEmail = getUniqueEmail(u.Email);
      const finalMobile = getUniqueMobile(u.PhoneNumber);

      const newUser = new User({
        _id: newId,
        name: u.Username,
        email: finalEmail,
        mobile: finalMobile,
        password: u.Password, // Carry over existing hashed password
        role: finalRole,
        status: String(u.Status).toLowerCase() === "active" ? "active" : "inactive",
        createdAt: u.CreatedDate ? new Date(u.CreatedDate) : new Date(),
        updatedAt: u.UpdatedDate ? new Date(u.UpdatedDate) : new Date()
      });
      await newUser.save();
      userMap[u.UserID] = newId;
    }
    console.log(`Migrated ${sqlUsers.length} users.`);

    // 3. Migrate Categories
    console.log("Migrating Categories...");
    for (const cat of sqlCategories) {
      const catId = new mongoose.Types.ObjectId();
      const newCat = new Category({
        _id: catId,
        categoryName: cat.CategoryName,
        categoryImage: null,
        createdAt: cat.CreatedDate ? new Date(cat.CreatedDate) : new Date(),
        updatedAt: cat.UpdatedDate ? new Date(cat.UpdatedDate) : new Date()
      });
      await newCat.save();
      categoryMap[cat.CategoryID] = catId;
    }
    console.log(`Migrated ${sqlCategories.length} categories.`);

    // 4. Migrate Products & Create Stock Records
    console.log("Migrating Products and Stock records...");
    for (const prod of sqlProducts) {
      const prodId = new mongoose.Types.ObjectId();
      const mappedCatId = categoryMap[prod.CategoryID];
      
      if (!mappedCatId) {
        console.warn(`Category mapping not found for CategoryID: ${prod.CategoryID}. Skipping product.`);
        continue;
      }
      
      // Look up Shop ID ObjectId
      const mappedShopId = shopMap[prod.ShopID] || defaultShopObjectId;

      const newProduct = new Product({
        _id: prodId,
        shopId: mappedShopId.toString(),
        categoryId: mappedCatId,
        productName: prod.MachineName,
        description: prod.Description || "",
        price: Number(prod.OriginalPrice),
        offerPrice: Number(prod.OfferPrice),
        stock: Number(prod.StockQuantity),
        weight: prod.Weight || "",
        brand: prod.BrandName || "",
        model: prod.ModelNumber || "",
        specifications: "",
        image: prod.MachineImage || "machine1.jpg",
        galleryImages: [],
        status: Number(prod.StockQuantity) > 0 ? "active" : "out_of_stock",
        createdAt: prod.CreatedDate ? new Date(prod.CreatedDate) : new Date(),
        updatedAt: prod.UpdatedDate ? new Date(prod.UpdatedDate) : new Date()
      });
      await newProduct.save();
      productMap[prod.ProductID] = prodId;

      // Also create a Stock record for this product
      const newStock = new Stock({
        productId: prodId,
        shopId: mappedShopId.toString(),
        availableStock: Number(prod.StockQuantity),
        reservedStock: 0,
        minimumStock: 0,
        updatedBy: "system"
      });
      await newStock.save();
    }
    console.log(`Migrated ${sqlProducts.length} products and created stock records.`);

    // 5. Migrate Addresses
    console.log("Migrating Addresses...");
    for (const addr of sqlAddresses) {
      const addrId = new mongoose.Types.ObjectId();
      const mappedCustId = userMap[addr.UserID];
      
      if (!mappedCustId) {
        console.warn(`Customer mapping not found for UserID: ${addr.UserID}. Skipping address.`);
        continue;
      }

      // Combine AddressLine1 and AddressLine2
      const fullAddress = addr.AddressLine2 
        ? `${addr.AddressLine1}, ${addr.AddressLine2}` 
        : addr.AddressLine1;

      const newAddress = new Address({
        _id: addrId,
        customerId: mappedCustId,
        name: addr.FullName,
        mobile: addr.PhoneNumber,
        address: fullAddress,
        city: addr.City,
        district: addr.City, // map City to district
        state: addr.State,
        pincode: addr.Pincode,
        landmark: addr.Country || "India",
        createdAt: addr.CreatedDate ? new Date(addr.CreatedDate) : new Date(),
        updatedAt: addr.UpdatedDate ? new Date(addr.UpdatedDate) : new Date()
      });
      await newAddress.save();
      addressMap[addr.AddressID] = addrId;
    }
    console.log(`Migrated ${sqlAddresses.length} addresses.`);

    // 6. Migrate Orders & Items
    console.log("Migrating Orders & items...");
    for (const ord of sqlOrders) {
      const orderId = new mongoose.Types.ObjectId();
      const mappedCustId = userMap[ord.UserID];
      const mappedAddrId = addressMap[ord.AddressID];
      
      if (!mappedCustId) {
        console.warn(`Customer mapping not found for UserID: ${ord.UserID}. Skipping order.`);
        continue;
      }

      // Find matching address details to embed
      let embeddedAddress = {};
      if (mappedAddrId) {
        const addrObj = await Address.findById(mappedAddrId);
        if (addrObj) {
          embeddedAddress = {
            name: addrObj.name,
            mobile: addrObj.mobile,
            address: addrObj.address,
            city: addrObj.city,
            district: addrObj.district,
            state: addrObj.state,
            pincode: addrObj.pincode,
            landmark: addrObj.landmark
          };
        }
      }
      
      if (Object.keys(embeddedAddress).length === 0) {
        embeddedAddress = {
          name: "Default Customer",
          mobile: "9876543210",
          address: "No address recorded",
          city: "Coimbatore",
          district: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641001",
          landmark: "India"
        };
      }

      // Retrieve items for this order
      const matchingItems = sqlOrderItems.filter(item => item.OrderID === ord.OrderID);
      const productsArray = [];
      let subtotal = 0;

      for (const item of matchingItems) {
        const mappedProdId = productMap[item.ProductID];
        if (!mappedProdId) {
          console.warn(`Product mapping not found for ProductID: ${item.ProductID} inside order items.`);
          continue;
        }
        
        productsArray.push({
          productId: mappedProdId,
          quantity: Number(item.Quantity),
          price: Number(item.UnitPrice)
        });
        subtotal += Number(item.TotalPrice);
      }

      // Find payment record for paymentStatus & transactionId
      const paymentRow = sqlPayments.find(p => p.OrderID === ord.OrderID);
      let payStatus = "pending";
      let txId = "";
      let rpOrderId = "";
      let rpPaymentId = "";

      if (paymentRow) {
        const statusLower = String(paymentRow.PaymentStatus).toLowerCase();
        payStatus = statusLower === "completed" || statusLower === "success" ? "paid" : "pending";
        txId = paymentRow.TransactionID || "";
        rpOrderId = paymentRow.RazorpayOrderID || "";
        rpPaymentId = paymentRow.RazorpayPaymentID || "";
      }

      // Map paymentMethod to Mongoose enum: ['cod', 'razorpay', 'upi']
      let payMethod = "cod";
      const sqlPayMethod = String(ord.PaymentMethod).toLowerCase();
      if (sqlPayMethod.includes("upi")) payMethod = "upi";
      else if (sqlPayMethod.includes("razorpay")) payMethod = "razorpay";
      else if (sqlPayMethod.includes("cash") || sqlPayMethod.includes("cod")) payMethod = "cod";

      const mappedShopId = shopMap[ord.ShopID] || defaultShopObjectId;

      const newOrder = new Order({
        _id: orderId,
        orderNumber: ord.OrderNumber,
        customerId: mappedCustId,
        shopId: mappedShopId.toString(),
        products: productsArray,
        subtotal: subtotal || Number(ord.TotalAmount),
        discount: 0,
        deliveryCharge: 0,
        totalAmount: Number(ord.TotalAmount),
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        transactionId: txId,
        orderStatus: mapOrderStatus(String(ord.OrderStatus).toLowerCase()),
        deliveryAddress: embeddedAddress,
        orderedAt: ord.OrderDate ? new Date(ord.OrderDate) : new Date(),
        deliveredAt: String(ord.OrderStatus).toLowerCase() === "delivered" 
          ? (ord.UpdatedDate ? new Date(ord.UpdatedDate) : new Date())
          : null,
        createdAt: ord.OrderDate ? new Date(ord.OrderDate) : new Date(),
        updatedAt: ord.UpdatedDate ? new Date(ord.UpdatedDate) : new Date()
      });
      await newOrder.save();
      orderMap[ord.OrderID] = orderId;

      // Migrate corresponding payment record if it exists
      if (paymentRow) {
        const newPayment = new Payment({
          orderId: orderId,
          customerId: mappedCustId,
          shopId: mappedShopId.toString(),
          amount: Number(paymentRow.Amount),
          paymentMethod: payMethod,
          paymentStatus: payStatus,
          transactionId: txId,
          razorpayOrderId: rpOrderId,
          razorpayPaymentId: rpPaymentId,
          createdAt: paymentRow.PaymentDate ? new Date(paymentRow.PaymentDate) : new Date(),
          updatedAt: paymentRow.UpdatedDate ? new Date(paymentRow.UpdatedDate) : new Date()
        });
        await newPayment.save();
      }
    }
    console.log(`Migrated ${sqlOrders.length} orders & payments.`);

    // 7. Migrate Complaints
    console.log("Migrating Complaints...");
    for (const c of sqlComplaints) {
      const mappedCustId = userMap[c.CustomerID];
      if (!mappedCustId) {
        console.warn(`Customer mapping not found for UserID: ${c.CustomerID}. Skipping complaint.`);
        continue;
      }

      // Map complaint orderId if it exists
      let orderIdMongo = null;
      if (c.OrderID) {
        // Find matching SQL Order row by OrderNumber or by parse
        const matchingOrderRow = sqlOrders.find(o => String(o.OrderID) === String(c.OrderID) || o.OrderNumber === String(c.OrderID));
        if (matchingOrderRow) {
          orderIdMongo = orderMap[matchingOrderRow.OrderID] || null;
        }
      }

      // Mapped complaintType: 'General', 'Product', 'Delivery', 'Payment', 'Other'
      let mappedType = "General";
      const typeStr = String(c.ComplaintType).toLowerCase();
      if (typeStr.includes("product")) mappedType = "Product";
      else if (typeStr.includes("delivery")) mappedType = "Delivery";
      else if (typeStr.includes("payment")) mappedType = "Payment";
      else if (typeStr.includes("other")) mappedType = "Other";

      // Mapped Status: 'pending', 'in_progress', 'resolved', 'closed'
      let mappedStatus = "pending";
      const statusStr = String(c.Status).toLowerCase();
      if (statusStr.includes("pending")) mappedStatus = "pending";
      else if (statusStr.includes("progress")) mappedStatus = "in_progress";
      else if (statusStr.includes("resolve")) mappedStatus = "resolved";
      else if (statusStr.includes("close")) mappedStatus = "closed";

      const newComplaint = new Complaint({
        customerId: mappedCustId,
        shopId: defaultShopObjectId.toString(),
        title: c.Subject || "General Complaint",
        description: c.Description || "",
        image: c.ImageUrl || null,
        status: mappedStatus,
        adminReply: c.AdminReply || null,
        voiceReply: c.VoiceReplyUrl || null,
        voiceReplyUrl: c.VoiceReplyUrl || null,
        replyDate: c.ReplyDate ? new Date(c.ReplyDate) : null,
        complaintType: mappedType,
        orderId: orderIdMongo,
        createdAt: c.CreatedDate ? new Date(c.CreatedDate) : new Date(),
        updatedAt: c.ReplyDate ? new Date(c.ReplyDate) : new Date()
      });
      await newComplaint.save();
    }
    console.log(`Migrated ${sqlComplaints.length} complaints.`);

    // 8. Migrate Messages to Notifications
    console.log("Migrating Customer Messages to Notifications...");
    for (const msg of sqlMessages) {
      const newNotif = new Notification({
        userId: null,
        shopId: null,
        title: `Contact from ${msg.CustomerName}`,
        message: `${msg.CustomerEmail}: ${msg.Message}`,
        type: "system",
        isRead: msg.IsRead === true || msg.IsRead === 1,
        createdAt: msg.CreatedDate ? new Date(msg.CreatedDate) : new Date(),
        updatedAt: msg.CreatedDate ? new Date(msg.CreatedDate) : new Date()
      });
      await newNotif.save();
    }
    console.log(`Migrated ${sqlMessages.length} customer messages.`);

    console.log("Migration complete!");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
