import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch order details
      setOrder(null);
      setOrderItems([]);
    } catch (err) {
      showToast("Failed to load order details", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    try {
      // TODO: Implement API call to generate invoice
      showToast("Invoice generated successfully!", "success");
    } catch (err) {
      showToast("Failed to generate invoice", "error");
    }
  };

  const trackSteps = [
    { key: "Pending", label: "Order Placed" },
    { key: "Processing", label: "Processing" },
    { key: "Shipped", label: "Shipped" },
    { key: "Delivered", label: "Delivered" },
  ];

  const getCurrentStep = (status) => {
    const stepIndex = trackSteps.findIndex((step) => step.key === status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  return (
    <div className="order-tracking-container">
      <div className="tracking-header">
        <h1>Order Tracking</h1>
        <button className="btn-back" onClick={() => navigate("/order")}>
          Back to Orders
        </button>
      </div>

      {loading ? (
        <p>Loading order details...</p>
      ) : !order ? (
        <div className="empty-state">
          <p>Order not found</p>
        </div>
      ) : (
        <div className="tracking-content">
          <div className="order-info">
            <h3>Order #{order.OrderNumber}</h3>
            <p>Placed on: {new Date(order.CreatedDate).toLocaleDateString()}</p>
            <p>Status: {order.OrderStatus}</p>
            <p>Payment Status: {order.PaymentStatus}</p>
          </div>

          <div className="tracking-timeline">
            <h3>Order Status</h3>
            <div className="timeline">
              {trackSteps.map((step, index) => {
                const currentStep = getCurrentStep(order.OrderStatus);
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.key} className={`timeline-item ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <span className="timeline-label">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            <div className="items-list">
              {/* TODO: Render order items */}
            </div>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{order.SubTotal?.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>GST</span>
              <span>₹{order.GSTAmount?.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>₹{order.ShippingCharges?.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{order.TotalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {order.PaymentStatus === "Completed" && (
            <div className="order-actions">
              <button className="btn-primary" onClick={generateInvoice}>
                Generate Invoice
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
