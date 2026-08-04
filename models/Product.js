const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
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
    // Oxirgi mahsulotni topish
    const lastProduct = await mongoose.model('Product')
      .findOne({})
      .sort({ createdAt: -1 });
    
    let nextNumber = 1;
    
    if (lastProduct && lastProduct._id) {
      // Mavjud mahsulotlar soniga qarab raqamlash
      const count = await mongoose.model('Product').countDocuments();
      nextNumber = count + 1;
    }
    
    // 3 xonali raqam formatida (001, 002, 003...)
    this.artikul = `ART-${String(nextNumber).padStart(3, '0')}`;
    
    console.log(`✅ Artikul yaratildi: ${this.artikul}`);
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
