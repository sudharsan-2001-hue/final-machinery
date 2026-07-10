import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

function Cart() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch cart
      setCartItems([]);
      setTotalAmount(0);
    } catch (err) {
      showToast("Failed to load cart", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId, quantity) => {
    try {
      // TODO: Implement API call to update quantity
      loadCart();
    } catch (err) {
      showToast("Failed to update quantity", "error");
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      // TODO: Implement API call to remove from cart
      showToast("Removed from cart", "success");
      loadCart();
    } catch (err) {
      showToast("Failed to remove from cart", "error");
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button className="btn-back" onClick={() => navigate("/home")}>
          Continue Shopping
        </button>
      </div>

      {loading ? (
        <p>Loading cart...</p>
      ) : cartItems.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty</p>
          <button className="btn-primary" onClick={() => navigate("/home")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {/* TODO: Render cart items */}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>GST (18%)</span>
              <span>₹{(totalAmount * 0.18).toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{(totalAmount * 1.18).toLocaleString()}</span>
            </div>
            <button
              className="btn-primary checkout-btn"
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
