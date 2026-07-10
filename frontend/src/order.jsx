import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImage, clearSession } from "./api";
import "./order.css";

function Order() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    // 2. Fetch last placed order
    const lastOrder = JSON.parse(localStorage.getItem("scm_last_order"));
    if (!lastOrder) {
      navigate("/home");
      return;
    }
    setOrder(lastOrder);
  }, [navigate]);

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem("scm_last_order");
    navigate("/");
  };

  if (!currentUser || !order) return null;

  return (
    <div className="order-wrapper">
      {/* Global Header (hidden during printing) */}
      <header className="global-header glass-card-base animate-fade print-hidden">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Receipt</h2>
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

      {/* Main Order Details */}
      <main className="order-main animate-slide">
        {/* Success checkmark banner (hidden during printing) */}
        <section className="order-success-banner print-hidden">
          <div className="checkmark-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="checkmark-svg">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="success-heading">Order Placed Successfully!</h1>
          <p className="success-subheading">Thank you for shopping. Your purchase details are shown below.</p>
        </section>

        {/* Invoice Layout Sheet (Visible always, customized during printing) */}
        <section className="invoice-sheet glass-card-base">
          {/* Print specific header */}
          <div className="print-header-invoice">
            <div className="invoice-title-col">
              <h2>TAX INVOICE</h2>
              <p>Invoice Ref: <strong>{order.orderId}</strong></p>
              <p>Date: {order.orderDate}</p>
            </div>
            <div className="invoice-company-details">
              <h3>Sudharsan Cottage Machinery</h3>
              <p>Industrial Estate Road, Singanallur</p>
              <p>Coimbatore, Tamil Nadu - 641005</p>
              <p>GSTIN: 33AAACCS8392M1Z9</p>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Billing metadata */}
          <div className="invoice-billing-row">
            <div className="billing-col">
              <span className="billing-label">Billed To (Customer):</span>
              <strong>{order.customer.name}</strong>
              <p>{order.customer.address}</p>
              <p>{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
              <p>Phone: {order.customer.phone}</p>
              <p>Email: {order.customer.email}</p>
            </div>
            <div className="shipping-col">
              <span className="billing-label">Delivery Specifications:</span>
              <p>Payment Mode: <strong>{order.paymentMethod}</strong></p>
              <p>Shipment Status: <strong>Allocated / Dispatched</strong></p>
              <p>Expected Arrival Date: <strong className="arrival-date-highlight">{order.expectedDelivery}</strong></p>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Items breakdown Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Machinery Description</th>
                <th className="text-center">Rate (INR)</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="table-item-desc">
                    <img src={getProductImage(order.item.image)} alt={order.item.name} className="table-item-img print-hidden" />
                    <div>
                      <strong>{order.item.name}</strong>
                      <p className="print-hidden">Heavy Industrial machinery series</p>
                      <p style={{ fontSize: "11px", color: "#f59e0b", marginTop: "2px" }}>Weight: {order.item.weight || "N/A"}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center">₹{order.item.price.toLocaleString("en-IN")}</td>
                <td className="text-center">{order.item.quantity}</td>
                <td className="text-right">₹{(order.item.price * order.item.quantity).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-divider"></div>

          {/* Tax summary calculations */}
          <div className="invoice-calculations-summary">
            <div className="calc-row">
              <span>Subtotal Amount:</span>
              <span>₹{(order.item.price * order.item.quantity).toLocaleString("en-IN")}</span>
            </div>
            <div className="calc-row">
              <span>Freight Surcharge & Delivery:</span>
              <span>₹{order.deliveryCharges.toLocaleString("en-IN")}</span>
            </div>
            <div className="calc-row">
              <span>Integrated GST (IGST @18%):</span>
              <span>Included</span>
            </div>
            <div className="invoice-divider"></div>
            <div className="calc-row final-grand-total">
              <span>Grand Total Paid:</span>
              <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="print-footer-signature">
            <p>Authorized Signature</p>
            <div className="sig-line"></div>
            <p>Sudharsan Cottage Machinery</p>
          </div>
        </section>

        {/* Buttons (hidden during printing) */}
        <section className="order-actions-row print-hidden">
          <button className="order-home-btn btn-grad-secondary" onClick={() => navigate("/home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Home
          </button>
          <button className="order-download-btn btn-grad-primary" onClick={handlePrintInvoice}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Invoice Receipt
          </button>
        </section>
      </main>

      {/* Footer (hidden during printing) */}
      <footer className="global-footer glass-card-base animate-fade print-hidden">
        <div className="footer-top">
          <div className="footer-brand">
            <h4>Sudharsan Cottage Machinery</h4>
            <p>High-quality manufacturing, packaging, and processing machinery for cottage industries.</p>
          </div>
          <div className="footer-links">
            <span className="footer-link" onClick={() => navigate("/home")}>Dashboard</span>
            <span className="footer-link" onClick={() => navigate("/price")}>Products</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Sudharsan Cottage Machinery. All rights reserved.</p>
          <p>ISO 9001:2015 Certified Industrial Partner</p>
        </div>
      </footer>
    </div>
  );
}

export default Order;