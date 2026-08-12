import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import { useToast } from "./components/Toast";
import PasswordInput from "./components/PasswordInput";
import "./shopregistration.css";

function ShopRegistration() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [shopImage, setShopImage] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    
    if (!user || !token || user.role !== "shopadmin") {
      navigate("/");
      return;
    }
    
    // If already registered, redirect to dashboard
    if (user.shopRegistered) {
      navigate("/adminhome");
      return;
    }
    
    setCurrentUser(user);
  }, [navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!shopName || !address) {
      setError("Shop Name and Address are required.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.registerShop(currentUser.shopId, shopName, address, gstNumber, shopImage);
      showToast("Shop registration successful!", "success");
      
      // Update user session with shopRegistered flag
      const updatedUser = { ...currentUser, shopRegistered: true };
      localStorage.setItem("scm_currentUser", JSON.stringify(updatedUser));
      
      navigate("/adminhome");
    } catch (err) {
      setError(err.message || "Shop registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="shop-registration-wrapper">
      <div className="background-decor">
        <div className="glow-sphere sphere1"></div>
        <div className="glow-sphere sphere2"></div>
      </div>

      <div className="shop-registration-card glass-card-base animate-scale">
        <div className="brand-logo">
          <svg className="gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        <h2 className="company-title">Cotton Industry Machinery Store</h2>
        <p className="welcome-text">Complete Your Shop Registration</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="shop-registration-form">
          <div className="input-group">
            <label>Shop Name *</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter your shop name"
              className="glass-input"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Shop Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter complete shop address"
              className="glass-input"
              rows="3"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>GST Number (Optional)</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="Enter GST number"
              className="glass-input"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Shop Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="glass-input"
              disabled={loading}
            />
            {shopImage && (
              <div className="image-preview" style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '200px' }}>
                <img src={shopImage} alt="Shop Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            )}
          </div>

          <button type="submit" className="registration-submit-btn btn-grad-primary" disabled={loading}>
            {loading ? <><span className="spinner-inline"></span>Registering Shop...</> : "Complete Registration"}
          </button>

          <button type="button" className="logout-btn btn-grad-secondary" onClick={handleLogout} disabled={loading}>
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export default ShopRegistration;
