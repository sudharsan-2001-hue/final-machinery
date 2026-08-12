import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import { OrderRowSkeleton } from "./components/SkeletonLoader";
import "./shoporders.css";

function ShopOrders() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const orderStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || (user.role !== "admin" && user.role !== "shopadmin")) {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadOrders() {
      try {
        const allOrders = await api.getOrders();
        setOrders(allOrders);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [navigate]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log("Updating order status - orderId:", orderId, "type:", typeof orderId);
      await api.updateOrderStatus(orderId, newStatus);
      
      // Refresh orders
      const allOrders = await api.getOrders();
      setOrders(allOrders);

      // Trigger dashboard refresh by updating localStorage
      localStorage.setItem('scm_dashboard_refresh', Date.now().toString());
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="shop-orders-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/adminhome")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Shop Orders</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/adminhome")}>
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

      <main className="shop-orders-main animate-slide">
        <div className="shop-orders-content">
          <h1 className="shop-orders-title">Order Management</h1>
          <p className="shop-orders-subtitle">Manage and update shop orders</p>

          {loading ? (
            <div className="orders-skeleton-container">
              {[...Array(5)].map((_, i) => <OrderRowSkeleton key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="no-orders-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-orders-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>No orders found for this shop.</p>
            </div>
          ) : (
            <div className="orders-table-container glass-card-base">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id || ord.orderId}>
                      <td><span className="order-id-badge">{ord.orderNumber || 'N/A'}</span></td>
                      <td>
                        <div className="customer-info">
                          <strong>{ord.customerId?.name || ord.customer?.name || 'N/A'}</strong>
                          <p>{ord.customerId?.mobile || ord.customer?.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td><strong>{ord.products?.[0]?.productId?.productName || 'N/A'}</strong></td>
                      <td className="text-center">{ord.products?.[0]?.quantity || 1}</td>
                      <td className="text-center text-green">₹{(ord.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="text-center">
                        <span className="payment-method-pill">{ord.paymentMethod || 'N/A'}</span>
                      </td>
                      <td className="text-center">
                        <span className={`status-badge status-${(ord.orderStatus || 'pending').toLowerCase()}`}>
                          {ord.orderStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="text-center">
                        <select
                          className="status-select"
                          value={ord.orderStatus || 'pending'}
                          onChange={(e) => handleStatusUpdate(ord._id || ord.orderId, e.target.value)}
                        >
                          {orderStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ShopOrders;
