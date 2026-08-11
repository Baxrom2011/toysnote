const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

const router = express.Router();

function toNumber(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}


// ======================================================
// BARCHA SOTUVLAR
// ======================================================
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({
        sana: -1,
        createdAt: -1
      });

    res.json(sales);

  } catch (error) {
    console.error(
      'GET /sales error:',
      error
    );

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


// ======================================================
// YANGI SOTUV
// ======================================================
router.post('/', auth, async (req, res) => {
  try {
    const {
      sana,
      customerId,
      productId
    } = req.body;

    const soni = toNumber(
      req.body.soni,
      0
    );

    const tolangan = toNumber(
      req.body.tolangan,
      0
    );

    if (!sana) {
      return res.status(400).json({
        error: 'Sana kerak'
      });
    }

    if (!customerId) {
      return res.status(400).json({
        error: 'Mijoz kerak'
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: 'Mahsulot kerak'
      });
    }

    if (
      !Number.isInteger(soni) ||
      soni <= 0
    ) {
      return res.status(400).json({
        error:
          'Soni musbat butun son bo\'lishi kerak'
      });
    }

    if (tolangan < 0) {
      return res.status(400).json({
        error:
          'To\'langan summa manfiy bo\'lishi mumkin emas'
      });
    }

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        error: 'Mahsulot topilmadi'
      });
    }

    const jami =
      Number(product.narx) * soni;

    /*
      MUHIM:

      Sotuvning "tolangan" summasi hech qachon
      jami summadan katta bo'lmaydi.

      Agar mijoz ortiqcha pul bersa,
      faqat shu sotuvning jami summasi
      to'langan hisoblanadi.
    */
    const actualPaid =
      Math.min(
        tolangan,
        jami
      );

    const qarz =
      Math.max(
        0,
        jami - actualPaid
      );

    const ortiqcha =
      Math.max(
        0,
        tolangan - jami
      );

    const sale =
      await Sale.create({
        sana,
        customerId,
        productId,
        soni,
        narx: product.narx,
        jami,
        tolangan: actualPaid,
        qarz
      });

    /*
      Agar ortiqcha pul bo'lsa,
      uni alohida Payment sifatida saqlaymiz.

      Keyingi qarzni to'lashda bu pulni
      hisobga olish mumkin.
    */
    if (ortiqcha > 0) {
      await Payment.create({
        saleId: sale._id,
        customerId,
        sana,
        amount: ortiqcha
      });
    }

    const result =
      sale.toObject();

    result.productName =
      product.name;

    result.artikul =
      product.artikul;

    result.ortiqcha =
      ortiqcha;

    res.status(201).json(result);

  } catch (error) {
    console.error(
      'POST /sales error:',
      error
    );

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


// ======================================================
// SOTUVNI TAHRIRLASH
// ======================================================
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      sana,
      customerId,
      productId
    } = req.body;

    const soni =
      toNumber(
        req.body.soni,
        0
      );

    const tolangan =
      toNumber(
        req.body.tolangan,
        0
      );

    if (!sana) {
      return res.status(400).json({
        error: 'Sana kerak'
      });
    }

    if (!customerId) {
      return res.status(400).json({
        error: 'Mijoz kerak'
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: 'Mahsulot kerak'
      });
    }

    if (
      !Number.isInteger(soni) ||
      soni <= 0
    ) {
      return res.status(400).json({
        error:
          'Soni musbat butun son bo\'lishi kerak'
      });
    }

    if (tolangan < 0) {
      return res.status(400).json({
        error:
          'To\'langan summa manfiy bo\'lishi mumkin emas'
      });
    }

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        error: 'Mahsulot topilmadi'
      });
    }

    const existing =
      await Sale.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: 'Sotuv topilmadi'
      });
    }

    const jami =
      Number(product.narx) * soni;

    const actualPaid =
      Math.min(
        tolangan,
        jami
      );

    const qarz =
      Math.max(
        0,
        jami - actualPaid
      );

    const ortiqcha =
      Math.max(
        0,
        tolangan - jami
      );

    const sale =
      await Sale.findByIdAndUpdate(
        req.params.id,
        {
          sana,
          customerId,
          productId,
          soni,
          narx: product.narx,
          jami,
          tolangan: actualPaid,
          qarz
        },
        {
          new: true,
          runValidators: true
        }
      );

    /*
      Faqat shu sotuvdan yaratilgan
      avtomatik ortiqcha paymentni o'chiramiz.
    */
    await Payment.deleteMany({
      saleId: sale._id
    });

    if (ortiqcha > 0) {
      await Payment.create({
        saleId: sale._id,
        customerId,
        sana,
        amount: ortiqcha
      });
    }

    const result =
      sale.toObject();

    result.productName =
      product.name;

    result.artikul =
      product.artikul;

    result.ortiqcha =
      ortiqcha;

    res.json(result);

  } catch (error) {
    console.error(
      'PUT /sales/:id error:',
      error
    );

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


// ======================================================
// SOTUVNI O'CHIRISH
// ======================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted =
      await Sale.findByIdAndDelete(
        req.params.id
      );

    if (!deleted) {
      return res.status(404).json({
        error: 'Sotuv topilmadi'
      });
    }

    await Payment.deleteMany({
      saleId: deleted._id
    });

    res.json({
      message: 'Sotuv o\'chirildi'
    });

  } catch (error) {
    console.error(
      'DELETE /sales/:id error:',
      error
    );

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


// ======================================================
// MIJOZNING QARZI
// ======================================================
router.get(
  '/debt/:customerId',
  auth,
  async (req, res) => {
    try {
      const sales =
        await Sale.find({
          customerId:
            req.params.customerId
        });

      const debt =
        sales.reduce(
          (sum, sale) =>
            sum +
            Math.max(
              0,
              Number(sale.qarz || 0)
            ),
          0
        );

      res.json({
        debt
      });

    } catch (error) {
      console.error(
        'GET /sales/debt error:',
        error
      );

      res.status(500).json({
        error: 'Server xatosi'
      });
    }
  }
);


module.exports = router;
