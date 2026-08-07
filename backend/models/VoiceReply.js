const mongoose = require('mongoose');

const voiceReplySchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  voiceFile: {
    type: String,
    required: true
  },
  voiceUrl: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['tamil', 'english', 'hindi', 'telugu', 'malayalam', 'kannada'],
    default: 'tamil'
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster lookups
voiceReplySchema.index({ complaintId: 1 });

module.exports = mongoose.model('VoiceReply', voiceReplySchema);
