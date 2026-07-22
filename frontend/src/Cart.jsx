import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImage } from "./api";
import "./price.css";

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
    setCartItems(cart);
    calculateTotal(cart);
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);
    setTotalAmount(total);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
    const itemIndex = cart.findIndex(item => item.cartItemId === itemId);
    
    if (itemIndex > -1) {
      if (newQuantity > cart[itemIndex].stock) {
        alert(`Cannot exceed available stock of ${cart[itemIndex].stock} units.`);
        return;
      }
      cart[itemIndex].quantity = newQuantity;
      localStorage.setItem("scm_cart_items", JSON.stringify(cart));
      setCartItems(cart);
      calculateTotal(cart);
    }
  };

  const removeFromCart = (itemId) => {
    const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
    const updatedCart = cart.filter(item => item.cartItemId !== itemId);
    localStorage.setItem("scm_cart_items", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    calculateTotal(updatedCart);
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

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
          <h2 className="header-page-title">Shopping Cart</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="price-main animate-slide">
        {cartItems.length === 0 ? (
          <div className="no-results-card glass-card-base">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-results-icon">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h3>Your cart is empty</h3>
            <p>Add products to your cart to continue shopping.</p>
            <button className="btn-grad-secondary reset-filters-btn" onClick={() => navigate("/price")}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="cart-item glass-card-base">
                  <div className="cart-item-image">
                    <img src={getProductImage(item.image)} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-category">{item.category}</p>
                    <div className="cart-item-price">
                      <span className="offer-price">₹{item.offerPrice.toLocaleString("en-IN")}</span>
                      <span className="original-price">₹{item.originalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="cart-item-quantity">
                    <button className="qty-btn minus" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      &minus;
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button className="qty-btn plus" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    <span>₹{(item.offerPrice * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                  <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary glass-card-base">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row">
                <span>GST (18%)</span>
                <span>₹{(totalAmount * 0.18).toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{(totalAmount * 1.18).toLocaleString("en-IN")}</span>
              </div>
              <button className="catalog-buy-now-btn btn-grad-primary checkout-btn" onClick={proceedToCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
