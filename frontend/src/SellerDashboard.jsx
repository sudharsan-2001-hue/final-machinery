import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";
import "./seller-dashboard.css";

function SellerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const products = await api.getProducts();
      setStats({
        totalProducts: products.length,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    } catch (err) {
      showToast("Failed to load dashboard stats", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-dashboard-wrapper">
      <header className="global-header">
        <div className="header-logo" onClick={() => navigate("/seller-dashboard")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">MachMart</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Seller Dashboard</h2>
        </div>
        <div className="header-actions">
          <button className="header-logout-btn btn-grad-secondary" onClick={() => navigate("/")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-header">
        <div>
          <h1>Seller Dashboard</h1>
          <p>Manage your cotton machinery and machine oils</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Orders</h3>
          <p className="stat-value">{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button
          className="btn-primary"
          onClick={() => navigate("/seller/upload-product")}
        >
          Upload New Product
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate("/seller/orders")}
        >
          View Orders
        </button>
      </div>
    </div>
  );
}

export default SellerDashboard;
