document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Management ---
  const themeToggle = document.getElementById('theme-toggle');
  
  // Check local storage or system preference
  const savedTheme = localStorage.getItem('shopTheme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = savedTheme ? savedTheme : (systemDark ? 'dark' : 'light');
  
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
  }
  
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('shopTheme', currentTheme);
    applyTheme(currentTheme);
  });

  // --- Application State ---
  let currentCurrency = 'USD';
  let cart = [];
  let currentCalculation = null;

  // --- DOM Elements ---
  const form = document.getElementById('calc-form');
  const currencySelect = document.getElementById('currencySelect');
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const btnAddCart = document.getElementById('btn-add-cart');
  const btnInvoice = document.getElementById('btn-invoice');

  // --- Currency Formatter ---
  function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentCurrency
    }).format(amount);
  }

  // --- Tab Logic ---
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  // --- Core Calculation Logic ---
  function calculateMath() {
    const cp = parseFloat(document.getElementById('buyingPrice').value) || 0;
    const qty = parseInt(document.getElementById('quantity').value, 10) || 1;
    const includeVat = document.getElementById('includeVat').checked;
    const marginVal = parseFloat(document.getElementById('marginValue').value) || 0;
    const marginType = document.getElementById('marginType').value;
    const discountVal = parseFloat(document.getElementById('discountValue').value) || 0;
    const discountType = document.getElementById('discountType').value;

    const vatRate = 0.13;
    const vatAmount = includeVat ? cp * vatRate : 0;
    const priceWithVat = cp + vatAmount;

    let marginAmount = marginType === 'percent' ? priceWithVat * (marginVal / 100) : marginVal;
    const mrp = priceWithVat + marginAmount;

    let discountAmount = discountType === 'percent' ? mrp * (discountVal / 100) : discountVal;
    const finalSP = Math.max(0, mrp - discountAmount);

    const netProfitPerUnit = finalSP - priceWithVat;
    const totalProfit = netProfitPerUnit * qty;

    currentCalculation = { cp, vatAmount, marginAmount, discountAmount, finalSP, qty, totalProfit };
    updateCalculatorUI();
  }

  function updateCalculatorUI() {
    if(!currentCalculation) return;
    const { cp, vatAmount, marginAmount, discountAmount, finalSP, totalProfit } = currentCalculation;

    document.getElementById('res-unit-cp').textContent = formatMoney(cp);
    document.getElementById('res-unit-vat').textContent = formatMoney(vatAmount);
    document.getElementById('res-unit-margin').textContent = formatMoney(marginAmount);
    document.getElementById('res-unit-discount').textContent = `-${formatMoney(discountAmount)}`;
    document.getElementById('res-unit-final-sp').textContent = formatMoney(finalSP);
    
    const profitEl = document.getElementById('res-total-profit');
    const badgeEl = document.getElementById('profit-badge');
    profitEl.textContent = formatMoney(Math.abs(totalProfit));

    if (totalProfit >= 0) {
      badgeEl.textContent = 'Profit';
      badgeEl.style.background = 'var(--success-bg)';
      badgeEl.style.color = 'var(--success-color)';
      profitEl.style.color = 'var(--success-color)';
    } else {
      badgeEl.textContent = 'Loss';
      badgeEl.style.background = 'var(--danger-bg)';
      badgeEl.style.color = 'var(--danger-color)';
      profitEl.style.color = 'var(--danger-color)';
    }
  }

  // --- Shopping Cart Logic ---
  function renderCart() {
    const tbody = document.getElementById('cart-body');
    const countEl = document.getElementById('cart-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    tbody.innerHTML = '';
    countEl.textContent = cart.length;

    if (cart.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Cart is empty. Add items from the calculator.</td></tr>';
      subtotalEl.textContent = formatMoney(0);
      totalEl.textContent = formatMoney(0);
      btnInvoice.disabled = true;
      return;
    }

    btnInvoice.disabled = false;
    let grandTotal = 0;

    cart.forEach((item, index) => {
      const lineTotal = item.finalSP * item.qty;
      grandTotal += lineTotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.finalSP)}</td>
        <td><strong>${formatMoney(lineTotal)}</strong></td>
        <td><button class="remove-btn" onclick="removeFromCart(${index})">X</button></td>
      `;
      tbody.appendChild(tr);
    });

    subtotalEl.textContent = formatMoney(grandTotal);
    totalEl.textContent = formatMoney(grandTotal); 
  }

  window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
  };

  btnAddCart.addEventListener('click', () => {
    if(!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const itemName = document.getElementById('itemName').value || 'Unnamed Item';
    
    cart.push({
      name: itemName,
      qty: currentCalculation.qty,
      finalSP: currentCalculation.finalSP
    });

    document.getElementById('itemName').value = '';
    renderCart();
    
    // Auto-switch to cart tab for visual feedback
    tabs[1].click();
  });

  // --- Invoice Generation (Print) ---
  btnInvoice.addEventListener('click', () => {
    const invoiceBody = document.getElementById('invoice-body');
    const invoiceTotal = document.getElementById('invoice-grand-total');
    const dateEl = document.getElementById('invoice-date');
    
    dateEl.textContent = new Date().toLocaleDateString();
    invoiceBody.innerHTML = '';
    let grandTotal = 0;

    cart.forEach(item => {
      const lineTotal = item.finalSP * item.qty;
      grandTotal += lineTotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.finalSP)}</td>
        <td>${formatMoney(lineTotal)}</td>
      `;
      invoiceBody.appendChild(tr);
    });

    invoiceTotal.textContent = formatMoney(grandTotal);
    window.print();
  });

  // --- Event Listeners ---
  form.addEventListener('input', calculateMath);
  document.getElementById('includeVat').addEventListener('change', calculateMath);
  currencySelect.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    calculateMath();
    renderCart();
  });

  // Init calculations on load
  calculateMath();
  renderCart();
});