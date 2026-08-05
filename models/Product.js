const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  artikul: {
    type: String,
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

// ✅ ART-001 dan boshlab ketma-ket
ProductSchema.pre('save', async function(next) {
  try {
    if (!this.artikul) {
      // Oxirgi mahsulotni topish
      const last = await mongoose.model('Product')
        .findOne({ artikul: { $exists: true, $ne: null } })
        .sort({ artikul: -1 });
      
      let nextNumber = 1;
      if (last && last.artikul) {
        const match = last.artikul.match(/ART-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      // ART-001, ART-002, ART-003...
      this.artikul = 'ART-' + String(nextNumber).padStart(3, '0');
      console.log('✅ Artikul yaratildi:', this.artikul);
    }
    next();
  } catch (error) {
    console.error('Artikul xatosi:', error);
    this.artikul = 'ART-' + Date.now().toString().slice(-6);
    next();
  }
});

module.exports = mongoose.model('Product', ProductSchema);
