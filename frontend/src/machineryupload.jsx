import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./machineryupload.css";

function MachineryUpload() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Agriculture");
  const [originalPrice, setOriginalPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageType, setImageType] = useState("preset"); // 'preset' or 'upload'
  const [selectedPreset, setSelectedPreset] = useState("m1");
  const [uploadedImageBase64, setUploadedImageBase64] = useState("");
  
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const presetImagesMap = {
    m1: getProductImage("machine1.jpg"),
    m2: getProductImage("machine2.jpg"),
    m3: getProductImage("machine3.jpg"),
    m4: getProductImage("machine4.jpg"),
    m5: getProductImage("machine5.jpg"),
    m6: getProductImage("machine6.jpg"),
    m7: getProductImage("machine7.jpg"),
    m8: getProductImage("machine8.jpg"),
  };

  const categories = [
    "Agriculture",
    "Construction",
    "Packaging",
    "Food Processing",
    "Manufacturing",
    "Textile",
    "Chemical"
  ];

  useEffect(() => {
    // Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // 2MB limit for LocalStorage efficiency
        setErrors((prev) => ({ ...prev, image: "Image file is too large (max 2MB)." }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageBase64(reader.result);
        setErrors((prev) => ({ ...prev, image: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = "Machine name is required.";
    if (!description.trim()) tempErrors.description = "Description is required.";
    
    const orig = Number(originalPrice);
    const offer = Number(offerPrice);
    const qty = Number(stock);

    if (!originalPrice || orig <= 0) {
      tempErrors.originalPrice = "Enter a valid original price.";
    }
    if (!offerPrice || offer <= 0) {
      tempErrors.offerPrice = "Enter a valid offer price.";
    } else if (offer > orig) {
      tempErrors.offerPrice = "Offer price cannot exceed original market rate.";
    }

    if (stock === "" || qty < 0) {
      tempErrors.stock = "Stock level cannot be negative.";
    }

    if (imageType === "upload" && !uploadedImageBase64) {
      tempErrors.image = "Please choose a file to upload.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!validateForm()) return;

    // Resolve Image source: map preset key (e.g. m1) to machine1.jpg filename
    const imageSource = imageType === "preset" ? `machine${selectedPreset.slice(1)}.jpg` : uploadedImageBase64;

    try {
      await api.addProduct({
        name,
        description,
        originalPrice: Number(originalPrice),
        offerPrice: Number(offerPrice),
        stock: Number(stock),
        category,
        image: imageSource
      });

      setSuccessMsg(`"${name}" was successfully registered in the catalog database.`);
      
      // Clear inputs
      setName("");
      setDescription("");
      setOriginalPrice("");
      setOfferPrice("");
      setStock("");
      setUploadedImageBase64("");
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to register product." }));
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  const getPreviewSrc = () => {
    return imageType === "preset" ? presetImagesMap[selectedPreset] : uploadedImageBase64;
  };

  return (
    <div className="upload-wrapper">
      {/* Global Header */}
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/adminhome")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title admin-title-badge">Register Product</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/adminhome")}>
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

      {/* Main Upload console */}
      <main className="upload-main animate-slide">
        <div className="upload-container-card glass-card-base">
          <h2 className="upload-form-title">Upload Machinery Details</h2>
          <p className="upload-form-subtitle">Register new equipment models for clients to purchase.</p>

          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSave} className="upload-form-grid">
            <div className="form-item span-full">
              <label>Machine Name / Model Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. High-Pressure Wire Nail Making Machine"
                className={`glass-input ${errors.name ? "input-error" : ""}`}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-item span-full">
              <label>Machine Description & Technical Specifications</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify dimensions, production capacity, motor strength, and raw materials supported..."
                rows="4"
                className={`glass-input textarea-field ${errors.description ? "input-error" : ""}`}
              ></textarea>
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="form-item">
              <label>Machinery Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input select-field"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="select-option-style">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-item">
              <label>Stock Allocation Quantity</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Units available in warehouse"
                className={`glass-input ${errors.stock ? "input-error" : ""}`}
              />
              {errors.stock && <span className="error-text">{errors.stock}</span>}
            </div>

            <div className="form-item">
              <label>Original Price (Market Value INR)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Market Price in Rupees"
                className={`glass-input ${errors.originalPrice ? "input-error" : ""}`}
              />
              {errors.originalPrice && <span className="error-text">{errors.originalPrice}</span>}
            </div>

            <div className="form-item">
              <label>Offer Price (Catalog Rate INR)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Discounted Offer Price in Rupees"
                className={`glass-input ${errors.offerPrice ? "input-error" : ""}`}
              />
              {errors.offerPrice && <span className="error-text">{errors.offerPrice}</span>}
            </div>

            {/* Image selection selector */}
            <div className="form-item span-full">
              <label>Image Source Selection</label>
              <div className="image-mode-tabs">
                <button
                  type="button"
                  className={`image-tab-btn ${imageType === "preset" ? "active" : ""}`}
                  onClick={() => setImageType("preset")}
                >
                  Choose Preset Image
                </button>
                <button
                  type="button"
                  className={`image-tab-btn ${imageType === "upload" ? "active" : ""}`}
                  onClick={() => setImageType("upload")}
                >
                  Upload Local File
                </button>
              </div>
            </div>

            {imageType === "preset" ? (
              <div className="form-item span-full">
                <label>Select Preset Machinery Photo</label>
                <div className="presets-images-grid">
                  {Object.keys(presetImagesMap).map((key, index) => (
                    <div
                      key={key}
                      className={`preset-img-tile ${selectedPreset === key ? "active" : ""}`}
                      onClick={() => setSelectedPreset(key)}
                    >
                      <img src={presetImagesMap[key]} alt={`Machine preset ${index + 1}`} />
                      <span className="preset-number-pill">Photo {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="form-item span-full">
                <label>Upload Machinery Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`glass-input file-input ${errors.image ? "input-error" : ""}`}
                />
                {errors.image && <span className="error-text">{errors.image}</span>}
              </div>
            )}

            {/* Product Image Preview */}
            <div className="form-item span-full image-preview-wrapper">
              <span className="preview-label-text">Product Preview Banner</span>
              <div className="image-preview-card">
                {getPreviewSrc() ? (
                  <img src={getPreviewSrc()} alt="Preview" className="preview-element" />
                ) : (
                  <div className="empty-preview-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-preview-icon">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>No image selected for preview.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-item span-full form-buttons">
              <button type="button" className="btn-back btn-grad-secondary" onClick={() => navigate("/adminhome")}>
                Back to Dashboard
              </button>
              <button type="submit" className="btn-submit btn-grad-primary">
                Save / Register Machinery
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
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
            <p>Administrative Control Dashboard Panel.</p>
          </div>
          <div className="footer-links">
            <span className="footer-link" onClick={() => navigate("/adminhome")}>Dashboard</span>
            <span className="footer-link" onClick={() => navigate("/machineryupload")}>Upload</span>
            <span className="footer-link" onClick={() => navigate("/availablestock")}>Stock Table</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Sudharsan Cottage Machinery. All rights reserved.</p>
          <p>ISO 9001:2015 Certified System</p>
        </div>
      </footer>
    </div>
  );
}

export default MachineryUpload;
