(function () {
  class Carrito {
    constructor({ currency = '€', productos = [] } = {}) {
      this.currency = currency;
      this._bySku = new Map();
      for (const p of productos) {
        const sku = (p.sku ?? p.SKU ?? '').toString();
        const title = p.title ?? '';
        const price = typeof p.price === 'number' ? p.price : parseFloat(p.price);
        const quantity = typeof p.quantity === 'number' ? p.quantity : 0;
        if (!sku) continue;
        this._bySku.set(sku, { sku, title, price, quantity });
      }
    }
    actualizarUnidades(sku, unidades) {
      if (!this._bySku.has(sku)) throw new Error(`SKU no encontrado: ${sku}`);
      const qty = Math.max(0, Number(unidades) || 0);
      const p = this._bySku.get(sku);
      p.quantity = qty;
      this._bySku.set(sku, p);
      return this.obtenerInformacionProducto(sku);
    }
    obtenerInformacionProducto(sku) {
      if (!this._bySku.has(sku)) return null;
      const { quantity, ...rest } = this._bySku.get(sku);
      return { ...rest, quantity };
    }
    obtenerCarrito() {
      const products = Array.from(this._bySku.values()).map(({ quantity, ...rest }) => ({ ...rest, quantity }));
      const total = products.reduce((acc, p) => acc + (p.price * (p.quantity || 0)), 0);
      return { total: Number(total.toFixed(2)), currency: this.currency, products };
    }
  }

  // Api
  
  const API_URL = 'https://jsonblob.com/api/1200000000000';
  const FALLBACK_DATA = {
    currency: '€',
    products: [
      { SKU: '0K3QOSOV4V', title: 'iFhone 13 Pro', price: '938.99' },
      { SKU: 'TGD5XORY1L', title: 'Cargador',      price: '49.99'  },
      { SKU: 'IOKW9BQ9F3', title: 'Funda de piel', price: '79.99'  },
    ]
  };

  const statusEl = document.getElementById('status');
  const productsEl = document.getElementById('products');
  const totalValueEl = document.getElementById('totalValue');

  function asNumber(x) {
    const n = typeof x === 'number' ? x : parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  }

  async function loadProducts() {
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Respuesta no OK');
      return await res.json();
    } catch (e) {
      console.warn('Fallo al cargar API, uso FALLBACK:', e.message);
      return FALLBACK_DATA;
    }
  }

  function renderProducts(data, carrito) {
    productsEl.innerHTML = '';
    const { products } = data;
    if (!products?.length) {
      productsEl.innerHTML = '<p>No hay productos.</p>';
      return;
    }

    for (const p of products) {
      const sku = p.SKU ?? p.sku;
      const title = p.title;
      const price = asNumber(p.price);

      const card = document.createElement('div');
      card.className = 'card';

      const rowTop = document.createElement('div');
      rowTop.className = 'row';
      const info = document.createElement('div');
      const titleEl = document.createElement('div');
      titleEl.className = 'title';
      titleEl.textContent = title;
      const skuEl = document.createElement('div');
      skuEl.className = 'sku';
      skuEl.textContent = `SKU: ${sku}`;
      info.appendChild(titleEl);
      info.appendChild(skuEl);

      const priceEl = document.createElement('div');
      priceEl.className = 'price';
      priceEl.textContent = `${price.toFixed(2)} ${data.currency || '€'}`;

      rowTop.appendChild(info);
      rowTop.appendChild(priceEl);

      const rowBottom = document.createElement('div');
      rowBottom.className = 'row';
      const label = document.createElement('label');
      label.textContent = 'Unidades:';
      label.setAttribute('for', `qty-${sku}`);
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '1';
      input.value = '0';
      input.id = `qty-${sku}`;

      rowBottom.appendChild(label);
      rowBottom.appendChild(input);

      card.appendChild(rowTop);
      card.appendChild(rowBottom);
      productsEl.appendChild(card);

      carrito.actualizarUnidades(sku, 0);

      input.addEventListener('input', () => {
        const val = Math.max(0, parseInt(input.value || '0', 10));
        input.value = String(val);
        try {
          carrito.actualizarUnidades(sku, val);
          renderTotal(carrito);
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  function renderTotal(carrito) {
    const { total, currency } = carrito.obtenerCarrito();
    totalValueEl.textContent = `${total.toFixed(2)} ${currency}`;
  }

  (async function init() {
    const data = await loadProducts();
    const normalized = {
      currency: data.currency || '€',
      productos: (data.products || []).map(p => ({
        sku: p.SKU ?? p.sku,
        title: p.title,
        price: asNumber(p.price),
        quantity: 0
      }))
    };
    const carrito = new Carrito(normalized);
    renderProducts(data, carrito);
    renderTotal(carrito);
  })();
})();