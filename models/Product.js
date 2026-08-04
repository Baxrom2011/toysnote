const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  artikul: {
    type: String,
    unique: true,
    trim: true,
    default: function() {
      return `ART-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
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

// Artikul avtomatik yaratish (save dan oldin)
ProductSchema.pre('save', async function(next) {
  try {
    // Agar artikul mavjud bo'lmasa yaratish
    if (!this.artikul || this.artikul === 'undefined') {
      // Oxirgi mahsulotni topish
      const lastProduct = await mongoose.model('Product')
        .findOne({})
        .sort({ artikul: -1 });
      
      let nextNumber = 1;
      
      if (lastProduct && lastProduct.artikul && lastProduct.artikul !== 'undefined') {
        const match = lastProduct.artikul.match(/ART-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      } else {
        // Hech qanday mahsulot yo'q yoki artikul undefined
        const count = await mongoose.model('Product').countDocuments();
        nextNumber = count + 1;
      }
      
      this.artikul = `ART-${String(nextNumber).padStart(3, '0')}`;
      console.log(`✅ Artikul yaratildi: ${this.artikul}`);
    }
    next();
  } catch (error) {
    console.error('Artikul yaratish xatosi:', error);
    // Xatolik bo'lsa vaqt bo'yicha unique raqam
    const timestamp = Date.now().toString().slice(-6);
    this.artikul = `ART-${timestamp}`;
    next();
  }
});

module.exports = mongoose.model('Product', ProductSchema);
