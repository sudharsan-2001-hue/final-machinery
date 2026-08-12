const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'seller', 'shopadmin'],
    default: 'customer',
    lowercase: true
  },
  shopId: {
    type: String,
    default: null,
    trim: true
  },
  customerType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual',
    lowercase: true
  },
  profileImage: {
    type: String,
    default: null,
    maxlength: 5000000 // Allow up to ~5MB base64 string
  },
  address: {
    type: String,
    default: null,
    trim: true
  },
  district: {
    type: String,
    default: null,
    trim: true
  },
  state: {
    type: String,
    default: null,
    trim: true
  },
  pincode: {
    type: String,
    default: null,
    trim: true
  },
  gstNumber: {
    type: String,
    default: null,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    lowercase: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to map to frontend format
userSchema.methods.toFrontendFormat = function() {
  return {
    id: this._id,
    email: this.email,
    phone: this.mobile,
    fullName: this.name,
    role: this.role
  };
};

module.exports = mongoose.model('User', userSchema);
