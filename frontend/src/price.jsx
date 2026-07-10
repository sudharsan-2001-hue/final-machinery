import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./price.css";

function Price() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [machinery, setMachinery] = useState([]);
  const [filteredMachinery, setFilteredMachinery] = useState([]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);

  // Toast / Cart state
  const [cartAlert, setCartAlert] = useState("");

  useEffect(() => {
    // Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadProducts() {
      try {
        const storedMachinery = await api.getProducts();
        setMachinery(storedMachinery);
        setFilteredMachinery(storedMachinery);

        // Extract unique categories
        const cats = ["All", ...new Set(storedMachinery.map((m) => m.category))];
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    }
    loadProducts();
  }, [navigate]);

  // Apply filters whenever search or category changes
  useEffect(() => {
    let result = machinery;

    if (selectedCategory !== "All") {
      result = result.filter((m) => m.category === selectedCategory);
    }

    if (searchTerm.trim() !== "") {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMachinery(result);
  }, [searchTerm, selectedCategory, machinery]);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleAddToCart = (machine) => {
    if (machine.stock === 0) {
      setCartAlert(`Sorry, "${machine.name}" is currently out of stock!`);
      setTimeout(() => setCartAlert(""), 3000);
      return;
    }

    // Add to cart session in LocalStorage
    const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
    const existingIndex = cart.findIndex((item) => item.id === machine.id);

    if (existingIndex > -1) {
      // Check if adding exceeds stock
      if (cart[existingIndex].quantity >= machine.stock) {
        setCartAlert(`Cannot add more. Only ${machine.stock} units are in stock.`);
        setTimeout(() => setCartAlert(""), 3000);
        return;
      }
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...machine, quantity: 1 });
    }

    localStorage.setItem("scm_cart_items", JSON.stringify(cart));
    setCartAlert(`"${machine.name}" added to cart successfully!`);
    setTimeout(() => setCartAlert(""), 3000);
  };

  const handleBuyNow = (machine) => {
    if (machine.stock === 0) {
      // Navigate to Out of Stock Page, passing machine ID in state/search
      navigate(`/outofstock?id=${machine.id}`);
    } else {
      navigate(`/buy?id=${machine.id}`);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="price-wrapper">
      {/* Top Header */}
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Price List Catalog</h2>
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

      {/* Cart Toast Notification */}
      {cartAlert && (
        <div className="cart-toast-alert animate-fade">
          <span>{cartAlert}</span>
        </div>
      )}

      {/* Main content grid */}
      <main className="price-main animate-slide">
        {/* Search and Filters Section */}
        <section className="catalog-filters-bar glass-card-base">
          <div className="search-box-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search machinery catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>&times;</button>
            )}
          </div>

          <div className="category-tabs-wrapper">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Catalog grid */}
        <section className="catalog-grid">
          {filteredMachinery.length > 0 ? (
            filteredMachinery.map((machine) => (
              <div key={machine.id} className="catalog-card glass-card-base animate-scale">
                <div className="catalog-img-wrapper">
                  <img src={getProductImage(machine.image)} alt={machine.name} className="catalog-image" />
                  <span className={`stock-status-badge ${machine.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {machine.stock > 0 ? `In Stock (${machine.stock})` : "Out of Stock"}
                  </span>
                  <span className="catalog-category-tag">{machine.category}</span>
                </div>

                <div className="catalog-info">
                  <h3 className="catalog-item-name">{machine.name}</h3>
                  <p className="catalog-item-desc">{machine.description}</p>
                  
                  <div className="catalog-weight-spec">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-svg" style={{ marginRight: 6 }}>
                      <path d="M20 12V8H4v4c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6z" />
                      <path d="M12 2v6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span>Industrial Weight: <strong>{machine.weight || "N/A"}</strong></span>
                  </div>

                  <div className="catalog-pricing-details">
                    <div className="price-labels">
                      <span className="orig-price-label">M.R.P.</span>
                      <span className="offer-price-label">Special Price</span>
                    </div>
                    <div className="price-values">
                      <span className="orig-price-value">₹{machine.originalPrice.toLocaleString("en-IN")}</span>
                      <span className="offer-price-value">₹{machine.offerPrice.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="catalog-actions-group">
                    <button
                      className="catalog-add-cart-btn btn-grad-secondary"
                      onClick={() => handleAddToCart(machine)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon-svg">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      Add Cart
                    </button>
                    <button
                      className={`catalog-buy-now-btn ${machine.stock > 0 ? "btn-grad-primary" : "btn-oos-style"}`}
                      onClick={() => handleBuyNow(machine)}
                    >
                      {machine.stock > 0 ? "Buy Now" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results-card glass-card-base">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-results-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>No Machinery Found</h3>
              <p>Try searching for different keywords or clear the category filters.</p>
              <button className="btn-grad-secondary reset-filters-btn" onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}>
                Reset Filters
              </button>
            </div>
          )}
        </section>
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

export default Price;