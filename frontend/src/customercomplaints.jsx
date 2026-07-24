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
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    description: "",
    orderId: "",
    complaintType: "General",
    imageUrl: "",
    language: "tamil"
  });

  const speakText = (text) => {
    if (!text) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Default to English
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("AI Voice started speaking");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("AI Voice finished speaking");
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      console.error("AI Voice error:", event.error);
    };

    window.speechSynthesis.speak(utterance);
  };

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
      const data = await api.getMyComplaints();
      console.log("Loaded complaints:", data);
      setComplaints(data);
      setLoading(false);
      
      // Auto-select first complaint if available
      if (data.length > 0 && !selectedComplaint) {
        console.log("Auto-selecting first complaint:", data[0]);
        setSelectedComplaint(data[0]);
      }
    } catch (err) {
      console.error("Load complaints error:", err);
      setError("Failed to load complaints");
      setLoading(false);
    }
  };

  const handleComplaintClick = async (complaintId) => {
    try {
      const complaint = await api.getComplaintById(complaintId);
      console.log("Customer - Complaint details:", complaint);
      console.log("Customer - AdminReply:", complaint.AdminReply);
      console.log("Customer - ReplyDate:", complaint.ReplyDate);
      console.log("Customer - VoiceReplyUrl:", complaint.VoiceReplyUrl);
      console.log("Customer - VoiceReplyUrl type:", typeof complaint.VoiceReplyUrl);
      console.log("Customer - VoiceReplyUrl exists:", !!complaint.VoiceReplyUrl);
      setSelectedComplaint(complaint);
    } catch (err) {
      console.error("Customer - Load complaint details error:", err);
      setError("Failed to load complaint details");
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.sendComplaint(
        complaintForm.subject, 
        complaintForm.description, 
        complaintForm.orderId,
        complaintForm.complaintType,
        complaintForm.imageUrl,
        complaintForm.language
      );
      alert("Complaint Accepted! Your complaint has been registered. We will resolve your complaint within 1 day.");
      
      playTamilVoiceMessage();
      
      setComplaintForm({ subject: "", description: "", orderId: "", complaintType: "General", imageUrl: "", language: "tamil" });
      setShowComplaintModal(false);
      loadComplaints();
    } catch (err) {
      alert("Failed to submit complaint. Please try again.");
    }
  };

  const playTamilVoiceMessage = () => {
    if ('speechSynthesis' in window) {
      const tamilMessage = "வணக்கம். Sudharsan Machinery Customer Support. உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது. எங்கள் குழு விரைவில் அதை பரிசீலித்து உங்களை தொடர்புகொள்ளும். நன்றி.";
      
      const utterance = new SpeechSynthesisUtterance(tamilMessage);
      utterance.lang = 'ta-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
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
          <h2 className="header-page-title">View Replies</h2>
        </div>
        <div className="header-actions">
          <button className="header-new-complaint-btn btn-grad-primary" onClick={() => setShowComplaintModal(true)} title="File New Complaint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="header-icon-svg">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Complaint
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
              <h3 className="section-title">View Replies ({complaints.length})</h3>
              <div className="complaints-list">
                {complaints.length === 0 ? (
                  <div className="no-complaints">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="no-complaint-icon">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                    <p>No complaints yet</p>
                    <p className="no-complaints-hint">Submit a complaint from the home page to get started</p>
                    <button className="new-complaint-btn" onClick={() => navigate("/home")}>
                      Go to Home Page
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

                  {/* Debug: Show VoiceReplyUrl and AdminReply values */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{padding: '10px', background: 'rgba(255,255,0,0.1)', margin: '10px 0', fontSize: '12px'}}>
                      <strong>Debug - VoiceReplyUrl:</strong> {selectedComplaint.VoiceReplyUrl || 'null'}<br/>
                      <strong>Debug - AdminReply:</strong> {selectedComplaint.AdminReply || 'null'}<br/>
                      <strong>Debug - ReplyDate:</strong> {selectedComplaint.ReplyDate || 'null'}
                    </div>
                  )}

                  {selectedComplaint.AdminReply && (
                    <div className="voice-reply-section">
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="voice-icon">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        Admin Voice Reply
                      </h4>
                      <button 
                        onClick={() => speakText(selectedComplaint.AdminReply)}
                        disabled={isSpeaking}
                        className="voice-play-button"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: isSpeaking ? '#FF9800' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: isSpeaking ? 'not-allowed' : 'pointer',
                          marginTop: '10px',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {isSpeaking ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                            Speaking...
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            Play Voice Reply
                          </>
                        )}
                      </button>
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

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="modal-overlay animate-fade">
          <div className="contact-modal glass-card-base animate-scale">
            <div className="modal-header">
              <h3>Submit a Complaint</h3>
              <button className="modal-close-btn" onClick={() => setShowComplaintModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleComplaintSubmit} className="contact-form">
              <div className="input-group">
                <label>Order ID (Optional)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Enter Order ID if applicable"
                  value={complaintForm.orderId}
                  onChange={(e) => setComplaintForm({...complaintForm, orderId: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="Brief description of the issue"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Detailed Description</label>
                <textarea 
                  className="glass-input textarea-field" 
                  required 
                  rows="5" 
                  placeholder="Please provide detailed information about your complaint..."
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="input-group">
                <label>Voice Language</label>
                <select 
                  className="glass-input"
                  value={complaintForm.language}
                  onChange={(e) => setComplaintForm({...complaintForm, language: e.target.value})}
                >
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-close btn-grad-secondary" onClick={() => setShowComplaintModal(false)}>Cancel</button>
                <button type="submit" className="btn-send btn-grad-primary">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerComplaints;
