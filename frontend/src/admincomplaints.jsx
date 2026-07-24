import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, clearSession } from "./api";
import "./admincomplaints.css";

function AdminComplaints() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("tamil");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("scm_currentUser"));
    const token = localStorage.getItem("scm_token");
    if (!user || !token || (user.role !== "admin" && user.role !== "shopadmin")) {
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
      setComplaints(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load complaints");
      setLoading(false);
    }
  };

  const handleComplaintClick = async (complaintId) => {
    try {
      const complaint = await api.getComplaintById(complaintId);
      console.log("Admin - Complaint details loaded:", complaint);
      console.log("Admin - VoiceReplyUrl:", complaint.VoiceReplyUrl);
      setSelectedComplaint(complaint);
      setReplyText(complaint.AdminReply || "");
    } catch (err) {
      console.error("Admin - Load complaint error:", err);
      setError("Failed to load complaint details");
    }
  };

  const handleSaveReply = async () => {
    if (!replyText || !selectedComplaint) return;

    try {
      setIsSavingReply(true);
      setSaveSuccess(false);
      
      // Save text reply first
      await api.updateComplaintReply(selectedComplaint.ComplaintID, replyText);
      
      // Generate voice after saving reply
      try {
        await api.generateComplaintVoice(selectedComplaint.ComplaintID, replyText, voiceLanguage);
      } catch (voiceErr) {
        console.error("Voice generation failed:", voiceErr);
        alert("Reply saved but voice generation failed. You can try generating voice again.");
      }
      
      setSaveSuccess(true);
      await handleComplaintClick(selectedComplaint.ComplaintID);
      setIsSavingReply(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save reply error:", err);
      alert("Failed to save reply: " + (err.message || "Unknown error"));
      setIsSavingReply(false);
      setSaveSuccess(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setAudioChunks(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleUploadRecordedAudio = async () => {
    if (!recordedAudioUrl || !selectedComplaint) return;

    try {
      setIsSavingReply(true);
      console.log("Starting voice upload for complaint:", selectedComplaint.ComplaintID);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice_reply_${selectedComplaint.ComplaintID}.webm`);
      formData.append('complaintId', selectedComplaint.ComplaintID);

      console.log("Uploading to backend...");

      // Upload audio to backend
      const response = await fetch('/api/upload-voice-reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('scm_token')}`
        },
        body: formData
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error('Failed to upload voice reply');
      }

      const result = await response.json();
      console.log("Upload result:", result);
      
      // Reload complaint details to get updated voice URL
      await handleComplaintClick(selectedComplaint.ComplaintID);
      
      setSaveSuccess(true);
      setRecordedAudioUrl(null);
      setAudioChunks([]);
      setIsSavingReply(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Upload voice error:", err);
      alert("Failed to upload voice reply: " + (err.message || "Unknown error"));
      setIsSavingReply(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="admin-complaints-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/adminhome")}>
          <svg className="header-logo-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65-1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="header-brand-text">Sudharsan Cottage Machinery</span>
        </div>
        <div className="header-title-container">
          <h2 className="header-page-title">Customer Complaints</h2>
        </div>
        <div className="header-actions">
          <button className="header-back-btn" onClick={() => navigate("/adminhome")} title="Back to Dashboard">
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

      <main className="admin-complaints-main">
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
              <h3 className="section-title">All Complaints ({complaints.length})</h3>
              <div className="complaints-list">
                {complaints.length === 0 ? (
                  <div className="no-complaints">
                    <p>No complaints yet</p>
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
                      <p className="complaint-customer">{complaint.Username}</p>
                      <p className="complaint-date">
                        {new Date(complaint.CreatedDate).toLocaleDateString("en-IN")}
                      </p>
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
                      <span className="info-label">Customer:</span>
                      <span className="info-value">{selectedComplaint.CustomerName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{selectedComplaint.Mobile}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Order ID:</span>
                      <span className="info-value">{selectedComplaint.OrderID || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Complaint Type:</span>
                      <span className="info-value">{selectedComplaint.ComplaintType}</span>
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

                  {selectedComplaint.CustomerVoiceUrl && (
                    <div className="voice-reply-section">
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="voice-icon">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        Customer Complaint Voice
                      </h4>
                      <audio controls className="audio-player">
                        <source src={selectedComplaint.CustomerVoiceUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <div className="complaint-reply-section">
                    <h4>Admin Reply</h4>
                    <textarea
                      className="reply-textarea"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply in Tamil or English..."
                      rows="6"
                    />
                    <div className="language-selector">
                      <label>Voice Language:</label>
                      <select 
                        className="language-dropdown"
                        value={voiceLanguage}
                        onChange={(e) => setVoiceLanguage(e.target.value)}
                      >
                        <option value="tamil">தமிழ் (Tamil)</option>
                        <option value="english">English</option>
                      </select>
                    </div>
                    
                    {/* Voice Recorder Section */}
                    <div className="voice-recorder-section">
                      <div className="recorder-controls">
                        {!isRecording && !recordedAudioUrl && (
                          <button
                            className="btn-record-icon"
                            onClick={startRecording}
                            title="Record Voice Reply"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="3" fill="currentColor" />
                            </svg>
                          </button>
                        )}
                        {isRecording && (
                          <button
                            className="btn-stop-icon"
                            onClick={stopRecording}
                            title="Stop Recording"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                            </svg>
                          </button>
                        )}
                        {recordedAudioUrl && (
                          <div className="recorded-audio-preview">
                            <audio controls src={recordedAudioUrl} className="compact-audio"></audio>
                            <div className="audio-actions">
                              <button
                                className="btn-upload-icon"
                                onClick={handleUploadRecordedAudio}
                                disabled={isSavingReply}
                                title="Upload Voice"
                              >
                                {isSavingReply ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5 5-5-5M12 3v12" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className="btn-discard-icon"
                                onClick={() => {
                                  setRecordedAudioUrl(null);
                                  setAudioChunks([]);
                                }}
                                title="Discard"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="reply-actions">
                      {saveSuccess && (
                        <div className="success-message">✓ Submitted Successfully</div>
                      )}
                      <button
                        className="btn-save-reply"
                        onClick={handleSaveReply}
                        disabled={isSavingReply || !replyText || saveSuccess}
                      >
                        {isSavingReply ? 'Saving & Generating Voice...' : saveSuccess ? '✓ Submitted' : '💾 Save & Generate Voice'}
                      </button>
                    </div>
                  </div>

                  {selectedComplaint.VoiceReplyUrl && (
                    <div className="voice-reply-section">
                      <h4>Voice Reply</h4>
                      <audio controls className="audio-player">
                        <source src={selectedComplaint.VoiceReplyUrl.startsWith('/api') ? selectedComplaint.VoiceReplyUrl : `/api${selectedComplaint.VoiceReplyUrl}`} type="audio/mpeg" />
                        <source src={selectedComplaint.VoiceReplyUrl.startsWith('/api') ? selectedComplaint.VoiceReplyUrl : `/api${selectedComplaint.VoiceReplyUrl}`} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedComplaint.AdminReply && (
                    <div className="existing-reply-section">
                      <h4>Existing Reply</h4>
                      <p>{selectedComplaint.AdminReply}</p>
                      {selectedComplaint.ReplyDate && (
                        <p className="reply-date">
                          Replied on: {new Date(selectedComplaint.ReplyDate).toLocaleString("en-IN")}
                        </p>
                      )}
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

export default AdminComplaints;
