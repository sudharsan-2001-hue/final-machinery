import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

function ProductUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    description: "",
    specifications: "",
    originalPrice: "",
    discountPercent: "0",
    brand: "",
    modelNumber: "",
    weight: "",
    dimensions: "",
    warranty: "",
    images: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    // TODO: Implement image upload logic
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: [...formData.images, ...files] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement API call to upload product
      showToast("Product uploaded successfully!");
      navigate("/seller-dashboard");
    } catch (err) {
      showToast("Failed to upload product", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-upload-container">
      <div className="upload-header">
        <h1>Upload New Product</h1>
        <button className="btn-back" onClick={() => navigate("/seller-dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="CAT001">Cotton Ginning Machinery</option>
              <option value="CAT002">Cotton Spinning Machinery</option>
              <option value="CAT003">Machine Oils & Lubricants</option>
              <option value="CAT004">Cotton Pressing Machinery</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter product description"
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Specifications</h3>
          <div className="form-group">
            <label>Specifications</label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              placeholder="Enter technical specifications"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Enter brand name"
            />
          </div>
          <div className="form-group">
            <label>Model Number</label>
            <input
              type="text"
              name="modelNumber"
              value={formData.modelNumber}
              onChange={handleChange}
              placeholder="Enter model number"
            />
          </div>
          <div className="form-group">
            <label>Weight</label>
            <input
              type="text"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Enter weight"
            />
          </div>
          <div className="form-group">
            <label>Dimensions</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="Enter dimensions (LxWxH)"
            />
          </div>
          <div className="form-group">
            <label>Warranty</label>
            <input
              type="text"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              placeholder="Enter warranty period"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing</h3>
          <div className="form-group">
            <label>Original Price (₹) *</label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter original price"
            />
          </div>
          <div className="form-group">
            <label>Discount Percent (%)</label>
            <input
              type="number"
              name="discountPercent"
              value={formData.discountPercent}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter discount percentage"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Product Images</h3>
          <div className="form-group">
            <label>Upload Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
            <p className="help-text">Upload multiple images of the product</p>
          </div>
          {formData.images.length > 0 && (
            <div className="image-preview">
              <p>{formData.images.length} image(s) selected</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/seller-dashboard")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductUpload;
