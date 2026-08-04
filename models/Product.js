const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  artikul: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  narx: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Artikul avtomatik yaratish
ProductSchema.pre('save', function(next) {
  if (!this.artikul) {
    // ART + 6 xonalik raqam
    const random = Math.floor(100000 + Math.random() * 900000);
    this.artikul = `ART${random}`;
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
