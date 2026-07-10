import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import "./address.css";

function Address() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    // 2. Checkout validation
    const checkout = JSON.parse(localStorage.getItem("scm_checkout"));
    if (!checkout) {
      navigate("/price");
      return;
    }
    setCheckoutData(checkout);

    // 3. Pre-populate with saved address details if exists
    setName(user.username === "customer" ? "Sudharsan G" : user.username);
    setPhone(user.phone || "");
    setEmail(user.email || "");
    setStreetAddress(user.address || "");
    setCity(user.city || "");
    setStateName(user.state || "");
    setPincode(user.pincode || "");
  }, [navigate]);

  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = "Full name is required.";
    
    // Phone validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim()) {
      tempErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone)) {
      tempErrors.phone = "Enter a valid 10-digit mobile number starting with 6-9.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      tempErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Enter a valid email format (e.g. name@example.com).";
    }

    if (!streetAddress.trim()) tempErrors.address = "Shipping address is required.";
    if (!city.trim()) tempErrors.city = "City is required.";
    if (!stateName.trim()) tempErrors.state = "State is required.";

    // Pincode validation (6 digits)
    const pinRegex = /^\d{6}$/;
    if (!pincode.trim()) {
      tempErrors.pincode = "Pincode is required.";
    } else if (!pinRegex.test(pincode)) {
      tempErrors.pincode = "Pincode must be exactly 6 digits.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Always insert address into SQL database to get a valid AddressID
      const savedAddress = await api.addAddress(currentUser.id, {
        fullName: name,
        phone,
        email,
        addressLine1: streetAddress,
        city,
        state: stateName,
        pincode
      });

      const addressDetails = {
        name,
        phone,
        email,
        address: streetAddress,
        city,
        state: stateName,
        pincode
      };

      // Save to checkout configuration in LocalStorage (including database AddressID)
      const updatedCheckout = {
        ...checkoutData,
        addressId: savedAddress.id,
        customer: addressDetails
      };
      localStorage.setItem("scm_checkout", JSON.stringify(updatedCheckout));

      // Save to profile in session user if checked
      if (saveAddress && currentUser) {
        const updatedCurrentUser = {
          ...currentUser,
          phone,
          email,
          address: streetAddress,
          city,
          state: stateName,
          pincode
        };
        localStorage.setItem("scm_currentUser", JSON.stringify(updatedCurrentUser));
      }

      navigate("/payment");
    } catch (err) {
      alert(err.message || "Failed to save address to database.");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleBack = () => {
    if (checkoutData && checkoutData.machineId) {
      navigate(`/buy?id=${checkoutData.machineId}`);
    } else {
      navigate("/price");
    }
  };

  if (!currentUser || !checkoutData) return null;

  return (
    <div className="address-wrapper">
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
          <h2 className="header-page-title">Shipping Address</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={handleBack}>
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

      {/* Main Address Form */}
      <main className="address-main animate-slide">
        <div className="address-container glass-card-base">
          <h2 className="address-form-title">Enter Delivery Details</h2>
          <p className="address-form-subtitle">Please provide your industrial facility shipping destination.</p>

          <form onSubmit={handleNext} className="address-form-grid">
            <div className="form-item span-full">
              <label>Full Name / Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sudharsan Cottage Industries"
                className={`glass-input ${errors.name ? "input-error" : ""}`}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-item">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className={`glass-input ${errors.phone ? "input-error" : ""}`}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-item">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`glass-input ${errors.email ? "input-error" : ""}`}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-item span-full">
              <label>Street Address / Unit Location</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Door No, Industrial Area Road, Colony Name"
                className={`glass-input ${errors.address ? "input-error" : ""}`}
              />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>

            <div className="form-item">
              <label>City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Coimbatore"
                className={`glass-input ${errors.city ? "input-error" : ""}`}
              />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-item">
              <label>State</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className={`glass-input ${errors.state ? "input-error" : ""}`}
              />
              {errors.state && <span className="error-text">{errors.state}</span>}
            </div>

            <div className="form-item">
              <label>Pincode / Postal Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit postal code"
                className={`glass-input ${errors.pincode ? "input-error" : ""}`}
              />
              {errors.pincode && <span className="error-text">{errors.pincode}</span>}
            </div>

            <div className="form-item span-full checkbox-item">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                <span className="checkmark"></span>
                Save this address in my customer profile
              </label>
            </div>

            <div className="form-item span-full form-buttons">
              <button type="button" className="btn-back btn-grad-secondary" onClick={handleBack}>
                Back to Product Configuration
              </button>
              <button type="submit" className="btn-submit btn-grad-primary">
                Proceed to Payment
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
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

export default Address;