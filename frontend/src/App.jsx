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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Customer Routes */}
        <Route path="/home" element={<ProtectedRoute allowedRoles={["customer", "shopadmin"]}><Home /></ProtectedRoute>} />
        <Route path="/price" element={<ProtectedRoute allowedRoles={["customer"]}><Price /></ProtectedRoute>} />
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
        <Route path="/adminhome" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AdminHome /></ProtectedRoute>} />
        <Route path="/machineryupload" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><MachineryUpload /></ProtectedRoute>} />
        <Route path="/availablestock" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AvailableStock /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><ShopOrders /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute allowedRoles={["admin", "shopadmin"]}><AdminComplaints /></ProtectedRoute>} />

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;