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
  
  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState("");

  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    description: "",
    orderId: "",
    complaintType: "General",
    imageUrl: "",
    language: "tamil"
  });

  const speakText = (text, language = 'english') => {
    if (!text) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const isEnglish = language === 'english';
    utterance.lang = isEnglish ? 'en-US' : 'ta-IN';
    utterance.rate = isEnglish ? 1.0 : 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    if (isEnglish) {
      const englishVoice = voices.find(voice => voice.lang.includes('en'));
      if (englishVoice) utterance.voice = englishVoice;
    } else {
      const tamilVoice = voices.find(voice => voice.lang.includes('ta'));
      if (tamilVoice) utterance.voice = tamilVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const startSpeechRecognition = (targetField) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice typing is not supported in this browser. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = complaintForm.language === 'english' ? 'en-US' : 'ta-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setListeningField(targetField);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningField("");
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      setListeningField("");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setComplaintForm(prev => ({
        ...prev,
        [targetField]: prev[targetField] ? prev[targetField] + " " + transcript : transcript
      }));
    };

    recognition.start();
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
      console.error("Recording error:", err);
      alert("Failed to access microphone. Please allow mic permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
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
      setComplaints(data);
      setLoading(false);
      if (data.length > 0 && !selectedComplaint) {
        setSelectedComplaint(data[0]);
      }
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

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      let customerVoiceUrl = null;

      // If user recorded a voice message, upload it first
      if (recordedAudioUrl && audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, `voice_complaint_${Date.now()}.webm`);
        const uploadResult = await api.uploadCustomerVoice(formData);
        customerVoiceUrl = uploadResult.voiceUrl;
      }

      await api.sendComplaint(
        complaintForm.subject, 
        complaintForm.description, 
        complaintForm.orderId,
        complaintForm.complaintType,
        complaintForm.imageUrl,
        complaintForm.language,
        customerVoiceUrl
      );
      
      alert("Complaint Accepted! Your complaint has been registered. We will resolve your complaint within 1 day.");
      playTamilVoiceMessage(complaintForm.language);
      
      setComplaintForm({ subject: "", description: "", orderId: "", complaintType: "General", imageUrl: "", language: "tamil" });
      setRecordedAudioUrl(null);
      setAudioChunks([]);
      setShowComplaintModal(false);
      loadComplaints();
    } catch (err) {
      alert(err.message || "Failed to submit complaint. Please try again.");
    }
  };

  const playTamilVoiceMessage = (language) => {
    if ('speechSynthesis' in window) {
      const isEnglish = language === 'english';
      const msg = isEnglish 
        ? "Hello, Sudharsan Machinery Customer Support. Your complaint has been registered successfully. Our team will review it and reply soon. Thank you."
        : "வணக்கம். Sudharsan Machinery Customer Support. உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது. எங்கள் குழு விரைவில் அதை பரிசீலித்து உங்களை தொடர்புகொள்ளும். நன்றி.";
      
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = isEnglish ? 'en-US' : 'ta-IN';
      utterance.rate = isEnglish ? 1.0 : 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="customer-complaints-wrapper">
      <header className="global-header glass-card-base animate-fade">
        <div className="header-logo" onClick={() => navigate("/home")}>
          <img src="/logo.jpeg" alt="MachMart Logo" className="header-logo-image" />
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', width: '100%' }}>
                      <h4>Subject</h4>
                      <button 
                        onClick={() => speakText(selectedComplaint.Subject, selectedComplaint.voiceLanguage || 'tamil')}
                        className="btn-tts-speaker"
                        title="Speak Subject"
                        style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#4CAF50' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      </button>
                    </div>
                    <p>{selectedComplaint.Subject}</p>
                  </div>

                  <div className="complaint-description-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', width: '100%' }}>
                      <h4>Description</h4>
                      <button 
                        onClick={() => speakText(selectedComplaint.Description, selectedComplaint.voiceLanguage || 'tamil')}
                        className="btn-tts-speaker"
                        title="Speak Description"
                        style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#4CAF50' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      </button>
                    </div>
                    <p>{selectedComplaint.Description}</p>
                  </div>

                  {selectedComplaint.CustomerVoiceUrl && (
                    <div className="voice-reply-section" style={{ marginTop: '15px' }}>
                      <h4>Your Recorded Voice Message</h4>
                      <audio
                        controls
                        className="audio-player"
                        style={{ width: '100%', marginTop: '5px' }}
                        onError={(e) => console.error("Customer audio playback error:", e)}
                        onLoadStart={() => console.log("Customer audio loading:", selectedComplaint.CustomerVoiceUrl)}
                      >
                        <source src={api.getAudioUrl(selectedComplaint.CustomerVoiceUrl)} type="audio/webm" />
                        <source src={api.getAudioUrl(selectedComplaint.CustomerVoiceUrl)} type="audio/mp3" />
                        <source src={api.getAudioUrl(selectedComplaint.CustomerVoiceUrl)} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedComplaint.VoiceReplyUrl && (
                    <div className="voice-reply-section" style={{ marginTop: '15px' }}>
                      <h4>Admin Recorded Voice Reply</h4>
                      <audio
                        controls
                        className="audio-player"
                        style={{ width: '100%', marginTop: '5px' }}
                        onError={(e) => console.error("Audio playback error:", e)}
                        onLoadStart={() => console.log("Audio loading:", selectedComplaint.VoiceReplyUrl)}
                      >
                        <source src={api.getAudioUrl(selectedComplaint.VoiceReplyUrl)} type="audio/webm" />
                        <source src={api.getAudioUrl(selectedComplaint.VoiceReplyUrl)} type="audio/mp3" />
                        <source src={api.getAudioUrl(selectedComplaint.VoiceReplyUrl)} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedComplaint.AdminReply && (
                    <div className="voice-reply-section" style={{ marginTop: '15px' }}>
                      <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="voice-icon" style={{ width: '16px', marginRight: '5px' }}>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        Admin AI Voice Reader
                      </h4>
                      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                        <label style={{ fontSize: '13px', color: '#bbb', fontWeight: 'bold' }}>Select Language:</label>
                        <select
                          value={selectedComplaint.voiceLanguage || 'tamil'}
                          onChange={(e) => setSelectedComplaint({...selectedComplaint, voiceLanguage: e.target.value})}
                          style={{
                            marginLeft: '10px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #555',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            backgroundColor: '#222',
                            color: 'white'
                          }}
                        >
                          <option value="tamil">தமிழ் (Tamil)</option>
                          <option value="english">English</option>
                        </select>
                      </div>
                      <button
                        onClick={() => speakText(selectedComplaint.AdminReply, selectedComplaint.voiceLanguage || 'tamil')}
                        disabled={isSpeaking}
                        className="voice-play-button"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isSpeaking ? '#FF9800' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: isSpeaking ? 'not-allowed' : 'pointer',
                          marginTop: '5px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isSpeaking ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                            Speaking...
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            </svg>
                            Speak Admin Reply
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedComplaint.AdminReply && (
                    <div className="admin-reply-section" style={{ marginTop: '15px' }}>
                      <h4>Admin Reply Text</h4>
                      <p>{selectedComplaint.AdminReply}</p>
                      {selectedComplaint.ReplyDate && (
                        <p className="reply-date">
                          Replied on: {new Date(selectedComplaint.ReplyDate).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  )}

                  {!selectedComplaint.AdminReply && !selectedComplaint.VoiceReplyUrl && (
                    <div className="pending-reply-section" style={{ marginTop: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pending-icon" style={{ width: '40px', color: '#ff9800' }}>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="glass-input" 
                    required 
                    placeholder="Brief description of the issue"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    onClick={() => startSpeechRecognition('subject')}
                    className={`btn-mic-type ${isListening && listeningField === 'subject' ? 'listening' : ''}`}
                    title="Voice Typing"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '5px',
                      border: '1px solid #555',
                      backgroundColor: isListening && listeningField === 'subject' ? '#ff3333' : '#333',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    🎤
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Detailed Description</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <textarea 
                    className="glass-input textarea-field" 
                    required 
                    rows="5" 
                    placeholder="Please provide detailed information about your complaint..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                    style={{ flex: 1 }}
                  ></textarea>
                  <button 
                    type="button"
                    onClick={() => startSpeechRecognition('description')}
                    className={`btn-mic-type ${isListening && listeningField === 'description' ? 'listening' : ''}`}
                    title="Voice Typing"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '5px',
                      border: '1px solid #555',
                      backgroundColor: isListening && listeningField === 'description' ? '#ff3333' : '#333',
                      color: 'white',
                      cursor: 'pointer',
                      marginTop: '5px'
                    }}
                  >
                    🎤
                  </button>
                </div>
              </div>

              {/* Voice Recording Section */}
              <div className="input-group voice-recording-container" style={{ margin: '15px 0', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Record Voice Message (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!isRecording && !recordedAudioUrl && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn-record-audio"
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#ff3333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🔴 Record
                    </button>
                  )}
                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn-stop-recording"
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹️ Stop
                    </button>
                  )}
                  {recordedAudioUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <audio src={recordedAudioUrl} controls style={{ height: '36px', flex: 1 }} />
                      <button
                        type="button"
                        onClick={() => { setRecordedAudioUrl(null); setAudioChunks([]); }}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#555',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
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
