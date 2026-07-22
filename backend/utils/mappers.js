function mapProduct(p) {
  return {
    id: p.ProductID,
    name: p.MachineName,
    description: p.Description || p.ProductDescription || "",
    originalPrice: Number(p.OriginalPrice),
    offerPrice: Number(p.OfferPrice),
    stock: p.StockQuantity,
    category: p.CategoryName || "",
    image: p.MachineImage || "",
    brand: p.BrandName || "",
    model: p.ModelNumber || "",
    weight: p.Weight || "N/A",
    status: p.Status || p.ProductStatus || "Active",
  };
}

function mapAddress(a) {
  return {
    id: a.AddressID,
    fullName: a.FullName,
    phone: a.PhoneNumber,
    email: a.Email,
    addressLine1: a.AddressLine1,
    addressLine2: a.AddressLine2 || "",
    city: a.City,
    state: a.State,
    pincode: a.Pincode,
    country: a.Country || "India",
  };
}

function formatOrderResponse(order, items, customer, address) {
  const item = items[0] || {};
  const orderDate = order.OrderDate
    ? new Date(order.OrderDate).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");
  const expectedDelivery = new Date(order.OrderDate || Date.now());
  expectedDelivery.setDate(expectedDelivery.getDate() + 7);

  return {
    orderId: order.OrderNumber,
    orderDate,
    expectedDelivery: expectedDelivery.toLocaleDateString("en-IN"),
    totalAmount: Number(order.TotalAmount),
    deliveryCharges: 1500,
    paymentMethod: order.PaymentMethod,
    orderStatus: order.OrderStatus || "Pending",
    paymentStatus: order.PaymentStatus || "",
    customer: {
      name: customer?.FullName || customer?.Username || "",
      phone: customer?.PhoneNumber || "",
      email: customer?.Email || "",
      address: address ? address.AddressLine1 || "" : "",
      city: address?.City || "",
      state: address?.State || "",
      pincode: address?.Pincode || "",
    },
    item: {
      id: item.ProductID,
      name: item.MachineName || item.name || "",
      quantity: item.Quantity || 1,
      price: Number(item.UnitPrice || item.price || 0),
      image: item.MachineImage || item.image || "",
    },
  };
}

function formatAdminOrder(order, items, customer) {
  const item = items[0] || {};
  return {
    orderId: order.OrderID,
    orderNumber: order.OrderNumber,
    orderDate: order.OrderDate
      ? new Date(order.OrderDate).toLocaleDateString("en-IN")
      : "",
    totalAmount: Number(order.TotalAmount),
    paymentMethod: order.PaymentMethod,
    status: order.OrderStatus,
    customer: {
      name: customer?.FullName || customer?.Username || "",
      phone: customer?.PhoneNumber || "",
    },
    item: {
      name: item.MachineName || "",
      quantity: item.Quantity || 1,
    },
  };
}

module.exports = {
  mapProduct,
  mapAddress,
  formatOrderResponse,
  formatAdminOrder,
};
