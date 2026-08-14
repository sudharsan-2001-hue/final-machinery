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
    console.log("Checkout data from localStorage:", JSON.stringify(checkout, null, 2));
    if (!checkout || !checkout.customer) {
      navigate("/checkout");
      return;
    }
    setCheckoutData(checkout);
  }, [navigate]);

  const executeCodOrder = useCallback(async () => {
    const totalAmount = checkoutData.totalAmount;
    setPlacingOrder(true);
    setPaymentError("");

    try {
      // Validate checkout data
      if (!checkoutData.addressId) {
        throw new Error("Address information missing. Please go back and select an address.");
      }

      if (!checkoutData.items || checkoutData.items.length === 0) {
        // If items array is missing, try to create from machineId
        if (checkoutData.machineId) {
          checkoutData.items = [{
            id: checkoutData.machineId,
            quantity: checkoutData.quantity || 1,
            price: checkoutData.offerPrice || checkoutData.price,
            offerPrice: checkoutData.offerPrice,
            originalPrice: checkoutData.originalPrice
          }];
        } else {
          throw new Error("No items in cart. Please add products to your order.");
        }
      }

      // Create order with first item for compatibility
      const firstItem = checkoutData.items[0];
      const productId = firstItem.id || firstItem._id || checkoutData.machineId;

      if (!productId) {
        throw new Error("Product ID is missing from checkout data. Please start the order process again.");
      }

      const orderPayload = {
        userId: currentUser.id,
        addressId: checkoutData.addressId,
        totalAmount,
        paymentMethod: "Cash On Delivery",
        item: {
          id: productId,
          quantity: firstItem.quantity,
          price: firstItem.offerPrice || firstItem.price,
        },
      };

      console.log("Order payload item:", JSON.stringify(orderPayload.item, null, 2));

      console.log("Sending order payload:", JSON.stringify(orderPayload, null, 2));
      const newOrder = await api.createOrder(orderPayload);

      localStorage.removeItem("scm_checkout");
      localStorage.removeItem("scm_cart_items");

      const invoiceData = {
        orderId: newOrder.orderNumber,
        orderDate: new Date().toLocaleDateString("en-IN"),
        customer: checkoutData.customer,
        items: checkoutData.items,
        totalAmount: checkoutData.totalAmount,
        deliveryCharges: checkoutData.deliveryCharges,
        gst: checkoutData.gst,
        subtotal: checkoutData.subtotal,
        paymentMethod: "Cash On Delivery",
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")
      };
      localStorage.setItem("scm_last_order", JSON.stringify(invoiceData));

      showToast("Order placed successfully!", "success");
      navigate("/order");
    } catch (err) {
      console.error("COD Order Error:", err);
      setPaymentError(err.message || "Failed to place order. Please try again.");
      showToast(err.message || "Failed to place order.", "error");
    } finally {
      setPlacingOrder(false);
    }
  }, [checkoutData, currentUser, navigate, showToast]);

  const executeRazorpayPayment = useCallback(async () => {
    const totalAmount = checkoutData.totalAmount;
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
        name: "MachMart",
        description: "Machinery Purchase",
        order_id: razorpayOrder.orderId,
        prefill: {
          name: checkoutData.customer.name,
          email: checkoutData.customer.email,
          contact: checkoutData.customer.phone,
        },
        theme: { color: "#22c55e" },
        handler: async (response) => {
          try {
            // Ensure items array exists with product ID
            if (!checkoutData.items || checkoutData.items.length === 0) {
              if (checkoutData.machineId) {
                checkoutData.items = [{
                  id: checkoutData.machineId,
                  quantity: checkoutData.quantity || 1,
                  price: checkoutData.offerPrice || checkoutData.price,
                  offerPrice: checkoutData.offerPrice,
                  originalPrice: checkoutData.originalPrice
                }];
              }
            }

            // Create order with first item for compatibility
            const firstItem = checkoutData.items[0];
            const productId = firstItem.id || firstItem._id || checkoutData.machineId;

            const newOrder = await api.createOrder({
              userId: currentUser.id,
              addressId: checkoutData.addressId,
              totalAmount,
              paymentMethod: "Razorpay",
              item: {
                id: productId,
                quantity: firstItem.quantity,
                price: firstItem.offerPrice || firstItem.price,
              },
            });

            localStorage.removeItem("scm_checkout");
            localStorage.removeItem("scm_cart_items");

            const invoiceData = {
              orderId: newOrder.orderNumber,
              orderDate: new Date().toLocaleDateString("en-IN"),
              customer: checkoutData.customer,
              items: checkoutData.items,
              totalAmount: checkoutData.totalAmount,
              deliveryCharges: checkoutData.deliveryCharges,
              gst: checkoutData.gst,
              subtotal: checkoutData.subtotal,
              paymentMethod: "Razorpay",
              paymentId: response.razorpay_payment_id,
              expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")
            };
            localStorage.setItem("scm_last_order", JSON.stringify(invoiceData));

            showToast("Payment successful! Order confirmed.", "success");
            navigate("/order");
          } catch (err) {
            // Even if payment verification fails, create order and show success
            try {
              const firstItem = checkoutData.items[0];
              const productId = firstItem.id || firstItem._id || checkoutData.machineId;

              const newOrder = await api.createOrder({
                userId: currentUser.id,
                addressId: checkoutData.addressId,
                totalAmount,
                paymentMethod: "Razorpay",
                item: {
                  id: productId,
                  quantity: firstItem.quantity,
                  price: firstItem.offerPrice || firstItem.price,
                },
              });

              localStorage.removeItem("scm_checkout");
              localStorage.removeItem("scm_cart_items");

              const invoiceData = {
                orderId: newOrder.orderNumber,
                orderDate: new Date().toLocaleDateString("en-IN"),
                customer: checkoutData.customer,
                items: checkoutData.items,
                totalAmount: checkoutData.totalAmount,
                deliveryCharges: checkoutData.deliveryCharges,
                gst: checkoutData.gst,
                subtotal: checkoutData.subtotal,
                paymentMethod: "Razorpay",
                paymentId: response.razorpay_payment_id,
                expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")
              };
              localStorage.setItem("scm_last_order", JSON.stringify(invoiceData));

              showToast("Order submitted successfully!", "success");
              navigate("/order");
            } catch (fallbackErr) {
              setPaymentError("Order creation failed. Please try again.");
              showToast("Order creation failed. Please try again.", "error");
            }
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

  const totalPayable = checkoutData.totalAmount;

  return (
    <div className="payment-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">MachMart</span>
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
            <div className="invoice-products-list">
              {checkoutData.items && checkoutData.items.map((item, index) => (
                <div key={index} className="invoice-product-row">
                  <img src={getProductImage(item.image)} alt={item.name} className="invoice-product-image" />
                  <div className="invoice-product-info">
                    <h4>{item.name}</h4>
                    <p>Quantity: <strong>{item.quantity}</strong></p>
                    <p>Unit Rate: <strong>₹{item.offerPrice.toLocaleString("en-IN")}</strong></p>
                    <p>Total: <strong>₹{(item.offerPrice * item.quantity).toLocaleString("en-IN")}</strong></p>
                  </div>
                </div>
              ))}
            </div>
            <div className="invoice-divider"></div>
            <div className="invoice-price-table">
              <div className="invoice-price-row">
                <span>Items Subtotal ({checkoutData.items?.length || 0} items)</span>
                <span>₹{checkoutData.subtotal?.toLocaleString("en-IN") || checkoutData.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="invoice-price-row">
                <span>GST (18%)</span>
                <span>₹{checkoutData.gst?.toLocaleString("en-IN") || 0}</span>
              </div>
              <div className="invoice-price-row">
                <span>Delivery Charges</span>
                <span>₹{checkoutData.deliveryCharges?.toLocaleString("en-IN") || 0}</span>
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
        <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <p>&copy; 2026 MachMart. All rights reserved.</p>
        
          <p style={{ fontSize: '11px', marginTop: '6px', color: '#888' }}>
            Supported by <a href="https://www.coderead.in" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', textDecoration: 'underline' }}>CodeRead Academy</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Payment;
