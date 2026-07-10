import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import "./adminhome.css";

function AdminHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Stats states
  const [stats, setStats] = useState({
    totalMachines: 0,
    availableStock: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || user.role !== "admin") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadDashboard() {
      try {
        const metrics = await api.getAdminMetrics();
        const orders = await api.getOrders();
        const products = await api.getProducts();

        const availableStock = products.reduce((sum, item) => sum + Number(item.stock), 0);

        setStats({
          totalMachines: metrics.totalProducts,
          availableStock: availableStock,
          totalOrders: metrics.totalOrders,
          totalRevenue: metrics.totalRevenue
        });

        // Set recent orders list (already sorted by newest on backend)
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      }
    }
    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="admin-wrapper">
      {/* Global Header */}
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/adminhome")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title admin-title-badge">Admin Dashboard</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={handleLogout}>
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

      {/* Main Admin Console */}
      <main className="admin-main animate-slide">
        {/* KPI stats bar */}
        <section className="admin-kpi-grid">
          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Unique Machine Types</span>
              <h3 className="kpi-value">{stats.totalMachines} Models</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Warehouse Stock Units</span>
              <h3 className="kpi-value">{stats.availableStock} Units</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Processed Orders</span>
              <h3 className="kpi-value">{stats.totalOrders} Orders</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Lifetime Revenue</span>
              <h3 className="kpi-value">₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
            </div>
          </div>
        </section>

        {/* Quick action grid */}
        <section className="quick-actions-section">
          <h2 className="section-block-title">Management Portals</h2>
          <div className="actions-card-grid">
            <div className="action-tile glass-card-base" onClick={() => navigate("/machineryupload")}>
              <div className="action-icon-circle green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Upload Machinery</h4>
                <p>Register new industrial machinery models, specify description details, original/offer prices, and stock allocations.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>

            <div className="action-tile glass-card-base" onClick={() => navigate("/availablestock")}>
              <div className="action-icon-circle blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Available Stock Grid</h4>
                <p>Inspect existing catalog database, check real-time stock statuses, search and filter items, or edit and delete models.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>
          </div>
        </section>

        {/* Recent orders table */}
        <section className="recent-orders-section glass-card-base">
          <h3 className="section-block-title">Recent Purchase Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="admin-table-container">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Machinery Ordered</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Paid Amount</th>
                    <th className="text-center">Method</th>
                    <th className="text-center">Date Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.orderId}>
                      <td><span className="order-id-badge">{ord.orderId}</span></td>
                      <td>
                        <div className="table-customer-meta">
                          <strong>{ord.customer.name}</strong>
                          <p>{ord.customer.phone}</p>
                        </div>
                      </td>
                      <td><strong>{ord.item.name}</strong></td>
                      <td className="text-center">{ord.item.quantity}</td>
                      <td className="text-center text-green">₹{ord.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="text-center"><span className="payment-method-pill">{ord.paymentMethod}</span></td>
                      <td className="text-center">{ord.orderDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-orders-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-orders-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>No orders have been placed in the system yet.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="global-footer glass-card-base animate-fade">
        <div className="footer-top">
          <div className="footer-brand">
            <h4>Sudharsan Cottage Machinery</h4>
            <p>Administrative Control Dashboard Panel.</p>
          </div>
          <div className="footer-links">
            <span className="footer-link" onClick={() => navigate("/adminhome")}>Dashboard</span>
            <span className="footer-link" onClick={() => navigate("/machineryupload")}>Upload</span>
            <span className="footer-link" onClick={() => navigate("/availablestock")}>Stock Table</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Sudharsan Cottage Machinery. All rights reserved.</p>
          <p>ISO 9001:2015 Certified System</p>
        </div>
      </footer>
    </div>
  );
}

export default AdminHome;