const mongoose = require('mongoose');

// Artikul yaratish funksiyasi
async function generateArtikul() {
  const Product = mongoose.model('Product');
  
  // Oxirgi mahsulotni topish
  const lastProduct = await Product.findOne({})
    .sort({ artikul: -1 })
    .select('artikul');
  
  let nextNumber = 1;
  
  if (lastProduct && lastProduct.artikul) {
    const match = lastProduct.artikul.match(/ART-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `ART-${String(nextNumber).padStart(3, '0')}`;
}

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

// SAVEDAN OLDIN artikul yaratish
ProductSchema.pre('save', async function(next) {
  if (!this.artikul) {
    try {
      this.artikul = await generateArtikul();
      console.log(`✅ Artikul yaratildi: ${this.artikul}`);
    } catch (error) {
      console.error('Artikul yaratish xatosi:', error);
      // Agar xatolik bo'lsa vaqt bo'yicha
      this.artikul = `ART-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
