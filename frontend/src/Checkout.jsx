import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./price.css";

function Checkout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    gst: 0,
    shipping: 0,
    total: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    loadAddresses();
    loadCart();
  }, [navigate]);

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("scm_currentUser"));
      const addr = await api.getAddresses(user.id);
      setAddresses(addr || []);
      if (addr && addr.length > 0) {
        setSelectedAddress(addr[0]);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  };

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
    setCartItems(cart);
    calculateSummary(cart);
  };

  const calculateSummary = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);
    const gst = subtotal * 0.18;
    const shipping = subtotal > 50000 ? 0 : 2000;
    const total = subtotal + gst + shipping;
    setOrderSummary({ subtotal, gst, shipping, total });
  };

  const handleAddAddress = () => {
    navigate("/address");
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Store checkout data and navigate to payment page
    const checkoutData = {
      customer: {
        name: selectedAddress.fullName,
        address: selectedAddress.addressLine1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phoneNumber,
        email: selectedAddress.email
      },
      addressId: selectedAddress.id,
      items: cartItems,
      totalAmount: orderSummary.total,
      deliveryCharges: orderSummary.shipping,
      gst: orderSummary.gst,
      subtotal: orderSummary.subtotal
    };
    
    localStorage.setItem("scm_checkout", JSON.stringify(checkoutData));
    navigate("/payment");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="price-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Checkout</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/cart")}>
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

      <main className="price-main animate-slide">
        <div className="checkout-layout">
          <div className="checkout-left">
            <div className="checkout-section glass-card-base">
              <h3>Delivery Address</h3>
              {addresses.length === 0 ? (
                <div className="no-address">
                  <p>No addresses saved</p>
                  <button className="catalog-add-cart-btn btn-grad-primary" onClick={handleAddAddress}>
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      className={`address-card ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <p><strong>{addr.fullName}</strong></p>
                      <p>{addr.addressLine1}</p>
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p>Phone: {addr.phoneNumber}</p>
                    </div>
                  ))}
                  <button className="catalog-add-cart-btn btn-grad-secondary" onClick={handleAddAddress}>
                    Add New Address
                  </button>
                </div>
              )}
            </div>

            <div className="checkout-section glass-card-base">
              <h3>Order Items</h3>
              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="checkout-item">
                    <img src={getProductImage(item.image)} alt={item.name} />
                    <div className="checkout-item-info">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                      <p>₹{(item.offerPrice * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="checkout-right">
            <div className="checkout-section glass-card-base order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{orderSummary.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>GST (18%)</span>
                <span>₹{orderSummary.gst.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>₹{orderSummary.shipping.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{orderSummary.total.toLocaleString("en-IN")}</span>
              </div>
              <button
                className="catalog-buy-now-btn btn-grad-primary place-order-btn"
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress}
              >
                {loading ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
