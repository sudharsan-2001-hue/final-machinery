import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Page Components
import Login from "./login";
import ChangePassword from "./ChangePassword";
import Home from "./home";
import Price from "./price";
import Buy from "./buy";
import Address from "./address";
import Payment from "./payment";
import Order from "./order";
import OutOfStock from "./outofstock";
import Wishlist from "./Wishlist";
import Cart from "./Cart";
import Checkout from "./Checkout";
import OrderTracking from "./OrderTracking";
import AdminHome from "./adminhome";
import AvailableStock from "./availablestock";
import MachineryUpload from "./machineryupload";
import ShopOrders from "./shoporders";
import AdminComplaints from "./admincomplaints";
import CustomerComplaints from "./customercomplaints";
import ShopRegistration from "./shopregistration";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this tab session
    const splashShown = sessionStorage.getItem("scm_splash_shown");
    if (splashShown) {
      setShowSplash(false);
      return;
    }

    const timer = setTimeout(() => {
      setFadeSplash(true);
      const unmountTimer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("scm_splash_shown", "true");
      }, 600); // match CSS fade-out transition
      return () => clearTimeout(unmountTimer);
    }, 2200); // Show splash for 2.2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <div className={`splash-container ${fadeSplash ? "fade-out" : ""}`}>
          <div className="splash-content">
            <div className="splash-logo-wrapper">
              <img src="/logo.jpeg" alt="Sudharsan Logo" className="splash-logo" />
            </div>
            <h1 className="splash-brand-title">MachMart</h1>
            <p className="splash-brand-subtitle">Quality & Innovation in Machinery</p>
          </div>
          <div className="splash-footer">
            <span className="splash-footer-label">from</span>
            <span className="splash-footer-company">SUDHARSAN GROUP</span>
          </div>
        </div>
      )}
      <BrowserRouter>
      <Routes>
        {/* Public Routes - No login required */}
        <Route path="/" element={<Price />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Customer Routes - Login required for these */}
        <Route path="/home" element={<ProtectedRoute allowedRoles={["customer", "shopadmin"]}><Home /></ProtectedRoute>} />
        <Route path="/price" element={<Price />} />
        <Route path="/buy" element={<ProtectedRoute allowedRoles={["customer"]}><Buy /></ProtectedRoute>} />
        <Route path="/outofstock" element={<ProtectedRoute allowedRoles={["customer"]}><OutOfStock /></ProtectedRoute>} />
        <Route path="/address" element={<ProtectedRoute allowedRoles={["customer"]}><Address /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute allowedRoles={["customer"]}><Payment /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute allowedRoles={["customer"]}><Order /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute allowedRoles={["customer"]}><Wishlist /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute allowedRoles={["customer"]}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={["customer"]}><Checkout /></ProtectedRoute>} />
        <Route path="/order-tracking" element={<ProtectedRoute allowedRoles={["customer"]}><OrderTracking /></ProtectedRoute>} />
        <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerComplaints /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/shopregistration" element={<ProtectedRoute allowedRoles={["shopadmin"]}><ShopRegistration /></ProtectedRoute>} />
        <Route path="/adminhome" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AdminHome /></ProtectedRoute>} />
        <Route path="/machineryupload" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><MachineryUpload /></ProtectedRoute>} />
        <Route path="/availablestock" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AvailableStock /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><ShopOrders /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AdminComplaints /></ProtectedRoute>} />

        {/* Fallback to home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;