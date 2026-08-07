const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  offerPrice: {
    type: Number,
    default: null,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  weight: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true,
    maxlength: 10000000 // Allow up to ~10MB base64 string for machinery images
  },
  galleryImages: [{
    type: String,
    maxlength: 10000000 // Allow up to ~10MB base64 string per gallery image
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
    lowercase: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
productSchema.index({ shopId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ productName: 'text', description: 'text' }); // For search

module.exports = mongoose.model('Product', productSchema);
