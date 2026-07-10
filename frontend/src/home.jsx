import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./home.css";

function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [featuredMachines, setFeaturedMachines] = useState([]);
  const [showContact, setShowContact] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    // Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadData() {
      try {
        // Get machinery list
        const machinery = await api.getProducts();
        setFeaturedMachines(machinery.slice(0, 4));

        // Get orders list to count user orders
        const orders = await api.getUserOrders(user.id);
        setOrdersCount(orders.length);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    }
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! Your message has been sent to Sudharsan Cottage Machinery. We will get back to you shortly.");
    setShowContact(false);
  };

  if (!currentUser) return null;

  return (
    <div className="home-wrapper">
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
          <h2 className="header-page-title">Home Dashboard</h2>
        </div>
        <div className="header-actions">
          {/* Back button on home redirects to login / logout */}
          <button className="header-back-btn" onClick={handleLogout} title="Go back to login">
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

      {/* Main Content */}
      <main className="home-main animate-slide">
        {/* Hero Banner */}
        <section className="hero-banner glass-card-base">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="hero-badge">Industrial Excellence</span>
            <h1 className="hero-title">High-Performance Cottage Industries Machinery</h1>
            <p className="hero-subtitle">
              Powering small and medium enterprises with state-of-the-art automated manufacturing machinery, pulverizers, and presses.
            </p>
            <button className="hero-cta-btn btn-grad-primary" onClick={() => navigate("/price")}>
              Explore Catalog
            </button>
          </div>
        </section>

        {/* Navigation Cards Grid */}
        <section className="nav-cards-grid">
          <div className="nav-card glass-card-base" onClick={() => navigate("/price")}>
            <div className="nav-card-icon-wrapper blue-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="nav-card-title">Price List</h3>
            <p className="nav-card-desc">Compare machinery prices, offer rates, and check available specifications.</p>
            <span className="nav-card-action">View Catalog →</span>
          </div>

          <div className="nav-card glass-card-base" onClick={() => navigate("/price")}>
            <div className="nav-card-icon-wrapper green-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="nav-card-title">Buy Machinery</h3>
            <p className="nav-card-desc">Instantly purchase equipment with simple quantities check and secure payments.</p>
            <span className="nav-card-action">Order Now →</span>
          </div>

          <div className="nav-card glass-card-base" onClick={() => navigate("/order")}>
            <div className="nav-card-icon-wrapper orange-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3 className="nav-card-title">Track Orders</h3>
            <p className="nav-card-desc">Check shipment status, expected delivery, and download past tax invoices.</p>
            <span className="nav-card-badge-counter">{ordersCount} Active</span>
          </div>

          <div className="nav-card glass-card-base" onClick={() => navigate("/change-password")}>
            <div className="nav-card-icon-wrapper orange-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="nav-card-title">Change Password</h3>
            <p className="nav-card-desc">Update your account password securely.</p>
            <span className="nav-card-action">Update →</span>
          </div>

          <div className="nav-card glass-card-base" onClick={() => setShowContact(true)}>
            <div className="nav-card-icon-wrapper red-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h3 className="nav-card-title">Contact Support</h3>
            <p className="nav-card-desc">Reach out to our customer service desk for customizations and installations.</p>
            <span className="nav-card-action">Send Message →</span>
          </div>
        </section>

        {/* Featured Machinery Grid */}
        <section className="featured-section">
          <div className="featured-header">
            <h2 className="section-title">Featured Machinery</h2>
            <button className="view-all-link" onClick={() => navigate("/price")}>
              View All Products ({featuredMachines.length}) →
            </button>
          </div>

          <div className="featured-grid">
            {featuredMachines.map((machine) => (
              <div
                key={machine.id}
                className="machine-card glass-card-base animate-scale"
                onClick={() => navigate("/price")}
              >
                <div className="machine-img-container">
                  <img src={getProductImage(machine.image)} alt={machine.name} className="machine-image" />
                  <span className="machine-category-badge">{machine.category}</span>
                </div>
                <div className="machine-info">
                  <h4 className="machine-name">{machine.name}</h4>
                  <div className="machine-pricing">
                    <span className="machine-offer-price">₹{machine.offerPrice.toLocaleString("en-IN")}</span>
                    <span className="machine-orig-price">₹{machine.originalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <button className="machine-view-btn btn-grad-primary" onClick={(e) => {
                    e.stopPropagation();
                    navigate("/price");
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Reusable Footer */}
      <footer className="global-footer glass-card-base animate-fade">
        <div className="footer-top">
          <div className="footer-brand">
            <h4>Sudharsan Cottage Machinery</h4>
            <p>High-quality manufacturing, packaging, and processing machinery for cottage industries.</p>
          </div>
          <div className="footer-links">
            <span className="footer-link" onClick={() => navigate("/home")}>Dashboard</span>
            <span className="footer-link" onClick={() => navigate("/price")}>Products</span>
            <span className="footer-link" onClick={() => setShowContact(true)}>Contact</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Sudharsan Cottage Machinery. All rights reserved.</p>
          <p>ISO 9001:2015 Certified Industrial Partner</p>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay animate-fade">
          <div className="contact-modal glass-card-base animate-scale">
            <div className="modal-header">
              <h3>Contact Corporate Office</h3>
              <button className="modal-close-btn" onClick={() => setShowContact(false)}>&times;</button>
            </div>
            <form onSubmit={handleContactSubmit} className="contact-form">
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" className="glass-input" required placeholder="Your Name" />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="glass-input" required placeholder="name@example.com" />
              </div>
              <div className="input-group">
                <label>Message / Machinery Query</label>
                <textarea className="glass-input textarea-field" required rows="4" placeholder="Describe your industrial requirements..."></textarea>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setShowContact(false)}>Cancel</button>
                <button type="submit" className="btn-send btn-grad-primary">Send Query</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;