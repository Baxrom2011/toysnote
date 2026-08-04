const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  artikul: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: function() {
      // Agar artikul bo'lmasa, avtomatik yaratish
      const random = Math.floor(100000 + Math.random() * 900000);
      return `ART${random}`;
    }
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

// Artikul avtomatik yaratish (agar bo'sh bo'lsa)
ProductSchema.pre('save', function(next) {
  if (!this.artikul || this.artikul === '') {
    const random = Math.floor(100000 + Math.random() * 900000);
    this.artikul = `ART${random}`;
  }
  next();
});

// Artikul uniqligini tekshirish va qayta urinish
ProductSchema.pre('save', async function(next) {
  if (!this.artikul) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const testArtikul = `ART${random}`;
      const existing = await mongoose.model('Product').findOne({ artikul: testArtikul });
      if (!existing) {
        this.artikul = testArtikul;
        unique = true;
      }
      attempts++;
    }
    if (!unique) {
      this.artikul = `ART${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
