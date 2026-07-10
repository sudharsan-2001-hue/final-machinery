import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "./api";
import { useToast } from "./components/Toast";
import PasswordInput from "./components/PasswordInput";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userRole, setUserRole] = useState("customer"); // customer, seller
  const [formMode, setFormMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regGSTNumber, setRegGSTNumber] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");

  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    const remember = localStorage.getItem("scm_rememberMe") === "true";
    if (currentUser && token && remember && formMode === "login") {
      if (currentUser.role === "seller") navigate("/seller-dashboard");
      else navigate("/home");
    }
  }, [navigate, formMode]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(identifier, password);
      const user = { id: data.id, email: data.email, phone: data.phone, fullName: data.fullName, role: data.role };

      if (userRole === "seller" && user.role !== "seller") {
        setError("Invalid seller credentials.");
        return;
      }
      if (userRole === "customer" && user.role !== "customer") {
        setError("Invalid customer credentials.");
        return;
      }

      saveSession(user, data.token, rememberMe);
      showToast("Login successful!", "success");

      if (user.role === "seller") navigate("/seller-dashboard");
      else navigate("/home");
    } catch (err) {
      setError(err.message || "Invalid email/phone or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!regEmail || !regPassword || !regPhone || !regFullName) {
      setError("All fields are required.");
      return;
    }
    if (regPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.register(regEmail, regPassword, regPhone, regFullName);
      showToast("Registration successful!", "success");
      setSuccess("Registration successful! You can now log in.");
      setFormMode("login");
      setIdentifier(regEmail);
      setPassword(regPassword);
      if (data.token && data.user) {
        saveSession(data.user, data.token, false);
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSellerRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!regEmail || !regPassword || !regPhone || !regFullName) {
      setError("All fields are required.");
      return;
    }
    if (regPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.registerSeller(regEmail, regPassword, regPhone, regFullName, regGSTNumber, regBusinessName);
      showToast("Seller registration successful!", "success");
      setSuccess("Seller registration successful! You can now log in.");
      setFormMode("login");
      setUserRole("seller");
      setIdentifier(regEmail);
      setPassword(regPassword);
    } catch (err) {
      setError(err.message || "Seller registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!forgotIdentifier || !forgotNewPassword) {
      setError("Email/phone and new password are required.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.forgotPassword(forgotIdentifier, forgotNewPassword);
      showToast("Password reset successful!", "success");
      setSuccess("Password reset successful! You can now log in.");
      setFormMode("login");
      setIdentifier(forgotIdentifier);
      setPassword(forgotNewPassword);
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (formMode === "register") return "Create Customer Account";
    if (formMode === "sellerRegister") return "Create Seller Account";
    if (formMode === "forgot") return "Reset Your Password";
    return `Welcome! Please sign in to your ${userRole === "seller" ? "Seller" : "Customer"} Panel`;
  };

  return (
    <div className="login-wrapper">
      <div className="background-decor">
        <div className="glow-sphere sphere1"></div>
        <div className="glow-sphere sphere2"></div>
      </div>

      <div className="login-card glass-card-base animate-scale">
        <div className="brand-logo">
          <svg className="gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        <h2 className="company-title">Cotton Industry Machinery Store</h2>
        <p className="welcome-text">{getTitle()}</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {formMode === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-tabs">
              <button type="button" className={`tab-btn ${userRole === "customer" ? "active" : ""}`} onClick={() => { setUserRole("customer"); resetMessages(); }}>
                Customer
              </button>
              <button type="button" className={`tab-btn ${userRole === "seller" ? "active" : ""}`} onClick={() => { setUserRole("seller"); resetMessages(); }}>
                Seller
              </button>
            </div>

            <div className="input-group">
              <label>Email or Phone Number</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or 10-digit phone"
                className="glass-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" disabled={loading} />
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={loading} />
                <span className="checkmark"></span>
                Remember Me
              </label>
              <span className="link-text forgot-link" onClick={() => { setFormMode("forgot"); resetMessages(); }}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="login-submit-btn btn-grad-primary" disabled={loading}>
              {loading ? <><span className="spinner-inline"></span>Logging in...</> : "Log In"}
            </button>

            {userRole === "customer" ? (
              <p className="toggle-form-text">
                New customer?{" "}
                <span className="link-text" onClick={() => { setFormMode("register"); resetMessages(); }}>Register here</span>
              </p>
            ) : (
              <p className="toggle-form-text">
                New seller?{" "}
                <span className="link-text" onClick={() => { setFormMode("sellerRegister"); resetMessages(); }}>Register seller</span>
              </p>
            )}
          </form>
        )}

        {formMode === "register" && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="Enter your full name" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Enter email address" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="10-digit number" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <PasswordInput value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Choose password (min 6 chars)" disabled={loading} />
            </div>
            <button type="submit" className="login-submit-btn btn-grad-secondary" disabled={loading}>
              {loading ? <><span className="spinner-inline"></span>Registering...</> : "Register Account"}
            </button>
            <p className="toggle-form-text">
              Already have an account?{" "}
              <span className="link-text" onClick={() => { setFormMode("login"); resetMessages(); }}>Log in</span>
            </p>
          </form>
        )}

        {formMode === "sellerRegister" && (
          <form onSubmit={handleSellerRegister} className="login-form">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="Enter your full name" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Enter email address" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="10-digit number" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <PasswordInput value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Choose password (min 6 chars)" disabled={loading} />
            </div>
            <div className="input-group">
              <label>GST Number (Optional)</label>
              <input type="text" value={regGSTNumber} onChange={(e) => setRegGSTNumber(e.target.value)} placeholder="Enter GST number" className="glass-input" disabled={loading} />
            </div>
            <div className="input-group">
              <label>Business Name (Optional)</label>
              <input type="text" value={regBusinessName} onChange={(e) => setRegBusinessName(e.target.value)} placeholder="Enter business name" className="glass-input" disabled={loading} />
            </div>
            <button type="submit" className="login-submit-btn btn-grad-primary" disabled={loading}>
              {loading ? <><span className="spinner-inline"></span>Registering...</> : "Register Seller"}
            </button>
            <p className="toggle-form-text">
              Back to login?{" "}
              <span className="link-text" onClick={() => { setFormMode("login"); setUserRole("seller"); resetMessages(); }}>Seller login</span>
            </p>
          </form>
        )}

        {formMode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="input-group">
              <label>Email or Phone Number</label>
              <input type="text" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} placeholder="Registered email or phone" className="glass-input" required disabled={loading} />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <PasswordInput value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" disabled={loading} />
            </div>
            <button type="submit" className="login-submit-btn btn-grad-secondary" disabled={loading}>
              {loading ? <><span className="spinner-inline"></span>Resetting...</> : "Reset Password"}
            </button>
            <p className="toggle-form-text">
              Remember password?{" "}
              <span className="link-text" onClick={() => { setFormMode("login"); resetMessages(); }}>Back to login</span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}

export default Login;
