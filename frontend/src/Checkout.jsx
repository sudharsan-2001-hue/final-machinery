import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  useEffect(() => {
    loadAddresses();
    loadCart();
  }, []);

  const loadAddresses = async () => {
    try {
      // TODO: Implement API call to fetch addresses
      setAddresses([]);
    } catch (err) {
      showToast("Failed to load addresses", "error");
    }
  };

  const loadCart = async () => {
    try {
      // TODO: Implement API call to fetch cart
      setCartItems([]);
      setOrderSummary({ subtotal: 0, gst: 0, shipping: 0, total: 0 });
    } catch (err) {
      showToast("Failed to load cart", "error");
    }
  };

  const handleAddAddress = () => {
    navigate("/address");
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast("Please select a delivery address", "error");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === "razorpay") {
        // TODO: Implement Razorpay payment flow
        showToast("Redirecting to payment...", "success");
      } else {
        showToast("COD not available", "error");
      }
    } catch (err) {
      showToast("Failed to place order", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <button className="btn-back" onClick={() => navigate("/cart")}>
          Back to Cart
        </button>
      </div>

      <div className="checkout-content">
        <div className="checkout-section">
          <h3>Delivery Address</h3>
          {addresses.length === 0 ? (
            <div className="no-address">
              <p>No addresses saved</p>
              <button className="btn-primary" onClick={handleAddAddress}>
                Add Address
              </button>
            </div>
          ) : (
            <div className="address-list">
              {/* TODO: Render address selection */}
              <button className="btn-secondary" onClick={handleAddAddress}>
                Add New Address
              </button>
            </div>
          )}
        </div>

        <div className="checkout-section">
          <h3>Order Items</h3>
          <div className="order-items">
            {/* TODO: Render cart items */}
          </div>
        </div>

        <div className="checkout-section">
          <h3>Payment Method</h3>
          <div className="payment-methods">
            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Razorpay (Online Payment)</span>
            </label>
          </div>
        </div>

        <div className="checkout-section order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{orderSummary.subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>GST (18%)</span>
            <span>₹{orderSummary.gst.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>₹{orderSummary.shipping.toLocaleString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{orderSummary.total.toLocaleString()}</span>
          </div>
          <button
            className="btn-primary place-order-btn"
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddress}
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
