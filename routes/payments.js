const express = require('express');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');

const router = express.Router();


// =====================================================
// BARCHA TO'LOVLAR
// =====================================================

router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ sana: -1, createdAt: -1 });

    res.json(payments);

  } catch (error) {
    console.error('GET /payments:', error);

    res.status(500).json({
      error: 'To\'lovlarni olishda server xatosi'
    });
  }
});


// =====================================================
// MIJOZNING TO'LOVLARI
// =====================================================

router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      customerId: req.params.customerId
    }).sort({
      sana: -1,
      createdAt: -1
    });

    res.json(payments);

  } catch (error) {
    console.error('GET customer payments:', error);

    res.status(500).json({
      error: 'Mijoz to\'lovlarini olishda xato'
    });
  }
});


// =====================================================
// KASSA — MIJOZDAN PUL OLISH
// =====================================================
//
// MUHIM:
// sana = pul olingan sana
//
// Qarzni hisoblashda sana ishlatilmaydi.
// Mijozning barcha eski sotuvlaridagi qarz olinadi.
//
// Masalan:
//
// Umumiy qarz: 6 405 800
// Kassa:       2 804 000
// Qolgan qarz: 3 601 800
//
// To'lov eng eski qarzlardan boshlab
// sotuvlarga taqsimlanadi.
// =====================================================

router.post('/', auth, async (req, res) => {
  try {

    const customerId =
      req.body.customerId;

    const sana =
      String(req.body.sana || '').trim();

    const amount =
      Number(req.body.amount);


    // =================================================
    // VALIDATSIYA
    // =================================================

    if (!customerId) {
      return res.status(400).json({
        error: 'Mijoz tanlanmagan'
      });
    }


    if (!sana) {
      return res.status(400).json({
        error: 'To\'lov sanasi kiritilmagan'
      });
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: 'To\'lov summasi noto\'g\'ri'
      });
    }


    // =================================================
    // MIJOZNING BARCHA SOTUVLARINI OLISH
    // =================================================

    const sales = await Sale.find({
      customerId: customerId
    }).sort({
      sana: 1,
      createdAt: 1,
      _id: 1
    });


    // =================================================
    // UMUMIY QARZNI HISOBLASH
    // =================================================

    let totalDebt = 0;

    for (const sale of sales) {

      const jami =
        Number(sale.jami || 0);

      const tolangan =
        Number(sale.tolangan || 0);

      const qarz =
        Math.max(
          0,
          jami - tolangan
        );

      totalDebt += qarz;
    }


    // =================================================
    // QARZ YO'Q
    // =================================================

    if (totalDebt <= 0) {
      return res.status(400).json({
        error: 'Bu mijozda qarz mavjud emas'
      });
    }


    // =================================================
    // TO'LOV QARZDAN KATTA BO'LSA
    // =================================================

    if (amount > totalDebt) {
      return res.status(400).json({
        error:
          'Kiritilgan summa qarzdan katta. ' +
          'Joriy qarz: ' +
          totalDebt.toLocaleString('ru-RU') +
          ' so\'m'
      });
    }


    // =================================================
    // TO'LOVNI ENG ESKI QARZLARGA TAQSIMLASH
    // =================================================

    let remaining =
      amount;

    const allocated = [];


    for (const sale of sales) {

      if (remaining <= 0) {
        break;
      }


      const jami =
        Number(sale.jami || 0);

      const oldPaid =
        Number(sale.tolangan || 0);

      const oldDebt =
        Math.max(
          0,
          jami - oldPaid
        );


      // Qarzi yo'q sotuvni o'tkazib yuboramiz
      if (oldDebt <= 0) {
        continue;
      }


      // Shu sotuvga tushadigan pul
      const paidHere =
        Math.min(
          remaining,
          oldDebt
        );


      // Yangi to'langan summa
      const newPaid =
        oldPaid + paidHere;


      // Sotuvni yangilash
      sale.tolangan =
        Math.min(
          jami,
          newPaid
        );


      sale.qarz =
        Math.max(
          0,
          jami - sale.tolangan
        );


      await sale.save();


      allocated.push({
        saleId: sale._id,
        paid: paidHere,
        remainingDebt: sale.qarz
      });


      remaining -=
        paidHere;
    }


    // =================================================
    // PAYMENT'NI DATABASE'GA SAQLASH
    // =================================================

    const payment =
      await Payment.create({
        customerId: customerId,
        sana: sana,
        amount: amount
      });


    // =================================================
    // YANGI UMUMIY QARZ
    // =================================================

    const newDebt =
      Math.max(
        0,
        totalDebt - amount
      );


    // =================================================
    // JAVOB
    // =================================================

    res.status(201).json({
      success: true,

      payment: payment,

      oldDebt: totalDebt,

      amount: amount,

      newDebt: newDebt,

      allocated: allocated
    });


  } catch (error) {

    console.error(
      'POST /payments ERROR:',
      error
    );

    res.status(500).json({
      error:
        error.message ||
        'To\'lovni saqlashda server xatosi'
    });
  }
});


// =====================================================
// TO'LOVNI O'CHIRISH
// =====================================================
//
// Agar kassa yozuvini o'chirish kerak bo'lsa,
// shu endpoint ishlatiladi.
// =====================================================

router.delete('/:id', auth, async (req, res) => {
  try {

    const payment =
      await Payment.findById(
        req.params.id
      );


    if (!payment) {
      return res.status(404).json({
        error: 'To\'lov topilmadi'
      });
    }


    const customerId =
      payment.customerId;

    const amount =
      Number(payment.amount || 0);


    // -----------------------------------------------
    // Paymentni o'chiramiz
    // -----------------------------------------------

    await Payment.findByIdAndDelete(
      req.params.id
    );


    // -----------------------------------------------
    // Mijozning sotuvlarini olish
    // -----------------------------------------------

    const sales =
      await Sale.find({
        customerId: customerId
      }).sort({
        sana: 1,
        createdAt: 1,
        _id: 1
      });


    // -----------------------------------------------
    // O'chirilgan to'lovni qayta qarzga qo'shamiz
    //
    // Eng yangi sotuvlardan boshlab qaytaramiz.
    // -----------------------------------------------

    let remaining =
      amount;


    for (
      let i = sales.length - 1;
      i >= 0 && remaining > 0;
      i--
    ) {

      const sale =
        sales[i];


      const jami =
        Number(sale.jami || 0);

      const tolangan =
        Number(sale.tolangan || 0);


      if (tolangan <= 0) {
        continue;
      }


      const restore =
        Math.min(
          remaining,
          tolangan
        );


      sale.tolangan =
        Math.max(
          0,
          tolangan - restore
        );


      sale.qarz =
        Math.max(
          0,
          jami - sale.tolangan
        );


      await sale.save();


      remaining -=
        restore;
    }


    res.json({
      success: true,
      message: 'To\'lov o\'chirildi'
    });


  } catch (error) {

    console.error(
      'DELETE /payments ERROR:',
      error
    );

    res.status(500).json({
      error:
        error.message ||
        'To\'lovni o\'chirishda xato'
    });
  }
});


module.exports = router;
