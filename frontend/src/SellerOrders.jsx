import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

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
      // TODO: Implement API call to fetch seller orders
      setOrders([]);
    } catch (err) {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <button className="btn-back" onClick={() => navigate("/seller-dashboard")}>
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {/* TODO: Render orders list */}
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
