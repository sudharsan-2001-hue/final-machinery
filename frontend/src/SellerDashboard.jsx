import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <p>Manage your cotton machinery and machine oils</p>
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
