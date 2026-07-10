import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./outofstock.css";

function OutOfStock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const machineId = searchParams.get("id");

  const [currentUser, setCurrentUser] = useState(null);
  const [machine, setMachine] = useState(null);
  const [notified, setNotified] = useState(false);

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
        setMachine(selected);
      } catch (err) {
        console.error("Error fetching product details:", err);
        navigate("/price");
      }
    }
    loadMachine();
  }, [machineId, navigate]);

  const handleNotifyLater = async () => {
    try {
      await api.addNotification(currentUser.email, machine.id);
      setNotified(true);
    } catch (err) {
      alert(err.message || "Failed to submit restock request.");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser || !machine) return null;

  return (
    <div className="oos-wrapper">
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
          <h2 className="header-page-title">Item Unavailable</h2>
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

      {/* Main OOS Content */}
      <main className="oos-main animate-slide">
        <div className="oos-card-container glass-card-base oos-warning-border">
          {/* Warning Icon Banner */}
          <div className="oos-header-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="warning-icon-svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2 className="oos-warning-title">Out of Stock</h2>
          </div>

          <div className="oos-details-row">
            <div className="oos-image-wrapper">
              <img src={getProductImage(machine.image)} alt={machine.name} className="oos-machine-img" />
              <span className="oos-category-tag">{machine.category}</span>
            </div>

            <div className="oos-info-content">
              <h3 className="oos-machine-name">{machine.name}</h3>
              <p className="oos-warning-text">
                We apologize, but this machinery is currently out of stock. Due to high industry demands, our current warehouse allocations for this model have been fully depleted.
              </p>

              <div className="oos-divider"></div>

              {notified ? (
                <div className="oos-success-notification animate-fade">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-dot-svg">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>We will notify you at <strong>{currentUser.email}</strong> as soon as stock is replenished!</span>
                </div>
              ) : (
                <button className="oos-notify-btn btn-grad-secondary" onClick={handleNotifyLater}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="notify-icon-svg">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notify Me When Available
                </button>
              )}

              <button className="oos-catalog-btn btn-grad-primary" onClick={() => navigate("/price")}>
                Return to Product Catalog
              </button>
            </div>
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

export default OutOfStock;
