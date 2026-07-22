import axios from "axios";

const PRESET_IMAGES = {
  // Cotton Industry Machinery Images
  cottonGinning: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop",
  cottonSpinning: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop",
  cottonPressing: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop",
  textileMachine: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&auto=format&fit=crop",
  industrialMachine: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?w=400&auto=format&fit=crop",
  
  // Machine Oil/Lubricant Images
  machineOil: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop",
  lubricant: "https://images.unsplash.com/photo-1581092160607-ee22621dd390?w=400&auto=format&fit=crop",
  industrialOil: "https://images.unsplash.com/photo-1581092795360-fd1fb04c4a98?w=400&auto=format&fit=crop",
  
  // Legacy mappings for compatibility
  machine1: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop",
  machine2: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop",
  machine3: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop",
  machine4: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&auto=format&fit=crop",
  machine5: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?w=400&auto=format&fit=crop",
  machine6: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop",
  machine7: "https://images.unsplash.com/photo-1581092160607-ee22621dd390?w=400&auto=format&fit=crop",
  machine8: "https://images.unsplash.com/photo-1581092795360-fd1fb04c4a98?w=400&auto=format&fit=crop",
};

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("scm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      throw new Error(
        "Cannot reach the server. Make sure the backend is running on port 5000 and SQL Server is connected."
      );
    }
    const message = error.response.data?.message || "Something went wrong.";
    if (error.response.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_currentUser");
    }
    throw new Error(message);
  }
);

export const getProductImage = (imageName) => {
  if (!imageName) return PRESET_IMAGES.machine1;
  if (imageName.startsWith("data:") || imageName.startsWith("http") || imageName.startsWith("/")) {
    return imageName;
  }
  const cleanName = imageName.replace(".jpg", "");
  return PRESET_IMAGES[cleanName] || imageName;
};

export function saveSession(user, token, rememberMe = false) {
  localStorage.setItem("scm_currentUser", JSON.stringify(user));
  localStorage.setItem("scm_token", token);
  localStorage.setItem("scm_rememberMe", rememberMe ? "true" : "false");
}

export function clearSession() {
  localStorage.removeItem("scm_currentUser");
  localStorage.removeItem("scm_token");
  localStorage.removeItem("scm_rememberMe");
}

export const api = {
  async healthCheck() {
    const { data } = await http.get("/health");
    return data;
  },

  async login(identifier, password) {
    const { data } = await http.post("/auth/login", { identifier, password });
    return data;
  },

  async register(email, password, phone, fullName) {
    const { data } = await http.post("/auth/register", { email, password, phone, fullName });
    return data;
  },

  async registerSeller(email, password, phone, fullName, gstNumber, businessName) {
    const { data } = await http.post("/auth/register-seller", { email, password, phone, fullName, gstNumber, businessName });
    return data;
  },

  async forgotPassword(identifier, newPassword) {
    const { data } = await http.post("/auth/forgot-password", { identifier, newPassword });
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    const { data } = await http.post("/auth/change-password", { currentPassword, newPassword });
    return data;
  },

  async getProfile() {
    const { data } = await http.get("/auth/profile");
    return data;
  },

  async getProducts(shopId) {
    const params = shopId ? { shopId } : {};
    const { data } = await http.get("/products", { params });
    return data;
  },

  async getProductById(id) {
    const { data } = await http.get(`/products/${id}`);
    return data;
  },

  async addProduct(productData) {
    const { data } = await http.post("/products", productData);
    return data;
  },

  async updateProduct(id, productData) {
    const { data } = await http.put(`/products/${id}`, productData);
    return data;
  },

  async deleteProduct(id) {
    const { data } = await http.delete(`/products/${id}`);
    return data;
  },

  async updateStock(id, stock, remarks) {
    const { data } = await http.put(`/products/${id}/stock`, { stock: Number(stock), remarks });
    return data;
  },

  async getAddresses(userId) {
    const { data } = await http.get(`/users/${userId}/addresses`);
    return data;
  },

  async addAddress(userId, addressData) {
    const { data } = await http.post(`/users/${userId}/addresses`, addressData);
    return data;
  },

  async getOrders() {
    const { data } = await http.get("/orders");
    return data;
  },

  async getAllOrders() {
    const { data } = await http.get("/orders");
    return data;
  },

  async getUserOrders(userId) {
    const { data } = await http.get(`/users/${userId}/orders`);
    return data;
  },

  async createOrder(orderData) {
    const { data } = await http.post("/orders", orderData);
    return data;
  },

  async updateOrderStatus(orderId, orderStatus) {
    const { data } = await http.put(`/orders/${orderId}/status`, { orderStatus });
    return data;
  },

  async createRazorpayOrder(amount, currency = "INR") {
    const { data } = await http.post("/payments/razorpay/create-order", { amount, currency });
    return data;
  },

  async verifyRazorpayPayment(paymentData) {
    const { data } = await http.post("/payments/razorpay/verify", paymentData);
    return data;
  },

  async addNotification(email, productId) {
    const { data } = await http.post("/notifications", { email, productId });
    return data;
  },

  async sendContactMessage(name, email, message) {
    const { data } = await http.post("/contact-messages", { name, email, message });
    return data;
  },

  async sendComplaint(subject, description, orderId, complaintType, imageUrl, language) {
    const { data } = await http.post("/complaints", { subject, description, orderId, complaintType, imageUrl, language });
    return data;
  },

  async getComplaints() {
    const { data } = await http.get("/complaints");
    return data;
  },

  async getComplaintById(complaintId) {
    const { data } = await http.get(`/complaints/${complaintId}`);
    return data;
  },

  async updateComplaintReply(complaintId, adminReply) {
    const { data } = await http.put(`/complaints/${complaintId}/reply`, { adminReply });
    return data;
  },

  async generateComplaintVoice(complaintId, text, language) {
    const { data } = await http.post(`/complaints/${complaintId}/generate-voice`, { text, language });
    return data;
  },

  async getContactMessages() {
    const { data } = await http.get("/contact-messages");
    return data;
  },

  async markMessageAsRead(messageId) {
    const { data } = await http.put(`/contact-messages/${messageId}/read`);
    return data;
  },

  async getAdminMetrics() {
    const { data } = await http.get("/admin/metrics");
    return data;
  },

  async getShops() {
    const { data } = await http.get("/shops");
    return data;
  },

  async getShopById(id) {
    const { data } = await http.get(`/shops/${id}`);
    return data;
  },

  async createShop(shopData) {
    const { data } = await http.post("/shops", shopData);
    return data;
  },

  async updateShop(id, shopData) {
    const { data } = await http.put(`/shops/${id}`, shopData);
    return data;
  },

  async deleteShop(id) {
    const { data } = await http.delete(`/shops/${id}`);
    return data;
  },
};
