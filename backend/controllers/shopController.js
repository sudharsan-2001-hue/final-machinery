const Shop = require("../models/User");

function mapShop(shop) {
  return {
    id: shop._id,
    name: shop.name,
    email: shop.email,
    mobile: shop.mobile,
    role: shop.role,
    status: shop.status,
    createdAt: shop.createdAt,
  };
}

async function getAllShops(req, res) {
  try {
    const shops = await Shop.find({ role: "seller", status: "active" }).sort({ name: 1 });
    res.json(shops.map(mapShop));
  } catch (err) {
    console.error("Get shops error:", err.message);
    res.status(500).json({ message: "Failed to fetch shops." });
  }
}

async function getShopById(req, res) {
  try {
    const shop = await Shop.findOne({ _id: req.params.id, role: "seller", status: "active" });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }
    res.json(mapShop(shop));
  } catch (err) {
    console.error("Get shop error:", err.message);
    res.status(500).json({ message: "Failed to fetch shop." });
  }
}

async function createShop(req, res) {
  const { name, email, mobile, password, address, district, state, pincode, gstNumber, shopImage } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ message: "Name, email, mobile, and password are required." });
  }

  try {
    const shopId = `SHOP${Date.now()}`;
    const shop = await Shop.create({
      name: name,
      email: email.trim().toLowerCase(),
      mobile: mobile,
      password: password,
      role: "seller",
      status: "active",
      shopId: shopId,
      address: address,
      district: district,
      state: state,
      pincode: pincode,
      gstNumber: gstNumber,
      profileImage: shopImage
    });

    res.status(201).json(mapShop(shop));
  } catch (err) {
    console.error("Create shop error:", err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email or mobile already registered." });
    }
    res.status(500).json({ message: "Failed to create shop." });
  }
}

async function updateShop(req, res) {
  const { name, email, mobile, address, district, state, pincode, gstNumber, shopImage, status } = req.body;

  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.trim().toLowerCase();
    if (mobile) updateData.mobile = mobile;
    if (address !== undefined) updateData.address = address;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (shopImage !== undefined) updateData.profileImage = shopImage;
    if (status) updateData.status = status;

    const shop = await Shop.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    res.json(mapShop(shop));
  } catch (err) {
    console.error("Update shop error:", err.message);
    res.status(500).json({ message: "Failed to update shop." });
  }
}

async function deleteShop(req, res) {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, { status: "inactive" });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    res.json({ message: "Shop deactivated successfully." });
  } catch (err) {
    console.error("Delete shop error:", err.message);
    res.status(500).json({ message: "Failed to deactivate shop." });
  }
}

module.exports = {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
};
