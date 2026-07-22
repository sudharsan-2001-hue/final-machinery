import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getProductImage, clearSession } from "./api";
import "./availablestock.css";

function AvailableStock() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [machinery, setMachinery] = useState([]);
  const [filteredMachinery, setFilteredMachinery] = useState([]);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Available', 'OutOfStock'
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [categories, setCategories] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Edit Modal states
  const [isEditing, setIsEditing] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editOfferPrice, setEditOfferPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!user || (user.role !== "admin" && user.role !== "shopadmin")) {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    // 2. Fetch stock
    fetchMachineryList();
  }, [navigate]);

  const fetchMachineryList = async () => {
    try {
      const list = await api.getProducts();
      setMachinery(list);
      setFilteredMachinery(list);

      // Extract categories
      const cats = ["All", ...new Set(list.map((m) => m.category))];
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching stock machinery list:", err);
    }
  };

  // Apply Search, Filters, and Reset Page
  useEffect(() => {
    let result = machinery;

    // Search Name Filter
    if (searchTerm.trim() !== "") {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category Filter
    if (categoryFilter !== "All") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    // Status Filter
    if (statusFilter === "Available") {
      result = result.filter((m) => m.stock > 0);
    } else if (statusFilter === "OutOfStock") {
      result = result.filter((m) => m.stock <= 0);
    }

    setFilteredMachinery(result);
    setCurrentPage(1); // Reset to first page
  }, [searchTerm, statusFilter, categoryFilter, machinery]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMachinery.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMachinery.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Delete Action
  const handleDelete = async (machine) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${machine.name}" from the system catalog? This cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        await api.deleteProduct(machine.id);
        fetchMachineryList();
      } catch (err) {
        alert(err.message || "Failed to delete product.");
      }
    }
  };

  // Edit Action (Open Modal)
  const handleOpenEdit = (machine) => {
    setEditMachine(machine);
    setEditName(machine.name);
    setEditDescription(machine.description);
    setEditCategory(machine.category);
    setEditOriginalPrice(machine.originalPrice);
    setEditOfferPrice(machine.offerPrice);
    setEditStock(machine.stock);
    setEditErrors({});
    setIsEditing(true);
  };

  const validateEditForm = () => {
    const tempErrors = {};
    if (!editName.trim()) tempErrors.name = "Name is required.";
    if (!editDescription.trim()) tempErrors.description = "Description is required.";
    
    const orig = Number(editOriginalPrice);
    const offer = Number(editOfferPrice);
    const qty = Number(editStock);

    if (!editOriginalPrice || orig <= 0) {
      tempErrors.originalPrice = "Enter a valid original price.";
    }
    if (!editOfferPrice || offer <= 0) {
      tempErrors.offerPrice = "Enter a valid offer price.";
    } else if (offer > orig) {
      tempErrors.offerPrice = "Offer price cannot exceed original rate.";
    }

    if (editStock === "" || qty < 0) {
      tempErrors.stock = "Stock level cannot be negative.";
    }

    setEditErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      await api.updateProduct(editMachine.id, {
        name: editName,
        description: editDescription,
        category: editCategory,
        originalPrice: Number(editOriginalPrice),
        offerPrice: Number(editOfferPrice),
        stock: Number(editStock)
      });

      setIsEditing(false);
      setEditMachine(null);
      fetchMachineryList();
    } catch (err) {
      alert(err.message || "Failed to update product details.");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="stock-wrapper">
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
          <h2 className="header-page-title admin-title-badge">Stock Management</h2>
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

      {/* Main Stock Table console */}
      <main className="stock-main animate-slide">
        {/* Search and Filters Bar */}
        <section className="stock-filters-bar glass-card-base">
          <div className="search-box-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by machinery model name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>&times;</button>
            )}
          </div>

          <div className="stock-dropdown-filters">
            <div className="filter-dropdown-group">
              <label>Category:</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="stock-select">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-dropdown-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="stock-select">
                <option value="All">All Statuses</option>
                <option value="Available">Available (In Stock)</option>
                <option value="OutOfStock">Out of Stock</option>
              </select>
            </div>
          </div>
        </section>

        {/* Database Stock Grid/Table */}
        <section className="stock-list-sheet glass-card-base">
          {currentItems.length > 0 ? (
            <div className="table-responsive">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Machine Model Name</th>
                    <th>Category</th>
                    <th className="text-center">Original Price</th>
                    <th className="text-center">Offer Price</th>
                    <th className="text-center">Stock Level</th>
                    <th className="text-center">Warehouse Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <img src={getProductImage(m.image)} alt={m.name} className="table-row-img" />
                      </td>
                      <td>
                        <div className="table-name-desc">
                          <strong>{m.name}</strong>
                          <p>{m.description.substring(0, 50)}...</p>
                        </div>
                      </td>
                      <td><span className="category-tag-style">{m.category}</span></td>
                      <td className="text-center text-through">₹{m.originalPrice.toLocaleString("en-IN")}</td>
                      <td className="text-center text-green">₹{m.offerPrice.toLocaleString("en-IN")}</td>
                      <td className="text-center"><strong>{m.stock} Units</strong></td>
                      <td className="text-center">
                        <span className={`status-badge-pill ${m.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                          {m.stock > 0 ? "Available" : "Out Of Stock"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="action-btns-row">
                          <button className="btn-edit-stock" onClick={() => handleOpenEdit(m)} title="Edit specifications">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-icon">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="btn-delete-stock" onClick={() => handleDelete(m)} title="Delete machinery">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-icon">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-stock-grid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>No Stock Profiles Registered</h3>
              <p>No products match your active search terms or category parameters.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                className="page-nav-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &larr; Prev
              </button>
              <div className="page-numbers-row">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-num-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="page-nav-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Edit Machine Glass Modal */}
      {isEditing && editMachine && (
        <div className="modal-overlay animate-fade">
          <div className="edit-modal-card glass-card-base animate-scale">
            <div className="modal-header">
              <h3>Edit Machinery Specifications</h3>
              <button className="modal-close-btn" onClick={() => setIsEditing(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="edit-form-grid">
              <div className="form-item span-full">
                <label>Machine Model Title</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`glass-input ${editErrors.name ? "input-error" : ""}`}
                />
                {editErrors.name && <span className="error-text">{editErrors.name}</span>}
              </div>

              <div className="form-item span-full">
                <label>Technical Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className={`glass-input textarea-field ${editErrors.description ? "input-error" : ""}`}
                ></textarea>
                {editErrors.description && <span className="error-text">{editErrors.description}</span>}
              </div>

              <div className="form-item">
                <label>Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="glass-input select-field"
                >
                  <option value="Agriculture">Agriculture</option>
                  <option value="Construction">Construction</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Food Processing">Food Processing</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Textile">Textile</option>
                  <option value="Chemical">Chemical</option>
                </select>
              </div>

              <div className="form-item">
                <label>Stock quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className={`glass-input ${editErrors.stock ? "input-error" : ""}`}
                />
                {editErrors.stock && <span className="error-text">{editErrors.stock}</span>}
              </div>

              <div className="form-item">
                <label>Original Price (INR)</label>
                <input
                  type="number"
                  value={editOriginalPrice}
                  onChange={(e) => setEditOriginalPrice(e.target.value)}
                  className={`glass-input ${editErrors.originalPrice ? "input-error" : ""}`}
                />
                {editErrors.originalPrice && <span className="error-text">{editErrors.originalPrice}</span>}
              </div>

              <div className="form-item">
                <label>Offer Price (INR)</label>
                <input
                  type="number"
                  value={editOfferPrice}
                  onChange={(e) => setEditOfferPrice(e.target.value)}
                  className={`glass-input ${editErrors.offerPrice ? "input-error" : ""}`}
                />
                {editErrors.offerPrice && <span className="error-text">{editErrors.offerPrice}</span>}
              </div>

              <div className="modal-buttons span-full">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-send btn-grad-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AvailableStock;