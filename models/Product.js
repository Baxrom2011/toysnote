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

// ART-001 dan boshlab ketma-ket nomer berish
ProductSchema.pre('save', async function(next) {
  if (!this.artikul) {
    try {
      // Oxirgi mahsulotni topish
      const lastProduct = await mongoose.model('Product')
        .findOne({ artikul: /^ART-/ })
        .sort({ artikul: -1 });
      
      let nextNumber = 1;
      
      if (lastProduct && lastProduct.artikul) {
        // ART-001 dan raqamni olish
        const match = lastProduct.artikul.match(/ART-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // 3 xonali raqam formatida (001, 002, 003...)
      this.artikul = `ART-${String(nextNumber).padStart(3, '0')}`;
      
      // Agar shu raqam mavjud bo'lsa, keyingisiga o'tish
      const existing = await mongoose.model('Product').findOne({ artikul: this.artikul });
      if (existing) {
        // Rekursiv ravishda keyingi raqamni topish
        let counter = nextNumber + 1;
        let found = false;
        while (!found && counter < 10000) {
          const testArtikul = `ART-${String(counter).padStart(3, '0')}`;
          const testExisting = await mongoose.model('Product').findOne({ artikul: testArtikul });
          if (!testExisting) {
            this.artikul = testArtikul;
            found = true;
          }
          counter++;
        }
      }
      
    } catch (error) {
      console.error('Artikul yaratish xatosi:', error);
      // Xatolik bo'lsa vaqt bo'yicha unique raqam
      this.artikul = `ART-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
