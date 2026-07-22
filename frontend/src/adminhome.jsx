import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import "./adminhome.css";

function AdminHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Stats states
  const [stats, setStats] = useState({
    totalMachines: 0,
    availableStock: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const refreshDashboard = () => {
    setLoading(true);
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

  // Listen for dashboard refresh trigger from other pages
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'scm_dashboard_refresh') {
        refreshDashboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // 1. Session validation
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || (user.role !== "admin" && user.role !== "shopadmin")) {
      navigate("/");
      return;
    }
    setCurrentUser(user);

    async function loadDashboard() {
      try {
        console.log("Loading dashboard data...");
        
        const metrics = await api.getAdminMetrics();
        console.log("Metrics API response:", metrics);

        const orders = await api.getOrders();
        console.log("Orders API response:", orders);

        const products = await api.getProducts();
        console.log("Products API response:", products);

        const availableStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
        
        // Calculate stats from orders directly
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(ord => (ord.status || ord.OrderStatus) === 'Pending').length;
        const completedOrders = orders.filter(ord => (ord.status || ord.OrderStatus) === 'Delivered').length;
        
        // Calculate revenue from completed/delivered orders only
        const completedOrderAmounts = orders
          .filter(ord => (ord.status || ord.OrderStatus) === 'Delivered')
          .map(ord => ord.totalAmount || ord.TotalAmount || 0);
        const totalRevenue = completedOrderAmounts.reduce((sum, amount) => sum + Number(amount), 0);

        // Load contact messages
        const messages = await api.getContactMessages();
        setContactMessages(messages || []);

        // Play notification sound and show alert if new messages arrived
        if (messages.length > previousMessageCount && previousMessageCount > 0) {
          const newMessage = messages[0]; // Most recent message
          playNotificationSound();
          showNotificationAlert(newMessage);
        }
        setPreviousMessageCount(messages.length);

        console.log("Dashboard - Calculated stats:", {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          availableStock,
          totalMachines: products.length
        });

        setStats({
          totalMachines: products.length,
          availableStock: availableStock,
          totalOrders: totalOrders,
          pendingOrders: pendingOrders,
          completedOrders: completedOrders,
          totalRevenue: totalRevenue
        });

        // Set recent orders list (already sorted by newest on backend)
        setRecentOrders(orders.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
      }
    }
    loadDashboard();
  }, [navigate, refreshKey]);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.error("Error playing notification sound:", err);
    }
  };

  const showNotificationAlert = (message) => {
    const currentTime = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    const customerName = message.CustomerName || "Unknown";
    const messageText = message.Message || "";
    
    // Extract machine name from message if possible
    let machineName = "General Enquiry";
    const machineKeywords = ["Oil Press", "Grinder", "Machine", "Machinery", "Press", "Crusher", "Mill"];
    for (const keyword of machineKeywords) {
      if (messageText.toLowerCase().includes(keyword.toLowerCase())) {
        machineName = keyword;
        break;
      }
    }

    const alertMessage = `🔔 New enquiry received\nFrom : ${customerName}\nMachine : ${machineName}\nTime : ${currentTime}`;
    alert(alertMessage);
  };

  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.markMessageAsRead(messageId);
      // Refresh messages
      const messages = await api.getContactMessages();
      setContactMessages(messages || []);
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleOutsideClick = (e) => {
    if (!e.target.closest('.notification-bell') && !e.target.closest('.notification-dropdown')) {
      setShowNotificationDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="admin-wrapper">
        <header className="global-header glass-card-base animate-fade">
          <div className="header-logo" onClick={() => navigate("/adminhome")}>
            <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="header-brand-text">Sudharsan Cottage Machinery</span>
          </div>
          <div className="header-title-container">
            <h2 className="header-page-title admin-title-badge">Admin Dashboard</h2>
          </div>
        </header>
        <main className="admin-main animate-slide">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-wrapper">
        <header className="global-header glass-card-base animate-fade">
          <div className="header-logo" onClick={() => navigate("/adminhome")}>
            <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="header-brand-text">Sudharsan Cottage Machinery</span>
          </div>
          <div className="header-title-container">
            <h2 className="header-page-title admin-title-badge">Admin Dashboard</h2>
          </div>
        </header>
        <main className="admin-main animate-slide">
          <div className="error-message">
            <p>Error loading dashboard: {error}</p>
            <button onClick={refreshDashboard} className="btn-grad-primary">Retry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
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
          <h2 className="header-page-title admin-title-badge">Admin Dashboard</h2>
        </div>
        <div className="header-actions">
          <div className="notification-bell" onClick={() => handleNotificationClick()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="bell-icon">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {contactMessages.filter(msg => !msg.IsRead).length > 0 && (
              <span className="notification-badge">
                {contactMessages.filter(msg => !msg.IsRead).length}
              </span>
            )}
            {showNotificationDropdown && (
              <div className="notification-dropdown glass-card-base">
                <div className="notification-header">
                  <h4>Customer Messages</h4>
                  <span className="notification-count">{contactMessages.length} total</span>
                </div>
                <div className="notification-list">
                  {contactMessages.length === 0 ? (
                    <div className="no-notifications">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    contactMessages.slice(0, 5).map((msg) => (
                      <div key={msg.MessageID} className={`notification-item ${msg.IsRead ? 'read' : 'unread'}`}>
                        <div className="notification-status-dot"></div>
                        <div className="notification-content">
                          <div className="notification-header-row">
                            <strong>{msg.CustomerName}</strong>
                            <span className="notification-time">
                              {new Date(msg.CreatedDate).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="notification-message">{msg.Message.substring(0, 50)}...</p>
                        </div>
                        {!msg.IsRead && (
                          <button 
                            className="mark-read-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(msg.MessageID);
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {contactMessages.length > 5 && (
                  <div className="notification-footer">
                    <span>View all messages in dashboard</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="header-back-btn" onClick={handleLogout}>
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

      {/* Main Admin Console */}
      <main className="admin-main animate-slide">
        {/* KPI stats bar */}
        <section className="admin-kpi-grid">
          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Unique Machine Types</span>
              <h3 className="kpi-value">{stats.totalMachines} Models</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Warehouse Stock Units</span>
              <h3 className="kpi-value">{stats.availableStock} Units</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Total Orders</span>
              <h3 className="kpi-value">{stats.totalOrders} Orders</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Pending Orders</span>
              <h3 className="kpi-value">{stats.pendingOrders} Orders</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Completed Orders</span>
              <h3 className="kpi-value">{stats.completedOrders} Orders</h3>
            </div>
          </div>

          <div className="kpi-card glass-card-base animate-scale">
            <div className="kpi-icon-box red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="kpi-svg">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Lifetime Revenue</span>
              <h3 className="kpi-value">₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
            </div>
          </div>
        </section>

        {/* Quick action grid */}
        <section className="quick-actions-section">
          <h2 className="section-block-title">Management Portals</h2>
          <div className="actions-card-grid">
            <div className="action-tile glass-card-base" onClick={() => navigate("/machineryupload")}>
              <div className="action-icon-circle green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Upload Machinery</h4>
                <p>Register new industrial machinery models, specify description details, original/offer prices, and stock allocations.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>

            <div className="action-tile glass-card-base" onClick={() => navigate("/availablestock")}>
              <div className="action-icon-circle blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Available Stock Grid</h4>
                <p>Inspect existing catalog database, check real-time stock statuses, search and filter items, or edit and delete models.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>

            <div className="action-tile glass-card-base" onClick={() => navigate("/orders")}>
              <div className="action-icon-circle orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Manage Orders</h4>
                <p>View all shop orders, update order status, manage customer orders and track payment status.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>

            <div className="action-tile glass-card-base" onClick={() => navigate("/complaints")}>
              <div className="action-icon-circle red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <div className="action-info">
                <h4>Customer Complaints</h4>
                <p>View and respond to customer complaints, generate AI voice replies, and track resolution status.</p>
              </div>
              <span className="action-link-arrow">Access →</span>
            </div>
          </div>
        </section>

        {/* Recent orders table */}
        <section className="recent-orders-section glass-card-base">
          <h3 className="section-block-title">Recent Purchase Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="admin-table-container">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Machinery Ordered</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Paid Amount</th>
                    <th className="text-center">Method</th>
                    <th className="text-center">Date Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord, index) => (
                    <tr key={ord.orderId || index}>
                      <td><span className="order-id-badge">{ord.orderId || ord.OrderNumber || 'N/A'}</span></td>
                      <td>
                        <div className="table-customer-meta">
                          <strong>{ord.customer?.name || ord.Username || 'N/A'}</strong>
                          <p>{ord.customer?.phone || ord.PhoneNumber || 'N/A'}</p>
                        </div>
                      </td>
                      <td><strong>{ord.item?.name || ord.MachineName || 'N/A'}</strong></td>
                      <td className="text-center">{ord.item?.quantity || ord.Quantity || 1}</td>
                      <td className="text-center text-green">₹{(ord.totalAmount || ord.TotalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="text-center"><span className="payment-method-pill">{ord.paymentMethod || ord.PaymentMethod || 'N/A'}</span></td>
                      <td className="text-center">{ord.orderDate || (ord.OrderDate ? new Date(ord.OrderDate).toLocaleDateString("en-IN") : 'N/A')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-orders-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-orders-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>No orders have been placed in the system yet.</p>
            </div>
          )}
        </section>

        {/* Customer Messages Section */}
        <section className="customer-messages-section glass-card-base">
          <div className="messages-header">
            <h3 className="section-block-title">Customer Messages</h3>
            <span className="messages-count">{contactMessages.length} messages</span>
          </div>
          {contactMessages.length > 0 ? (
            <div className="messages-grid">
              {contactMessages.map((msg) => (
                <div key={msg.MessageID} className={`message-card ${msg.IsRead ? 'read' : 'unread'}`}>
                  <div className="message-card-header">
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {msg.CustomerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="customer-details">
                        <strong>{msg.CustomerName}</strong>
                        <span className="customer-email">{msg.CustomerEmail}</span>
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="message-date">
                        {new Date(msg.CreatedDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`status-indicator ${msg.IsRead ? 'read' : 'unread'}`}>
                        {msg.IsRead ? '✓ Read' : '○ Unread'}
                      </span>
                    </div>
                  </div>
                  <div className="message-card-body">
                    <p>{msg.Message}</p>
                  </div>
                  {!msg.IsRead && (
                    <div className="message-card-footer">
                      <button 
                        className="mark-as-read-btn"
                        onClick={() => handleMarkAsRead(msg.MessageID)}
                      >
                        Mark as Read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-messages-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-messages-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>No customer messages yet.</p>
            </div>
          )}
        </section>
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

export default AdminHome;