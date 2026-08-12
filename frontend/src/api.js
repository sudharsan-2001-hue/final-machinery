import axios from "axios";

// =====================================================
// PRESET IMAGES
// =====================================================

const PRESET_IMAGES = {
  // Cotton Industry Machinery
  cottonGinning:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop",

  cottonSpinning:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop",

  cottonPressing:
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop",

  textileMachine:
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&auto=format&fit=crop",

  industrialMachine:
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?w=400&auto=format&fit=crop",

  // Machine Oil / Lubricant
  machineOil:
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop",

  lubricant:
    "https://images.unsplash.com/photo-1581092160607-ee22621dd390?w=400&auto=format&fit=crop",

  industrialOil:
    "https://images.unsplash.com/photo-1581092795360-fd1fb04c4a98?w=400&auto=format&fit=crop",

  // Legacy compatibility
  machine1:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop",

  machine2:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop",

  machine3:
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop",

  machine4:
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&auto=format&fit=crop",

  machine5:
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?w=400&auto=format&fit=crop",

  machine6:
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop",

  machine7:
    "https://images.unsplash.com/photo-1581092160607-ee22621dd390?w=400&auto=format&fit=crop",

  machine8:
    "https://images.unsplash.com/photo-1581092795360-fd1fb04c4a98?w=400&auto=format&fit=crop",
};


// =====================================================
// BACKEND URL
// =====================================================

// Production backend URL (Render)
const PRODUCTION_API_URL = "https://final-machinery.onrender.com/api";

// Use environment variable if set, otherwise use production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;


// =====================================================
// AXIOS INSTANCE
// =====================================================

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("scm_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

http.interceptors.response.use(
  (response) => response,

  (error) => {
    // Server cannot be reached
    if (!error.response) {
      return Promise.reject(
        new Error(
          "Cannot reach the server. Please check your internet connection and try again."
        )
      );
    }

    const status = error.response.status;

    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      `Server error (${status})`;

    // Unauthorized
    if (
      status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_currentUser");
    }

    return Promise.reject(new Error(message));
  }
);


// =====================================================
// HELPER - ALWAYS RETURN ARRAY
// =====================================================

const ensureArray = (
  data,
  keys = [
    "Products",
    "products",
    "value",
    "Shops",
    "shops",
    "Orders",
    "orders",
    "Complaints",
    "complaints",
    "Addresses",
    "addresses",
    "Messages",
    "messages",
    "contactMessages",
  ]
) => {
  if (!data) {
    return [];
  }

  // Already array
  if (Array.isArray(data)) {
    return data;
  }

  // Search common response keys
  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
};


// =====================================================
// IMAGE HELPER
// =====================================================

export const getProductImage = (imageName) => {
  if (!imageName) {
    return PRESET_IMAGES.machine1;
  }

  if (
    imageName.startsWith("data:") ||
    imageName.startsWith("http://") ||
    imageName.startsWith("https://") ||
    imageName.startsWith("/")
  ) {
    return imageName;
  }

  const cleanName = imageName
    .replace(".jpg", "")
    .replace(".jpeg", "")
    .replace(".png", "")
    .trim();

  return PRESET_IMAGES[cleanName] || PRESET_IMAGES.machine1;
};


// =====================================================
// SESSION
// =====================================================

export function saveSession(
  user,
  token,
  rememberMe = false
) {
  localStorage.setItem(
    "scm_currentUser",
    JSON.stringify(user)
  );

  if (token) {
    localStorage.setItem("scm_token", token);
  }

  localStorage.setItem(
    "scm_rememberMe",
    rememberMe ? "true" : "false"
  );
}


export function clearSession() {
  localStorage.removeItem("scm_currentUser");
  localStorage.removeItem("scm_token");
  localStorage.removeItem("scm_rememberMe");
}


// =====================================================
// API
// =====================================================

export const api = {

  // ---------------------------------------------------
  // HEALTH
  // ---------------------------------------------------

  async healthCheck() {
    const { data } = await http.get("/health");
    return data;
  },


  // ---------------------------------------------------
  // AUTH
  // ---------------------------------------------------

  async login(identifier, password) {
    const { data } = await http.post(
      "/auth/login",
      {
        identifier,
        password,
      }
    );

    return data;
  },


  async register(
    email,
    password,
    phone,
    fullName,
    customerType
  ) {
    const { data } = await http.post(
      "/auth/register",
      {
        email,
        password,
        phone,
        fullName,
        customerType,
      }
    );

    return data;
  },


  async registerSeller(
    email,
    password,
    phone,
    fullName,
    gstNumber,
    businessName,
    profileImage
  ) {
    const { data } = await http.post(
      "/auth/register-seller",
      {
        email,
        password,
        phone,
        fullName,
        gstNumber,
        businessName,
        profileImage,
      }
    );

    return data;
  },


  async forgotPassword(
    identifier,
    newPassword
  ) {
    const { data } = await http.post(
      "/auth/forgot-password",
      {
        identifier,
        newPassword,
      }
    );

    return data;
  },


  async changePassword(
    currentPassword,
    newPassword
  ) {
    const { data } = await http.post(
      "/auth/change-password",
      {
        currentPassword,
        newPassword,
      }
    );

    return data;
  },


  async getProfile() {
    const { data } = await http.get(
      "/auth/profile"
    );

    return data;
  },


  // ---------------------------------------------------
  // PRODUCTS
  // ---------------------------------------------------

  async getProducts(shopId) {
    const params = shopId
      ? { shopId }
      : {};

    const { data } = await http.get(
      "/products",
      { params }
    );

    return ensureArray(data, [
      "Products",
      "products",
      "value",
    ]);
  },


  async getProductById(id) {
    const { data } = await http.get(
      `/products/${id}`
    );

    return data;
  },


  async addProduct(productData) {
    const { data } = await http.post(
      "/products",
      productData
    );

    return data;
  },


  async updateProduct(
    id,
    productData
  ) {
    const { data } = await http.put(
      `/products/${id}`,
      productData
    );

    return data;
  },


  async deleteProduct(id) {
    const { data } = await http.delete(
      `/products/${id}`
    );

    return data;
  },


  async updateStock(
    id,
    stock,
    remarks
  ) {
    const { data } = await http.put(
      `/products/${id}/stock`,
      {
        stock: Number(stock),
        remarks,
      }
    );

    return data;
  },


  // ---------------------------------------------------
  // ADDRESSES
  // ---------------------------------------------------

  async getAddresses(userId) {
    const { data } = await http.get(
      `/users/${userId}/addresses`
    );

    return ensureArray(data, [
      "Addresses",
      "addresses",
      "value",
    ]);
  },


  async addAddress(
    userId,
    addressData
  ) {
    const { data } = await http.post(
      `/users/${userId}/addresses`,
      addressData
    );

    return data;
  },


  // ---------------------------------------------------
  // ORDERS
  // ---------------------------------------------------

  async getOrders() {
    const { data } = await http.get(
      "/orders"
    );

    return ensureArray(data, [
      "Orders",
      "orders",
      "value",
    ]);
  },


  async getAllOrders() {
    const { data } = await http.get(
      "/orders"
    );

    return ensureArray(data, [
      "Orders",
      "orders",
      "value",
    ]);
  },


  async getUserOrders(userId) {
    const { data } = await http.get(
      `/users/${userId}/orders`
    );

    return ensureArray(data, [
      "Orders",
      "orders",
      "value",
    ]);
  },


  async createOrder(orderData) {
    const { data } = await http.post(
      "/orders",
      orderData
    );

    return data;
  },


  async updateOrderStatus(
    orderId,
    orderStatus
  ) {
    const { data } = await http.put(
      `/orders/${orderId}/status`,
      {
        orderStatus,
      }
    );

    return data;
  },


  // ---------------------------------------------------
  // RAZORPAY
  // ---------------------------------------------------

  async createRazorpayOrder(
    amount,
    currency = "INR"
  ) {
    const { data } = await http.post(
      "/payments/razorpay/create-order",
      {
        amount,
        currency,
      }
    );

    return data;
  },


  async verifyRazorpayPayment(
    paymentData
  ) {
    const { data } = await http.post(
      "/payments/razorpay/verify",
      paymentData
    );

    return data;
  },


  // ---------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------

  async addNotification(
    email,
    productId
  ) {
    const { data } = await http.post(
      "/notifications",
      {
        email,
        productId,
      }
    );

    return data;
  },


  // ---------------------------------------------------
  // CONTACT
  // ---------------------------------------------------

  async sendContactMessage(
    name,
    email,
    message
  ) {
    const { data } = await http.post(
      "/contact-messages",
      {
        name,
        email,
        message,
      }
    );

    return data;
  },


  async getContactMessages() {
    const { data } = await http.get(
      "/contact-messages"
    );

    return ensureArray(data, [
      "Messages",
      "messages",
      "value",
      "contactMessages",
    ]);
  },


  async markMessageAsRead(messageId) {
    const { data } = await http.put(
      `/contact-messages/${messageId}/read`
    );

    return data;
  },


  // ---------------------------------------------------
  // COMPLAINTS
  // ---------------------------------------------------

  async sendComplaint(
    subject,
    description,
    orderId,
    complaintType,
    imageUrl,
    language,
    customerVoiceUrl
  ) {
    const { data } = await http.post(
      "/complaints",
      {
        subject,
        description,
        orderId,
        complaintType,
        imageUrl,
        language,
        customerVoiceUrl,
      }
    );

    return data;
  },


  async uploadCustomerVoice(
    formData
  ) {
    const { data } = await http.post(
      "/upload-customer-voice",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return data;
  },


  async uploadVoiceReply(
    formData
  ) {
    const { data } = await http.post(
      "/upload-voice-reply",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return data;
  },


  async getComplaints() {
    const { data } = await http.get(
      "/complaints"
    );

    return ensureArray(data, [
      "Complaints",
      "complaints",
      "value",
    ]);
  },


  async getMyComplaints() {
    const { data } = await http.get(
      "/my-complaints"
    );

    return ensureArray(data, [
      "Complaints",
      "complaints",
      "value",
    ]);
  },


  async getComplaintById(
    complaintId
  ) {
    const { data } = await http.get(
      `/complaints/${complaintId}`
    );

    return data;
  },


  async updateComplaintReply(
    complaintId,
    adminReply
  ) {
    const { data } = await http.put(
      `/complaints/${complaintId}/reply`,
      {
        adminReply,
      }
    );

    return data;
  },


  async generateComplaintVoice(
    complaintId,
    text,
    language
  ) {
    const { data } = await http.post(
      `/complaints/${complaintId}/generate-voice`,
      {
        text,
        language,
      }
    );

    return data;
  },


  // ---------------------------------------------------
  // ADMIN
  // ---------------------------------------------------

  async getAdminMetrics() {
    const { data } = await http.get(
      "/admin/metrics"
    );

    return data;
  },

  async getShopMetrics(shopId) {
    const { data } = await http.get(
      `/shop/${shopId}/metrics`
    );

    return data;
  },

  async getShopComplaints(shopId) {
    const { data } = await http.get(
      `/shop/${shopId}/complaints`
    );

    return ensureArray(data, [
      "Complaints",
      "complaints",
      "value",
    ]);
  },


  // ---------------------------------------------------
  // SHOPS
  // ---------------------------------------------------

  async getShops() {
    const { data } = await http.get(
      "/shops"
    );

    return ensureArray(data, [
      "Shops",
      "shops",
      "value",
    ]);
  },

  async registerShop(shopId, shopName, address, gstNumber, shopImage) {
    const { data } = await http.post(
      "/shops/register",
      {
        shopId,
        shopName,
        address,
        gstNumber,
        shopImage
      }
    );

    return data;
  },


  async getShopById(id) {
    const { data } = await http.get(
      `/shops/${id}`
    );

    return data;
  },


  async createShop(shopData) {
    const { data } = await http.post(
      "/shops",
      shopData
    );

    return data;
  },


  async updateShop(
    id,
    shopData
  ) {
    const { data } = await http.put(
      `/shops/${id}`,
      shopData
    );

    return data;
  },


  async deleteShop(id) {
    const { data } = await http.delete(
      `/shops/${id}`
    );

    return data;
  },
};