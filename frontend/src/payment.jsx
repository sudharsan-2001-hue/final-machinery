import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getProductImage } from "./api";
import { useToast } from "./components/Toast";
import "./payment.css";

const DELIVERY_CHARGES = 1500;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Payment() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentError, setPaymentError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    const checkout = JSON.parse(localStorage.getItem("scm_checkout"));
    if (!checkout || !checkout.customer) {
      navigate("/address");
      return;
    }
    setCheckoutData(checkout);
  }, [navigate]);

  const executeCodOrder = useCallback(async () => {
    const totalAmount = checkoutData.totalAmount + DELIVERY_CHARGES;
    setPlacingOrder(true);
    setPaymentError("");

    try {
      const newOrder = await api.createOrder({
        userId: currentUser.id,
        addressId: checkoutData.addressId,
        totalAmount,
        paymentMethod: "Cash On Delivery",
        item: {
          id: checkoutData.machineId,
          quantity: checkoutData.quantity,
          price: checkoutData.offerPrice,
        },
      });

      localStorage.removeItem("scm_checkout");
      localStorage.setItem("scm_last_order", JSON.stringify(newOrder));
      showToast("Order placed successfully!", "success");
      navigate("/order");
    } catch (err) {
      setPaymentError(err.message || "Failed to place order.");
      showToast(err.message || "Failed to place order.", "error");
    } finally {
      setPlacingOrder(false);
    }
  }, [checkoutData, currentUser, navigate, showToast]);

  const executeRazorpayPayment = useCallback(async () => {
    const totalAmount = checkoutData.totalAmount + DELIVERY_CHARGES;
    setPlacingOrder(true);
    setPaymentError("");

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay checkout. Check your internet connection.");
      }

      const razorpayOrder = await api.createRazorpayOrder(totalAmount, "INR");
     console.log("Razorpay Order Response:", razorpayOrder);
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Sudharsan Cottage Machinery",
        description: checkoutData.name,
        order_id: razorpayOrder.orderId,
        prefill: {
          name: checkoutData.customer.name,
          email: checkoutData.customer.email,
          contact: checkoutData.customer.phone,
        },
        theme: { color: "#22c55e" },
        handler: async (response) => {
          try {
            const newOrder = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: currentUser.id,
              addressId: checkoutData.addressId,
              totalAmount,
              item: {
                id: checkoutData.machineId,
                quantity: checkoutData.quantity,
                price: checkoutData.offerPrice,
              },
            });

            localStorage.removeItem("scm_checkout");
            localStorage.setItem("scm_last_order", JSON.stringify(newOrder));
            showToast("Payment successful! Order confirmed.", "success");
            navigate("/home");
          } catch (err) {
            setPaymentError(err.message || "Payment verified but order failed.");
            showToast(err.message || "Order failed after payment.", "error");
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            setPaymentError("Payment was cancelled. Please try again or choose COD.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPlacingOrder(false);
        const msg = response.error?.description || "Payment failed.";
        setPaymentError(msg);
        showToast(msg, "error");
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.message || "Failed to initiate Razorpay payment.");
      showToast(err.message || "Razorpay payment failed.", "error");
      setPlacingOrder(false);
    }
  }, [checkoutData, currentUser, navigate, showToast]);

  const handlePlaceOrder = () => {
    setPaymentError("");
    if (paymentMethod === "COD") {
      executeCodOrder();
    } else {
      executeRazorpayPayment();
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser || !checkoutData) return null;

  const totalPayable = checkoutData.totalAmount + DELIVERY_CHARGES;

  return (
    <div className="payment-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Secure Checkout</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/address")} disabled={placingOrder}>
            Back
          </button>
          <button className="header-logout-btn btn-grad-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="payment-main animate-slide">
        <div className="payment-split-grid">
          <div className="payment-summary-col glass-card-base">
            <h3 className="section-col-title">Order Invoice Summary</h3>
            <div className="invoice-product-row">
              <img src={getProductImage(checkoutData.image)} alt={checkoutData.name} className="invoice-product-image" />
              <div className="invoice-product-info">
                <h4>{checkoutData.name}</h4>
                <p>Quantity: <strong>{checkoutData.quantity}</strong></p>
                <p>Unit Rate: <strong>₹{checkoutData.offerPrice.toLocaleString("en-IN")}</strong></p>
              </div>
            </div>
            <div className="invoice-divider"></div>
            <div className="invoice-price-table">
              <div className="invoice-price-row">
                <span>Items Subtotal</span>
                <span>₹{checkoutData.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="invoice-price-row">
                <span>Heavy Cargo Shipping</span>
                <span>₹{DELIVERY_CHARGES.toLocaleString("en-IN")}</span>
              </div>
              <div className="invoice-divider"></div>
              <div className="invoice-price-row grand-total">
                <span>Grand Total</span>
                <span>₹{totalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="invoice-divider"></div>
            <h3 className="section-col-title">Shipping Address</h3>
            <div className="invoice-address-card">
              <p className="addr-name">{checkoutData.customer.name}</p>
              <p className="addr-text">{checkoutData.customer.address}</p>
              <p className="addr-city-state">{checkoutData.customer.city}, {checkoutData.customer.state} - {checkoutData.customer.pincode}</p>
              <p className="addr-phone">Mobile: {checkoutData.customer.phone}</p>
            </div>
          </div>

          <div className="payment-action-col glass-card-base">
            <h3 className="section-col-title">Select Payment Method</h3>
            <p className="payment-action-desc">All transactions are encrypted and processed securely.</p>

            {paymentError && <div className="alert alert-error">{paymentError}</div>}

            <div className="payment-methods-list">
              <label className={`payment-method-tile ${paymentMethod === "COD" ? "active" : ""}`}>
                <input type="radio" name="paymentOption" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="radio-selector-input" disabled={placingOrder} />
                <div className="payment-tile-content">
                  <div className="tile-icon-box orange">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="tile-icon">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="tile-text">
                    <h4>Cash On Delivery (COD)</h4>
                    <p>Pay upon delivery. Payment status: Pending until delivery.</p>
                  </div>
                </div>
              </label>

              <label className={`payment-method-tile ${paymentMethod === "RAZORPAY" ? "active" : ""}`}>
                <input type="radio" name="paymentOption" value="RAZORPAY" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} className="radio-selector-input" disabled={placingOrder} />
                <div className="payment-tile-content">
                  <div className="tile-icon-box blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="tile-icon">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div className="tile-text">
                    <h4>Razorpay Online</h4>
                    <p>Pay via UPI, card, net banking, or wallet. Instant confirmation.</p>
                  </div>
                </div>
              </label>
            </div>

            <button
              className="payment-checkout-submit-btn btn-grad-primary"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder ? (
                <><span className="spinner-inline"></span>Processing...</>
              ) : paymentMethod === "COD" ? (
                "Confirm Order (Cash On Delivery)"
              ) : (
                "Pay with Razorpay"
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="global-footer glass-card-base animate-fade">
        <div className="footer-bottom">
          <p>&copy; 2026 Sudharsan Cottage Machinery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Payment;
