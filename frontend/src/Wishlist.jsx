import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";

function Wishlist() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch wishlist
      setWishlistItems([]);
    } catch (err) {
      showToast("Failed to load wishlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      // TODO: Implement API call to remove from wishlist
      showToast("Removed from wishlist", "success");
      loadWishlist();
    } catch (err) {
      showToast("Failed to remove from wishlist", "error");
    }
  };

  const addToCart = async (productId) => {
    try {
      // TODO: Implement API call to add to cart
      showToast("Added to cart", "success");
    } catch (err) {
      showToast("Failed to add to cart", "error");
    }
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <button className="btn-back" onClick={() => navigate("/home")}>
          Back to Products
        </button>
      </div>

      {loading ? (
        <p>Loading wishlist...</p>
      ) : wishlistItems.length === 0 ? (
        <div className="empty-state">
          <p>Your wishlist is empty</p>
          <button className="btn-primary" onClick={() => navigate("/home")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {/* TODO: Render wishlist items */}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
