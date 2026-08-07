const Address = require("../models/Address");

function mapAddress(address) {
  return {
    id: address._id,
    customerId: address.customerId,
    name: address.name,
    mobile: address.mobile,
    address: address.address,
    city: address.city,
    district: address.district,
    state: address.state,
    pincode: address.pincode,
    landmark: address.landmark,
    createdAt: address.createdAt
  };
}

function assertUserAccess(req, res, userId) {
  if (req.user.role === "admin") return true;
  if (req.user.id !== userId) {
    res.status(403).json({ message: "Access denied." });
    return false;
  }
  return true;
}

async function getUserAddresses(req, res) {
  if (!assertUserAccess(req, res, req.params.userId)) return;
  try {
    const addresses = await Address.find({ customerId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(addresses.map(mapAddress));
  } catch (err) {
    console.error("Get addresses error:", err.message);
    res.status(500).json({ message: "Failed to fetch addresses." });
  }
}

async function createAddress(req, res) {
  if (!assertUserAccess(req, res, req.params.userId)) return;
  const { fullName, phone, email, addressLine1, addressLine2, city, state, pincode, country, district, landmark } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !district || !state || !pincode) {
    return res.status(400).json({ message: "All required address fields are required." });
  }

  try {
    const address = await Address.create({
      customerId: req.params.userId,
      name: fullName.trim(),
      mobile: phone.trim(),
      address: addressLine1.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark?.trim() || ""
    });

    res.status(201).json(mapAddress(address));
  } catch (err) {
    console.error("Add address error:", err.message);
    res.status(500).json({ message: "Failed to save address." });
  }
}

module.exports = {
  getUserAddresses,
  createAddress
};
