const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  shopId: {
    type: String,
    default: null,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'complaint', 'product', 'system'],
    default: 'system',
    lowercase: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
notificationSchema.index({ userId: 1 });
notificationSchema.index({ shopId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
