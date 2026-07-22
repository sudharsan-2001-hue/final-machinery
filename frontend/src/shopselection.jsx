import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./shopselection.css";

function ShopSelection() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadShops() {
      try {
        const shopsData = await api.getShops();
        setShops(shopsData);
      } catch (err) {
        console.error("Error loading shops:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, [navigate]);

  const handleShopSelect = (shop) => {
    localStorage.setItem("scm_selectedShop", JSON.stringify(shop));
    navigate("/home");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="shop-selection-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo">
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Select Shop</h2>
        </div>
        <div className="header-actions">
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

      <main className="shop-selection-main animate-slide">
        <div className="shop-selection-content">
          <h1 className="shop-selection-title">Choose Your Shop</h1>
          <p className="shop-selection-subtitle">Select a shop to browse their machinery products</p>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading shops...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="no-shops-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-shops-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>No shops available at the moment.</p>
            </div>
          ) : (
            <div className="shops-grid">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="shop-card glass-card-base animate-scale"
                  onClick={() => handleShopSelect(shop)}
                >
                  <div className="shop-image-container">
                    <img 
                      src={shop.image || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop"} 
                      alt={shop.name} 
                      className="shop-image"
                    />
                    <span className="shop-status-badge active">Active</span>
                  </div>
                  <div className="shop-info">
                    <h3 className="shop-name">{shop.name}</h3>
                    <p className="shop-description">{shop.description || "Premium industrial machinery for cottage industries"}</p>
                    <button className="shop-select-btn btn-grad-primary">
                      Browse Products →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ShopSelection;
