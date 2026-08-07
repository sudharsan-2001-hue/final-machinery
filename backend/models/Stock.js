const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  shopId: {
    type: String,
    required: true,
    trim: true
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  updatedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
stockSchema.index({ productId: 1 });
stockSchema.index({ shopId: 1 });

// Compound index for shop + product
stockSchema.index({ shopId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
