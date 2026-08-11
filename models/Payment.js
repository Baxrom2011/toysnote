function openDateCashModal(customerId, sana) {
  if (!customerId || !sana) {
    alert("Mijoz va sanani tanlang.");
    return;
  }

  const customer = state.customers.find(
    c => c._id === customerId
  );

  if (!customer) {
    alert("Mijoz topilmadi.");
    return;
  }

  // Mijozning BARCHA sanalardagi umumiy qarzi
  const debt = getCustomerDebt(customerId);

  if (debt <= 0) {
    alert("Bu mijozda qarz mavjud emas.");
    return;
  }

  const overlay = document.createElement("div");

  overlay.className = "modal-overlay";
  overlay.id = "dateCashOverlay";

  overlay.innerHTML = `
    <div class="modal-card glass cash-modal">

      <div class="cash-modal-head">

        <div>
          <div class="cash-kicker">
            Kassa
          </div>

          <h3>
            ${customer.name}
          </h3>

          <div style="
            color:var(--text-secondary);
            font-size:13px;
            margin-top:4px;
          ">
            Joriy qarz:
            <strong style="color:#D07268;">
              ${fmt(debt)} so'm
            </strong>
          </div>
        </div>

        <button
          type="button"
          class="modal-close"
          id="dateCashCancel"
        >
          ×
        </button>

      </div>


      <form id="dateCashForm">

        <div class="field">

          <label>
            Pul olingan sana
          </label>

          <input
            type="date"
            id="dateCashSana"
            value="${sana}"
            required
          >

        </div>


        <div class="field">

          <label>
            Olingan summa (so'm)
          </label>

          <input
            type="number"
            id="dateCashAmount"
            min="1"
            max="${debt}"
            step="1"
            required
            placeholder="0"
          >

        </div>


        <div class="cash-debt-box">

          <span>
            Joriy qarz
          </span>

          <strong>
            ${fmt(debt)} so'm
          </strong>

        </div>


        <div class="modal-actions">

          <button
            type="button"
            class="btn btn-secondary"
            id="dateCashCancel2"
          >
            Bekor qilish
          </button>

          <button
            type="submit"
            class="cash-button"
          >
            Kassaga kiritish
          </button>

        </div>

      </form>

    </div>
  `;

  document.body.appendChild(overlay);


  const close = () => {
    document
      .getElementById("dateCashOverlay")
      ?.remove();
  };


  document
    .getElementById("dateCashCancel")
    ?.addEventListener("click", close);

  document
    .getElementById("dateCashCancel2")
    ?.addEventListener("click", close);


  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      close();
    }
  });


  // ==================================================
  // KASSA SAQLASH
  // ==================================================

  document
    .getElementById("dateCashForm")
    ?.addEventListener("submit", async e => {

      e.preventDefault();

      const paymentDate =
        document.getElementById(
          "dateCashSana"
        ).value;

      const amount =
        Number(
          document.getElementById(
            "dateCashAmount"
          ).value
        );


      if (!paymentDate) {
        alert("Pul olingan sanani tanlang.");
        return;
      }


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        alert("To'g'ri summa kiriting.");
        return;
      }


      if (amount > debt) {
        alert(
          "Kiritilgan summa qarzdan katta.\n\n" +
          "Qarz: " +
          fmt(debt) +
          " so'm"
        );

        return;
      }


      try {

        // ==================================================
        // MUHIM:
        //
        // Faqat addPayment() chaqiriladi.
        //
        // Backend:
        // 1. Payment'ni database'ga saqlaydi
        // 2. Mijozning eski qarzlarini kamaytiradi
        // 3. Sale'larni yangilaydi
        //
        // Shu sabab frontendda updateSale() QILMAYMIZ.
        // Aks holda qarz ikki marta kamayishi mumkin.
        // ==================================================

        const result =
          await addPayment(
            customerId,
            paymentDate,
            amount
          );


        // Database'dan yangilangan ma'lumotlarni olamiz
        await loadData();


        // Modalni yopamiz
        close();


        // Sahifani yangilaymiz
        render();


        alert(
          "Kassa saqlandi!\n\n" +

          "Mijoz: " +
          customer.name +
          "\n" +

          "Sana: " +
          paymentDate +
          "\n" +

          "Olingan summa: " +
          fmt(amount) +
          " so'm\n\n" +

          "Qolgan qarz: " +
          fmt(
            result.newDebt !== undefined
              ? result.newDebt
              : Math.max(0, debt - amount)
          ) +
          " so'm"
        );


      } catch (err) {

        console.error(
          "Kassa saqlash xatosi:",
          err
        );

        alert(
          "Kassani saqlashda xato:\n\n" +
          err.message
        );

      }

    });
}
