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

// Artikul avtomatik yaratish
ProductSchema.pre('save', async function(next) {
  try {
    if (!this.artikul) {
      const lastProduct = await mongoose.model('Product')
        .findOne({ artikul: { $exists: true, $ne: null } })
        .sort({ artikul: -1 });
      
      let nextNumber = 1;
      
      if (lastProduct && lastProduct.artikul) {
        const match = lastProduct.artikul.match(/ART-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.artikul = `ART-${String(nextNumber).padStart(3, '0')}`;
      console.log(`✅ Artikul yaratildi: ${this.artikul}`);
    }
    next();
  } catch (error) {
    console.error('Artikul yaratish xatosi:', error);
    const timestamp = Date.now().toString().slice(-6);
    this.artikul = `ART-${timestamp}`;
    next();
  }
});

module.exports = mongoose.model('Product', ProductSchema);
