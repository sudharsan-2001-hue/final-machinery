import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession } from "./api";
import "./customercomplaints.css";

function CustomerComplaints() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || user.role !== "customer") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    loadComplaints();
  }, [navigate]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints();
      // Filter complaints for current user
      const userComplaints = data.filter(c => c.CustomerID === currentUser.id);
      setComplaints(userComplaints);
      setLoading(false);
    } catch (err) {
      setError("Failed to load complaints");
      setLoading(false);
    }
  };

  const handleComplaintClick = async (complaintId) => {
    try {
      const complaint = await api.getComplaintById(complaintId);
      setSelectedComplaint(complaint);
    } catch (err) {
      setError("Failed to load complaint details");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="customer-complaints-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65-1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">My Complaints</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/home")} title="Back to Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button className="header-logout-btn btn-grad-secondary" onClick={() => { clearSession(); navigate("/"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="customer-complaints-main">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading complaints...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadComplaints} className="retry-btn">Retry</button>
          </div>
        ) : (
          <div className="complaints-layout">
            <div className="complaints-list-section glass-card-base">
              <h3 className="section-title">My Complaints ({complaints.length})</h3>
              <div className="complaints-list">
                {complaints.length === 0 ? (
                  <div className="no-complaints">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-complaint-icon">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                    <p>No complaints yet</p>
                    <button className="new-complaint-btn" onClick={() => navigate("/home")}>
                      File a New Complaint
                    </button>
                  </div>
                ) : (
                  complaints.map((complaint) => (
                    <div
                      key={complaint.ComplaintID}
                      className={`complaint-item ${selectedComplaint?.ComplaintID === complaint.ComplaintID ? 'active' : ''}`}
                      onClick={() => handleComplaintClick(complaint.ComplaintID)}
                    >
                      <div className="complaint-item-header">
                        <strong>#{complaint.ComplaintID}</strong>
                        <span className={`status-badge ${complaint.Status.toLowerCase()}`}>{complaint.Status}</span>
                      </div>
                      <p className="complaint-subject">{complaint.Subject}</p>
                      <p className="complaint-date">
                        {new Date(complaint.CreatedDate).toLocaleDateString("en-IN")}
                      </p>
                      {complaint.VoiceReplyUrl && (
                        <div className="voice-indicator">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="voice-icon">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span>Voice Reply Available</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="complaint-details-section glass-card-base">
              {selectedComplaint ? (
                <div className="complaint-details">
                  <h3 className="section-title">Complaint Details</h3>
                  <div className="complaint-info-grid">
                    <div className="info-row">
                      <span className="info-label">Complaint ID:</span>
                      <span className="info-value">#{selectedComplaint.ComplaintID}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Order ID:</span>
                      <span className="info-value">{selectedComplaint.OrderID || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Status:</span>
                      <span className={`info-value status-${selectedComplaint.Status.toLowerCase()}`}>
                        {selectedComplaint.Status}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Created:</span>
                      <span className="info-value">
                        {new Date(selectedComplaint.CreatedDate).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="complaint-subject-section">
                    <h4>Subject</h4>
                    <p>{selectedComplaint.Subject}</p>
                  </div>

                  <div className="complaint-description-section">
                    <h4>Description</h4>
                    <p>{selectedComplaint.Description}</p>
                  </div>

                  {selectedComplaint.VoiceReplyUrl && (
                    <div className="voice-reply-section">
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="voice-icon">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        Admin Voice Reply
                      </h4>
                      <audio controls className="audio-player">
                        <source src={selectedComplaint.VoiceReplyUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedComplaint.AdminReply && (
                    <div className="admin-reply-section">
                      <h4>Admin Reply</h4>
                      <p>{selectedComplaint.AdminReply}</p>
                      {selectedComplaint.ReplyDate && (
                        <p className="reply-date">
                          Replied on: {new Date(selectedComplaint.ReplyDate).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  )}

                  {!selectedComplaint.AdminReply && !selectedComplaint.VoiceReplyUrl && (
                    <div className="pending-reply-section">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pending-icon">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <p>Awaiting admin response...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-complaint-selected">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-complaint-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  <p>Select a complaint to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerComplaints;
