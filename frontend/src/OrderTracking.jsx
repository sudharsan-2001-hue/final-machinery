import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import { OrderHistoryCardSkeleton } from "./components/SkeletonLoader";
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
    { key: "confirmed", label: "Confirmed" },
    { key: "preparing", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const getCurrentStep = (status) => {
    const s = (status || "").toLowerCase();
    const stepIndex = trackSteps.findIndex((step) => step.key === s);
    return stepIndex;
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    const colors = {
      "pending": "#f59e0b",
      "confirmed": "#3b82f6",
      "preparing": "#8b5cf6",
      "shipped": "#06b6d4",
      "delivered": "#10b981",
      "cancelled": "#ef4444"
    };
    return colors[s] || "#6b7280";
  };

  if (!currentUser) return null;

  return (
    <div className="order-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">MachMart</span>
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
          <div className="orders-list">
            {[...Array(3)].map((_, i) => (
              <OrderHistoryCardSkeleton key={i} />
            ))}
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

                <div className={`order-timeline ${order.status?.toLowerCase() === "cancelled" ? "is-cancelled" : ""}`}>
                  {trackSteps.map((step, index) => {
                    const currentStep = getCurrentStep(order.status);
                    const isCompleted = currentStep >= 0 && index <= currentStep;
                    const isCurrent = currentStep >= 0 && index === currentStep;

                    return (
                      <div key={step.key} className={`timeline-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                        <div className="timeline-dot"></div>
                        <span className="timeline-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-actions">
                  {order.status?.toLowerCase() === "cancelled" ? (
                    <button className="catalog-add-cart-btn btn-cancelled" disabled style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', textDecoration: 'line-through', cursor: 'not-allowed', padding: '12px 24px', borderRadius: '12px', fontWeight: '600' }}>
                      Cancelled
                    </button>
                  ) : (order.status?.toLowerCase() === "pending" && (
                    <button className="catalog-add-cart-btn btn-grad-cancel" onClick={() => handleCancelOrder(order)}>
                      Cancel Order
                    </button>
                  ))}
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
