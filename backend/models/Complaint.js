const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending',
    lowercase: true
  },
  adminReply: {
    type: String,
    trim: true,
    default: null
  },
  customerVoiceUrl: {
    type: String,
    trim: true,
    default: null
  },
  voiceReply: {
    type: String,
    trim: true,
    default: null
  },
  voiceReplyUrl: {
    type: String,
    trim: true,
    default: null
  },
  replyDate: {
    type: Date,
    default: null
  },
  complaintType: {
    type: String,
    enum: ['General', 'Product', 'Delivery', 'Payment', 'Other'],
    default: 'General'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster lookups
complaintSchema.index({ customerId: 1 });
complaintSchema.index({ shopId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
