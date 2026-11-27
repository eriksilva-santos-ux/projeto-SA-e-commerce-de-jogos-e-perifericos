const CART_KEY = 'gamestore_cart';
    const ORDERS_KEY = 'gamestore_orders';
    const FREE_SHIPPING_MIN = 300;
    const SHIPPING_PRICE = 24.90;
    const MAX_QTY = 99;

    let currentPayment = 'pix';
    let cepValid = false;
    let couponDiscountRate = 0;
    let currentTotal = 0;

    /* ---------- Utilitários ---------- */
    function formatBRL(value) {
      return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const r2 = v => Math.round(v * 100) / 100;

    // Escapa texto antes de inserir via innerHTML (evita XSS / HTML quebrado)
    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function readStorage(key) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    }

    function writeStorage(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        alert('Não foi possível salvar os dados no navegador.');
      }
    }

    /* ---------- Carrinho ---------- */
    function getCart() {
      return readStorage(CART_KEY)
        .map(item => ({
          name: String(item?.name ?? 'Produto'),
          category: String(item?.category ?? ''),
          image: String(item?.image ?? ''),
          price: Number(item?.price),
          qty: Math.min(MAX_QTY, Math.floor(Number(item?.qty)))
        }))
        .filter(item => Number.isFinite(item.price) && item.price >= 0 && item.qty >= 1);
    }

    function saveCart(cart) {
      writeStorage(CART_KEY, cart);
      renderCart();
    }

    function getOrders() {
      return readStorage(ORDERS_KEY);
    }

    function updateQty(index, delta) {
      const cart = getCart();
      if (!cart[index]) return;

      cart[index].qty = Math.min(MAX_QTY, cart[index].qty + delta);
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
    }

    function removeItem(index) {
      const cart = getCart();
      cart.splice(index, 1);
      saveCart(cart);
    }

    function clearCart() {
      if (!confirm('Deseja realmente esvaziar o carrinho?')) return;
      localStorage.removeItem(CART_KEY);
      resetCheckoutState();
      renderCart();
    }

    // Zera cupom e CEP (usado ao esvaziar o carrinho ou concluir o pedido)
    function resetCheckoutState() {
      couponDiscountRate = 0;
      cepValid = false;
      document.getElementById('coupon-input').value = '';
      document.getElementById('coupon-feedback').innerText = '';
      document.getElementById('cep-input').value = '';
      document.getElementById('shipping-feedback').innerText = '';
    }

    /* ---------- Pagamento ---------- */
    function selectPayment(method, element) {
      currentPayment = method;
      document.querySelectorAll('.payment-option').forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-checked', 'false');
      });
      element.classList.add('active');
      element.setAttribute('aria-checked', 'true');
      document.querySelectorAll('.payment-panel').forEach(panel => panel.classList.add('d-none'));
      document.getElementById(`panel-${method}`).classList.remove('d-none');
      updateSummary();
    }

    /* ---------- Frete ---------- */
    function calculateShipping() {
      const cep = document.getElementById('cep-input').value.replace(/\D/g, '');
      const feedback = document.getElementById('shipping-feedback');

      if (cep.length !== 8) {
        cepValid = false;
        feedback.className = 'text-danger d-block mt-1';
        feedback.innerText = 'Digite um CEP válido com 8 dígitos.';
        updateSummary();
        return;
      }

      cepValid = true;
      updateSummary(); // o frete é recalculado sempre que o resumo muda
    }

    function getCartSubtotal(cart) {
      return r2(cart.reduce((acc, item) => acc + item.price * item.qty, 0));
    }

    // null = ainda não calculado
    function getShippingCost(subtotal) {
      if (!cepValid || subtotal <= 0) return null;
      return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_PRICE;
    }

    /* ---------- Cupom ---------- */
    function applyCoupon() {
      const code = document.getElementById('coupon-input').value.trim().toUpperCase();
      const feedback = document.getElementById('coupon-feedback');

      if (code === 'GAMER10') {
        couponDiscountRate = 0.10;
        feedback.className = 'text-success text-end mt-1 d-block';
        feedback.innerText = 'Cupom GAMER10 aplicado (10% de desconto)!';
      } else {
        couponDiscountRate = 0;
        feedback.className = 'text-danger text-end mt-1 d-block';
        feedback.innerText = 'Cupom inválido. Tente usar GAMER10.';
      }
      updateSummary();
    }

    /* ---------- Renderização ---------- */
    function renderCart() {
      const cart = getCart();
      const container = document.getElementById('cart-content');
      const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
      const isEmpty = cart.length === 0;

      document.getElementById('cart-badge').innerText = totalItems;
      document.getElementById('btn-clear-cart').classList.toggle('d-none', isEmpty);
      document.getElementById('payment-section').classList.toggle('d-none', isEmpty);
      document.getElementById('cart-actions').classList.toggle('d-none', isEmpty);
      document.getElementById('coupon-feedback').classList.toggle('d-none', isEmpty);
      document.getElementById('btn-checkout').disabled = isEmpty;

      if (isEmpty) {
        container.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-cart-x display-1 text-secondary mb-3 d-block"></i>
            <h5 class="text-white fw-bold">Seu carrinho está vazio</h5>
            <p class="text-secondary mb-4">Explore nossa loja e adicione os melhores jogos e periféricos ao seu setup!</p>
            <a href="index.html" class="btn btn-action px-4">Ir para a Loja</a>
          </div>
        `;
        updateSummary();
        return;
      }

      const rowsHTML = cart.map((item, index) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img src="${esc(item.image)}" onerror="this.onerror=null;this.src='https://placehold.co/64x64/121620/ff0055?text=Game'" class="img-product-thumb" alt="${esc(item.name)}">
              <div>
                <h6 class="mb-0 text-white fw-bold small">${esc(item.name)}</h6>
                ${item.category ? `<span class="badge bg-secondary small mt-1">${esc(item.category)}</span>` : ''}
              </div>
            </div>
          </td>
          <td class="text-center text-nowrap">${formatBRL(item.price)}</td>
          <td>
            <div class="input-group input-group-sm mx-auto" style="max-width: 105px;">
              <button onclick="updateQty(${index}, -1)" class="btn btn-outline-secondary text-white" type="button" aria-label="Diminuir quantidade">-</button>
              <input type="text" class="form-control bg-dark text-white text-center border-secondary" value="${item.qty}" readonly aria-label="Quantidade">
              <button onclick="updateQty(${index}, 1)" class="btn btn-outline-secondary text-white" type="button" aria-label="Aumentar quantidade">+</button>
            </div>
          </td>
          <td class="text-end fw-bold text-nowrap">${formatBRL(item.price * item.qty)}</td>
          <td class="text-center">
            <button onclick="removeItem(${index})" class="btn btn-sm btn-outline-danger border-0" title="Remover item" aria-label="Remover item">
              <i class="bi bi-trash fs-5"></i>
            </button>
          </td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-dark-custom align-middle mb-0">
            <thead>
              <tr class="text-secondary small">
                <th scope="col" style="min-width: 220px;">PRODUTO</th>
                <th scope="col" class="text-center">PREÇO</th>
                <th scope="col" class="text-center" style="min-width: 120px;">QTD</th>
                <th scope="col" class="text-end">SUBTOTAL</th>
                <th scope="col" class="text-center"></th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>
      `;

      updateSummary();
    }

    function updateSummary() {
      const cart = getCart();
      const subtotal = getCartSubtotal(cart);

      document.getElementById('summary-subtotal').innerText = formatBRL(subtotal);

      // Frete (sempre recalculado a partir do subtotal atual)
      const shipping = getShippingCost(subtotal);
      const shippingEl = document.getElementById('summary-shipping');
      const feedback = document.getElementById('shipping-feedback');

      if (shipping === null) {
        shippingEl.innerText = 'Informe o CEP';
        shippingEl.className = 'text-secondary';
        if (!cepValid && feedback.className.indexOf('text-danger') === -1) {
          feedback.innerText = '';
        }
      } else if (shipping === 0) {
        shippingEl.innerText = 'GRÁTIS';
        shippingEl.className = 'text-success fw-semibold';
        feedback.className = 'text-success d-block mt-1';
        feedback.innerText = `Frete Grátis ativado (pedidos acima de ${formatBRL(FREE_SHIPPING_MIN)})!`;
      } else {
        shippingEl.innerText = formatBRL(shipping);
        shippingEl.className = 'text-white';
        feedback.className = 'text-info d-block mt-1';
        feedback.innerText = 'Entrega Expressa: 2 a 4 dias úteis.';
      }

      // Cupom
      const couponValue = r2(subtotal * couponDiscountRate);
      const couponRow = document.getElementById('coupon-row');
      couponRow.classList.toggle('d-none', couponValue <= 0);
      if (couponValue > 0) {
        document.getElementById('summary-coupon').innerText = `- ${formatBRL(couponValue)}`;
      }

      // PIX
      const baseAmount = Math.max(0, r2(subtotal - couponValue));
      const pixDiscount = currentPayment === 'pix' ? r2(baseAmount * 0.05) : 0;
      const pixRow = document.getElementById('pix-discount-row');
      pixRow.classList.toggle('d-none', !(currentPayment === 'pix' && subtotal > 0));
      document.getElementById('summary-pix-discount').innerText = `- ${formatBRL(pixDiscount)}`;

      // Total
      const finalTotal = r2(baseAmount - pixDiscount + (shipping ?? 0));
      currentTotal = finalTotal;
      document.getElementById('summary-total').innerText = formatBRL(finalTotal);

      // Parcelas (preserva a opção escolhida pelo usuário)
      const installmentsSelect = document.getElementById('cc-installments');
      const hint = document.getElementById('installment-hint');
      const previous = installmentsSelect.value || '1';

      if (finalTotal > 0) {
        let optionsHTML = '';
        for (let i = 1; i <= 12; i++) {
          optionsHTML += `<option value="${i}">${i}x de ${formatBRL(finalTotal / i)} sem juros</option>`;
        }
        installmentsSelect.innerHTML = optionsHTML;
        installmentsSelect.value = previous;

        hint.innerText = currentPayment === 'credit'
          ? `ou em até 12x de ${formatBRL(finalTotal / 12)} sem juros`
          : 'Pagamento à vista';
      } else {
        installmentsSelect.innerHTML = '';
        hint.innerText = '';
      }
    }

    function renderHistory() {
      const orders = getOrders().slice().reverse();
      const container = document.getElementById('history-content');
      const paymentNames = { pix: 'PIX', credit: 'Cartão de Crédito', boleto: 'Boleto' };

      if (orders.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4">
            <i class="bi bi-bag-x display-3 text-secondary d-block mb-3"></i>
            <p class="text-secondary mb-0">Você ainda não fez nenhuma compra.</p>
          </div>`;
        return;
      }

      container.innerHTML = orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const installments = order.payment === 'credit' && order.installments > 1
          ? ` (${esc(order.installments)}x)` : '';
        return `
          <div class="card card-custom p-3 mb-3">
            <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
              <strong>Pedido #${esc(order.number)}</strong>
              <small class="text-secondary">${esc(order.date)}</small>
            </div>
            <ul class="small text-secondary mb-2 ps-3">
              ${items.map(i => `<li>${esc(i.qty)}x ${esc(i.name)}</li>`).join('')}
            </ul>
            <div class="d-flex justify-content-between">
              <span class="badge bg-secondary">${esc(paymentNames[order.payment] || order.payment)}${installments}</span>
              <strong class="text-danger">${formatBRL(order.total)}</strong>
            </div>
          </div>
        `;
      }).join('');
    }

    /* ---------- Validação do cartão ---------- */
    function luhnValid(number) {
      let sum = 0;
      let alt = false;
      for (let i = number.length - 1; i >= 0; i--) {
        let n = parseInt(number[i], 10);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      return sum % 10 === 0;
    }

    function validateCard() {
      const num = document.getElementById('cc-number').value.replace(/\D/g, '');
      const name = document.getElementById('cc-name').value.trim();
      const exp = document.getElementById('cc-exp').value.trim();
      const cvv = document.getElementById('cc-cvv').value.trim();

      if (!num || !name || !exp || !cvv) {
        return 'Por favor, preencha todos os dados do cartão de crédito para continuar.';
      }
      if (num.length < 13 || num.length > 19 || !luhnValid(num)) {
        return 'Número de cartão inválido.';
      }
      const match = exp.match(/^(\d{2})\/(\d{2})$/);
      if (!match) return 'Validade inválida. Use o formato MM/AA.';

      const month = parseInt(match[1], 10);
      const year = 2000 + parseInt(match[2], 10);
      const now = new Date();
      if (month < 1 || month > 12) return 'Mês de validade inválido.';
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        return 'Cartão vencido.';
      }
      if (!/^\d{3,4}$/.test(cvv)) return 'CVV inválido.';
      return null;
    }

    /* ---------- PIX: copiar chave ---------- */
    async function copyPix(button) {
      const input = document.getElementById('pix-key');
      try {
        await navigator.clipboard.writeText(input.value);
      } catch (e) {
        input.select();
        document.execCommand('copy');
      }
      const original = button.innerText;
      button.innerText = 'Copiado!';
      setTimeout(() => { button.innerText = original; }, 2000);
    }

    /* ---------- Finalização ---------- */
    function finishOrder() {
      const cart = getCart();
      if (cart.length === 0) return;

      if (!cepValid) {
        const feedback = document.getElementById('shipping-feedback');
        feedback.className = 'text-danger d-block mt-1';
        feedback.innerText = 'Informe o CEP para calcular o frete antes de finalizar.';
        document.getElementById('cep-input').focus();
        return;
      }

      if (currentPayment === 'credit') {
        const error = validateCard();
        if (error) {
          alert(error);
          return;
        }
      }

      const orderNumber = Date.now().toString().slice(-8);
      const total = currentTotal;
      const totalPaid = formatBRL(total);
      const installments = currentPayment === 'credit'
        ? parseInt(document.getElementById('cc-installments').value, 10) || 1
        : 1;
      const modalBody = document.getElementById('modal-order-body');

      // Salva o pedido no histórico (antes de limpar o carrinho)
      const orders = getOrders();
      orders.push({
        number: orderNumber,
        date: new Date().toLocaleString('pt-BR'),
        items: cart,
        payment: currentPayment,
        installments: installments,
        total: total
      });
      writeStorage(ORDERS_KEY, orders);

      if (currentPayment === 'pix') {
        modalBody.innerHTML = `
          <p class="text-secondary mb-2">Pedido <strong>#${orderNumber}</strong> gerado com sucesso!</p>
          <i class="bi bi-qr-code display-1 text-white my-3 d-block"></i>
          <p class="small text-secondary mb-2">Escaneie o QR Code acima ou copie a chave PIX abaixo para pagar <strong>${totalPaid}</strong>:</p>
          <div class="input-group input-group-sm mb-3">
            <input id="pix-key" type="text" class="form-control bg-secondary text-white border-0" value="00020126580014BR.GOV.BCB.PIX0136vortex-pagamentos-2026" readonly>
            <button class="btn btn-outline-light" type="button" onclick="copyPix(this)">Copiar</button>
          </div>
        `;
      } else if (currentPayment === 'credit') {
        modalBody.innerHTML = `
          <i class="bi bi-credit-card-2-front display-3 text-success mb-3 d-block"></i>
          <h5 class="fw-bold">Pagamento Aprovado!</h5>
          <p class="text-secondary">Seu pedido <strong>#${orderNumber}</strong> no valor de <strong>${totalPaid}</strong> (${installments}x) já está sendo preparado para envio.</p>
        `;
      } else {
        modalBody.innerHTML = `
          <i class="bi bi-upc-scan display-3 text-warning mb-3 d-block"></i>
          <h5 class="fw-bold">Boleto Gerado!</h5>
          <p class="text-secondary small">Pedido <strong>#${orderNumber}</strong> no valor de <strong>${totalPaid}</strong>.</p>
          <div class="bg-secondary bg-opacity-25 p-2 rounded font-monospace small mb-3">
            34191.79001 01043.510047 91020.150008 8 ${String(orderNumber).padStart(14, '0')}
          </div>
        `;
      }

      // Limpa carrinho e estado do checkout (cupom, CEP e dados do cartão)
      localStorage.removeItem(CART_KEY);
      ['cc-number', 'cc-name', 'cc-exp', 'cc-cvv'].forEach(id => { document.getElementById(id).value = ''; });
      resetCheckoutState();
      renderCart();
      renderHistory();

      bootstrap.Modal.getOrCreateInstance(document.getElementById('orderSuccessModal')).show();
    }

    /* ---------- Máscaras e eventos ---------- */
    document.getElementById('cc-number').addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    document.getElementById('cc-exp').addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/g, '$1/');
    });
    document.getElementById('cc-cvv').addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
    document.getElementById('cep-input').addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(?=\d)/g, '$1-');
      cepValid = false; // alterou o CEP: precisa confirmar de novo
      updateSummary();
    });

    // Enter nos campos de CEP e cupom
    document.getElementById('cep-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); calculateShipping(); }
    });
    document.getElementById('coupon-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); }
    });

    // Acessibilidade: seleciona forma de pagamento com Enter/Espaço
    document.querySelectorAll('.payment-option').forEach(el => {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });

    // Sincroniza se o carrinho/pedidos mudarem em outra aba
    window.addEventListener('storage', e => {
      if (e.key === CART_KEY) renderCart();
      if (e.key === ORDERS_KEY) renderHistory();
    });

    document.addEventListener('DOMContentLoaded', function () {
      renderCart();
      renderHistory();
    });