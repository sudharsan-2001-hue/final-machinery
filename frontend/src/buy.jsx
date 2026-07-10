import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./buy.css";

function Buy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const machineId = searchParams.get("id");

  const [currentUser, setCurrentUser] = useState(null);
  const [machine, setMachine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errorAlert, setErrorAlert] = useState("");

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    // 2. Fetch machine details
    if (!machineId) {
      navigate("/price");
      return;
    }

    async function loadMachine() {
      try {
        const selected = await api.getProductById(machineId);
        if (!selected) {
          navigate("/price");
          return;
        }

        // 3. Out-of-stock auto-redirection
        if (selected.stock <= 0) {
          navigate(`/outofstock?id=${selected.id}`);
          return;
        }

        setMachine(selected);
      } catch (err) {
        console.error("Error loading machine details:", err);
        navigate("/price");
      }
    }
    loadMachine();
  }, [machineId, navigate]);

  const handleQuantityChange = (val) => {
    setErrorAlert("");
    const newQty = quantity + val;

    if (newQty < 1) return;
    if (newQty > machine.stock) {
      setErrorAlert(`Cannot exceed available stock of ${machine.stock} units.`);
      return;
    }

    setQuantity(newQty);
  };

  const handleProceedToAddress = () => {
    if (!machine) return;

    // Save active checkout config in LocalStorage
    const checkoutData = {
      machineId: machine.id,
      name: machine.name,
      image: machine.image,
      quantity: quantity,
      offerPrice: machine.offerPrice,
      originalPrice: machine.originalPrice,
      totalAmount: machine.offerPrice * quantity,
      weight: machine.weight
    };

    localStorage.setItem("scm_checkout", JSON.stringify(checkoutData));
    navigate("/address");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser || !machine) return null;

  const subtotal = machine.offerPrice * quantity;

  return (
    <div className="buy-wrapper">
      {/* Global Header */}
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Configure Order</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/price")}>
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

      {/* Main Buy Box */}
      <main className="buy-main animate-slide">
        <div className="buy-layout-grid">
          {/* Left: Product Images and Badge Details */}
          <div className="buy-product-gallery glass-card-base">
            <span className="buy-category-badge">{machine.category}</span>
            <img src={getProductImage(machine.image)} alt={machine.name} className="buy-main-image" />
            <div className="stock-info-tag">
              <div className="stock-dot"></div>
              <span>Only {machine.stock} units left in warehouse</span>
            </div>
          </div>

          {/* Right: Pricing configuration */}
          <div className="buy-config-details glass-card-base">
            <h1 className="buy-product-title">{machine.name}</h1>
            <p className="buy-product-description">{machine.description}</p>

            <div className="buy-divider"></div>

            <div className="buy-pricing-section">
              <div className="buy-price-item">
                <span className="buy-price-label">Industrial Weight</span>
                <span className="buy-price-value" style={{ color: "#f59e0b", fontWeight: 700 }}>{machine.weight || "N/A"}</span>
              </div>
              <div className="buy-price-item">
                <span className="buy-price-label">Regular Market Rate</span>
                <span className="buy-price-value original">₹{machine.originalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="buy-price-item">
                <span className="buy-price-label text-green">Special Offer Rate</span>
                <span className="buy-price-value offer">₹{machine.offerPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="buy-divider"></div>

            {/* Quantity Selector Section */}
            <div className="buy-quantity-selector-container">
              <span className="qty-label">Select Quantity</span>
              <div className="qty-controls-row">
                <div className="qty-counter-box">
                  <button className="qty-btn minus" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                    &minus;
                  </button>
                  <span className="qty-number-display">{quantity}</span>
                  <button className="qty-btn plus" onClick={() => handleQuantityChange(1)}>
                    +
                  </button>
                </div>
                <span className="stock-level-indicator">({machine.stock} units available)</span>
              </div>
              {errorAlert && <p className="qty-error-message">{errorAlert}</p>}
            </div>

            <div className="buy-divider"></div>

            {/* Subtotal Display */}
            <div className="buy-summary-subtotal">
              <span className="subtotal-label">Subtotal ({quantity} {quantity === 1 ? "unit" : "units"})</span>
              <span className="subtotal-value">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            <button className="buy-proceed-checkout-btn btn-grad-primary" onClick={handleProceedToAddress}>
              Proceed to Shipping
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="checkout-btn-icon">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="global-footer glass-card-base animate-fade">
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

export default Buy;