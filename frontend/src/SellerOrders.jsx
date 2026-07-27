import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";
import "./seller-orders.css";

function SellerOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await api.getAllOrders();
      setOrders(allOrders);
    } catch (err) {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-orders-wrapper">
      <header className="global-header">
        <div className="header-logo" onClick={() => navigate("/seller-dashboard")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Orders</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/seller-dashboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <div className="orders-header">
        <h1>My Orders</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-number">{order.orderId}</div>
                  <div className="order-date">{order.orderDate}</div>
                </div>
                <span className={`order-status status-${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-details">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div>
                      <div className="order-item-name">{item.MachineName}</div>
                      <div className="order-item-quantity">Qty: {item.Quantity}</div>
                    </div>
                    <div className="order-item-price">₹{item.TotalPrice?.toLocaleString("en-IN") || 0}</div>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span className="order-total-label">Total Amount</span>
                <span className="order-total-amount">₹{order.totalAmount?.toLocaleString("en-IN") || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
