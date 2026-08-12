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
  const [cartCount, setCartCount] = useState(0);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Complaint form state
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    description: "",
    orderId: "",
    complaintType: "General",
    imageUrl: "",
    language: "tamil"
  });
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

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
        // Get all machinery list
        const machinery = await api.getProducts();
        setFeaturedMachines(machinery.slice(0, 4));
      } catch (err) {
        console.error("Error loading products:", err);
        setFeaturedMachines([]);
      }

      try {
        // Get orders list to count user orders
        const orders = await api.getUserOrders(user.id);
        setOrdersCount(orders.length);
      } catch (err) {
        console.error("Error loading orders:", err);
        setOrdersCount(0);
      }

      // Update cart count from localStorage
      const cart = JSON.parse(localStorage.getItem("scm_cart_items")) || [];
      setCartCount(cart.length);
    }
    loadData();
  }, [navigate]);

  // Auto-sliding carousel logic
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(slideInterval);
  }, []);

  const carouselImages = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?w=1920&auto=format&fit=crop"
  ];

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
      alert("Thank you! Your message has been sent to Sudharsan Cottage Machinery. We will get back to you shortly.");
      setContactForm({ name: "", email: "", message: "" });
      setShowContact(false);
    } catch (err) {
      alert("Failed to send message. Please try again.");
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.sendComplaint(
        complaintForm.subject, 
        complaintForm.description, 
        complaintForm.orderId,
        complaintForm.complaintType,
        complaintForm.imageUrl,
        complaintForm.language
      );
      alert("Complaint Accepted! Your complaint has been registered. We will resolve your complaint within 1 day.");
      
      // Play voice confirmation in selected language
      playVoiceMessage(complaintForm.language);
      
      setComplaintForm({ subject: "", description: "", orderId: "", complaintType: "General", imageUrl: "", language: "tamil" });
      setShowComplaintModal(false);
    } catch (err) {
      alert(err.message || "Failed to submit complaint. Please try again.");
    }
  };

  const playVoiceMessage = (language) => {
    if ('speechSynthesis' in window) {
      const isEnglish = language === "english";
      const message = isEnglish
        ? "Hello, Sudharsan Machinery Customer Support. Your complaint has been registered successfully. Our team will review it and contact you soon. Thank you."
        : "வணக்கம். Sudharsan Machinery Customer Support. உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது. எங்கள் குழு விரைவில் அதை பரிசீலித்து உங்களை தொடர்புகொள்ளும். நன்றி.";

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = isEnglish ? 'en-US' : 'ta-IN';
      utterance.rate = isEnglish ? 1.0 : 0.9;
      utterance.pitch = 1;

      // Load voices and set appropriate voice
      const voices = window.speechSynthesis.getVoices();
      if (isEnglish) {
        const englishVoice = voices.find(voice => voice.lang.includes('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      } else {
        const tamilVoice = voices.find(voice => voice.lang.includes('ta'));
        if (tamilVoice) {
          utterance.voice = tamilVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="home-wrapper">
      {/* Top Header */}
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Home Dashboard</h2>
        </div>
        <div className="header-actions">
          {/* Mobile Hamburger Menu */}
          <div className="mobile-menu-icon" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {showMobileMenu ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </div>
          <div className="phone-contact-icon" onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="phone-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {showPhoneDropdown && (
              <div className="phone-dropdown glass-card-base">
                <div className="phone-dropdown-header">
                  <strong>Sudharsan Cottage Machinery</strong>
                </div>
                <div className="phone-dropdown-content">
                  <a href="tel:+917397135792" className="phone-number-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="phone-link-icon">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    +91 73971 35792
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="email-contact-icon" onClick={() => setShowEmailDropdown(!showEmailDropdown)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="email-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {showEmailDropdown && (
              <div className="email-dropdown glass-card-base">
                <div className="email-dropdown-header">
                  <strong>Sudharsan Cottage Machinery</strong>
                </div>
                <div className="email-dropdown-content">
                  <a href="mailto:27gsudharsan@gmail.com" className="email-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="email-link-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    27gsudharsan@gmail.com
                  </a>
                </div>
              </div>
            )}
          </div>
          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="mobile-menu-dropdown glass-card-base">
              <div className="mobile-menu-item" onClick={() => { setShowPhoneDropdown(!showPhoneDropdown); setShowMobileMenu(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mobile-menu-icon-svg">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Call Us</span>
              </div>
              <div className="mobile-menu-item" onClick={() => { setShowEmailDropdown(!showEmailDropdown); setShowMobileMenu(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mobile-menu-icon-svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Email Us</span>
              </div>
              <div className="mobile-menu-item" onClick={() => { setShowComplaintModal(true); setShowMobileMenu(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mobile-menu-icon-svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <span>File Complaint</span>
              </div>
              <div className="mobile-menu-item" onClick={() => { setShowDeliveryDropdown(!showDeliveryDropdown); setShowMobileMenu(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mobile-menu-icon-svg">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Delivery Info</span>
              </div>
              <div className="mobile-menu-item" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mobile-menu-icon-svg">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </div>
            </div>
          )}
          <div className="complaint-icon" onClick={() => setShowComplaintModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="complaint-icon-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <div className="delivery-icon" onClick={() => setShowDeliveryDropdown(!showDeliveryDropdown)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="delivery-icon-svg">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            {showDeliveryDropdown && (
              <div className="delivery-dropdown glass-card-base">
                <div className="delivery-dropdown-header">
                  <strong>Delivery Information</strong>
                </div>
                <div className="delivery-dropdown-content">
                  <div className="delivery-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="delivery-info-icon">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div className="delivery-info-text">
                      <span className="delivery-info-label">Delivery Time</span>
                      <span className="delivery-info-value">3-7 Business Days</span>
                    </div>
                  </div>
                  <div className="delivery-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="delivery-info-icon">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <div className="delivery-info-text">
                      <span className="delivery-info-label">Free Delivery</span>
                      <span className="delivery-info-value">Orders above ₹50,000</span>
                    </div>
                  </div>
                  <div className="delivery-info-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="delivery-info-icon">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <div className="delivery-info-text">
                      <span className="delivery-info-label">Safe Packaging</span>
                      <span className="delivery-info-value">100% Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="header-cart-btn" onClick={() => navigate("/cart")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
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

        {/* Full-width Auto-sliding Carousel */}
        <section className="carousel-section">
          <div className="carousel-container">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${image})` }}
              >
                <div className="carousel-overlay"></div>
              </div>
            ))}
            <div className="carousel-dots">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Special Offer Banner */}
        <section className="special-offer-banner glass-card-base animate-scale">
          <div className="offer-badge">LIMITED TIME OFFER</div>
          <div className="offer-content">
            <div className="offer-text">
              <h3 className="offer-title">Special Discount on Bulk Orders!</h3>
              <p className="offer-subtitle">Get up to 15% off on orders above ₹50,000</p>
              <div className="offer-details">
                <span className="offer-highlight">Free Installation</span>
                <span className="offer-separator">|</span>
                <span className="offer-highlight">1 Year Warranty</span>
                <span className="offer-separator">|</span>
                <span className="offer-highlight">Free Delivery</span>
              </div>
            </div>
            <button className="offer-cta-btn" onClick={() => navigate("/price?offer=true")}>
              Grab Offer
            </button>
          </div>
        </section>

        {/* Navigation Cards Grid */}
        <section className="nav-cards-grid">
          <div className="nav-card glass-card-base" onClick={() => navigate("/price")}>
            <div className="nav-card-icon-wrapper green-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="nav-card-title">Browse Products</h3>
            <p className="nav-card-desc">Explore our machinery catalog, add items to cart, and place orders with secure payments.</p>
            <span className="nav-card-action">Shop Now →</span>
          </div>

          <div className="nav-card glass-card-base" onClick={() => navigate("/order-tracking")}>
            <div className="nav-card-icon-wrapper orange-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3 className="nav-card-title">Order History</h3>
            <p className="nav-card-desc">View all your orders, check status, download invoices, and cancel pending orders.</p>
            <span className="nav-card-badge-counter">{ordersCount} Orders</span>
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

          <div className="nav-card glass-card-base" onClick={() => navigate("/my-complaints")}>
            <div className="nav-card-icon-wrapper purple-grad">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon-svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h3 className="nav-card-title">View Replies</h3>
            <p className="nav-card-desc">View your submitted complaints, check admin responses, and listen to voice replies.</p>
            <span className="nav-card-action">View Replies →</span>
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
            <a href="tel:+917397135792" className="footer-contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="footer-phone-icon">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +91 73971 35792
            </a>
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
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="glass-input" 
                  required 
                  placeholder="name@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Message / Machinery Query</label>
                <textarea 
                  className="glass-input textarea-field" 
                  required 
                  rows="4" 
                  placeholder="Describe your industrial requirements..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setShowContact(false)}>Cancel</button>
                <button type="submit" className="btn-send btn-grad-primary">Send Query</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="modal-overlay animate-fade">
          <div className="contact-modal glass-card-base animate-scale">
            <div className="modal-header">
              <h3>Submit a Complaint</h3>
              <button className="modal-close-btn" onClick={() => setShowComplaintModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleComplaintSubmit} className="contact-form">
              <div className="input-group">
                <label>Order ID (Optional)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Enter Order ID if applicable"
                  value={complaintForm.orderId}
                  onChange={(e) => setComplaintForm({...complaintForm, orderId: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="Brief description of the issue"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Detailed Description</label>
                <textarea 
                  className="glass-input textarea-field" 
                  required 
                  rows="5" 
                  placeholder="Please provide detailed information about your complaint..."
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="input-group">
                <label style={{ fontWeight: 'bold' }}>Voice Language</label>
                <select
                  className="glass-input"
                  value={complaintForm.language}
                  onChange={(e) => setComplaintForm({...complaintForm, language: e.target.value})}
                  style={{ fontWeight: 'bold' }}
                >
                  <option value="tamil" style={{ fontWeight: 'bold' }}>தமிழ் (Tamil)</option>
                  <option value="english" style={{ fontWeight: 'bold' }}>English</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setShowComplaintModal(false)}>Cancel</button>
                <button type="submit" className="btn-send btn-grad-primary">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;