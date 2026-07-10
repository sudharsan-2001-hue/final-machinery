import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { useToast } from "./components/Toast";
import PasswordInput from "./components/PasswordInput";
import "./login.css";

function ChangePassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("scm_token");
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    if (!token || !user) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      showToast("Password changed successfully!", "success");
      const user = JSON.parse(localStorage.getItem("scm_currentUser"));
      navigate(user?.role === "admin" ? "/adminhome" : "/home");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="background-decor">
        <div className="glow-sphere sphere1"></div>
        <div className="glow-sphere sphere2"></div>
      </div>
      <div className="login-card glass-card-base animate-scale">
        <h2 className="company-title">Change Password</h2>
        <p className="welcome-text">Update your account password</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Current Password</label>
            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" disabled={loading} />
          </div>
          <div className="input-group">
            <label>New Password</label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" disabled={loading} />
          </div>
          <div className="input-group">
            <label>Confirm New Password</label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" disabled={loading} />
          </div>
          <button type="submit" className="login-submit-btn btn-grad-primary" disabled={loading}>
            {loading ? <><span className="spinner-inline"></span>Updating...</> : "Change Password"}
          </button>
          <p className="toggle-form-text">
            <span className="link-text" onClick={() => navigate(-1)}>Go back</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
