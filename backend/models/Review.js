const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster lookups
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ productId: 1 });
reviewSchema.index({ rating: 1 });

// Compound index to ensure one review per customer per product
reviewSchema.index({ customerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
