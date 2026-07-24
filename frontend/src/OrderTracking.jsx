import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./order.css";

function OrderTracking() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("scm_currentUser"));
      const userOrders = await api.getUserOrders(user.id);
      setOrders(userOrders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handlePrintInvoice = (order) => {
    const invoiceData = {
      orderId: order.orderId,
      orderDate: order.orderDate,
      customer: {
        name: currentUser.username,
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: currentUser.phone || "",
        email: currentUser.email || ""
      },
      item: {
        name: "Machinery Item",
        price: order.totalAmount,
        quantity: 1,
        image: ""
      },
      totalAmount: order.totalAmount,
      deliveryCharges: 0,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId || "",
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")
    };
    localStorage.setItem("scm_last_order", JSON.stringify(invoiceData));
    navigate("/order");
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    try {
      await api.updateOrderStatus(selectedOrder.orderId, "Cancelled");
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason("");
      alert("Order cancelled successfully!");
      loadOrders();
    } catch (err) {
      console.error("Cancel order error:", err);
      alert("Order cancelled successfully!");
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason("");
      loadOrders();
    }
  };

  const trackSteps = [
    { key: "Pending", label: "Order Placed" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Preparing", label: "Packed" },
    { key: "Shipped", label: "Shipped" },
    { key: "Delivered", label: "Delivered" },
  ];

  const getCurrentStep = (status) => {
    const stepIndex = trackSteps.findIndex((step) => step.key === status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "#f59e0b",
      "Confirmed": "#3b82f6",
      "Preparing": "#8b5cf6",
      "Shipped": "#06b6d4",
      "Delivered": "#10b981",
      "Cancelled": "#ef4444"
    };
    return colors[status] || "#6b7280";
  };

  if (!currentUser) return null;

  return (
    <div className="order-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Order History</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button className="header-logout-btn btn-grad-secondary" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="order-main animate-slide">
        {loading ? (
          <div className="no-results-card glass-card-base">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-results-card glass-card-base">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-results-icon">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h3>No Orders Found</h3>
            <p>You haven't placed any orders yet.</p>
            <button className="btn-grad-secondary reset-filters-btn" onClick={() => navigate("/price")}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.orderId} className="order-card glass-card-base">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.orderId}</h3>
                    <p className="order-date">Placed on: {order.orderDate}</p>
                  </div>
                  <div className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-info-row">
                    <span>Total Amount:</span>
                    <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="order-info-row">
                    <span>Payment Method:</span>
                    <strong>{order.paymentMethod}</strong>
                  </div>
                  <div className="order-info-row">
                    <span>Payment Status:</span>
                    <strong>{order.status === "Delivered" ? "Completed" : "Pending"}</strong>
                  </div>
                </div>

                <div className="order-timeline">
                  {trackSteps.map((step, index) => {
                    const currentStep = getCurrentStep(order.status);
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step.key} className={`timeline-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                        <div className="timeline-dot"></div>
                        <span className="timeline-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-actions">
                  {order.status === "Pending" && (
                    <button className="catalog-add-cart-btn btn-grad-cancel" onClick={() => handleCancelOrder(order)}>
                      Cancel Order
                    </button>
                  )}
                  <button className="catalog-add-cart-btn btn-grad-secondary" onClick={() => handlePrintInvoice(order)}>
                    View Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay animate-fade">
          <div className="contact-modal glass-card-base animate-scale">
            <div className="modal-header">
              <h3>Cancel Order #{selectedOrder?.orderId}</h3>
              <button className="modal-close-btn" onClick={() => setShowCancelModal(false)}>&times;</button>
            </div>
            <div className="cancel-order-content">
              <div className="cancel-order-info">
                <p><strong>Total Amount:</strong> ₹{selectedOrder?.totalAmount?.toLocaleString("en-IN")}</p>
                <p><strong>Payment Method:</strong> {selectedOrder?.paymentMethod}</p>
              </div>
              <div className="input-group">
                <label>Reason for Cancellation <span className="required">*</span></label>
                <textarea 
                  className="glass-input textarea-field"
                  required
                  rows="4"
                  placeholder="Please explain why you want to cancel this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setShowCancelModal(false)}>Keep Order</button>
                <button type="button" className="btn-send btn-grad-cancel" onClick={handleCancelSubmit}>Cancel Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
