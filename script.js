// ==========================================
// ROTEAMENTO SINGLE PAGE APPLICATION (SPA)
// ==========================================
function checkRoute() {
    const isMainAdmin = window.location.hash === '#admin';
    const storefront = document.getElementById('app-storefront');
    const admin = document.getElementById('app-admin');

    if (isMainAdmin) {
        storefront.style.display = 'none';
        admin.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    } else {
        storefront.style.display = 'block';
        admin.style.display = 'none';
        document.body.style.overflow = 'auto';
        initStorefront(); 
    }
}
window.addEventListener('hashchange', checkRoute);

// ==========================================
// CURSOR CUSTOMIZADO E ANIMAÇÕES
// ==========================================
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
});

function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
}
animateRing();

// Efeito de hover grandioso para botões
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, a, .product-card, .service-card')) {
        cursor.style.width = '18px'; cursor.style.height = '18px';
        cursorRing.style.width = '54px'; cursorRing.style.height = '54px';
    }
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest('button, a, .product-card, .service-card')) {
        cursor.style.width = '10px'; cursor.style.height = '10px';
        cursorRing.style.width = '36px'; cursorRing.style.height = '36px';
    }
});

// Toast Notifications
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// Reveal Animation Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

// ==========================================
// LOADER DE BOAS VINDAS
// ==========================================
window.addEventListener('load', () => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    document.getElementById('loadSub').style.opacity = '1';
    document.getElementById('loadFill').style.width = '100%';
    
    const letters = document.querySelectorAll('#loader .load-text span');
    letters.forEach((l, i) => {
        setTimeout(() => { l.style.transform = 'translateY(0)'; l.style.opacity = '1'; }, i * 100);
    });

    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => { 
            document.getElementById('loader').style.display = 'none'; 
            checkRoute(); // Decide se vai pro Store ou Admin
        }, 600);
    }, 2000);
});

// ==========================================
// DADOS DOS PRODUTOS & LÓGICA DO CARRINHO
// ==========================================
const mockProducts = [
    { id: 1, name: 'Câmbio Traseiro Shimano Deore', cat: 'pecas', price: 349, emoji: '⚙️' },
    { id: 2, name: 'Pneu Maxxis Ardent 29"', cat: 'pecas', price: 189, emoji: '🟤' },
    { id: 3, name: 'Capacete MTB Fox', cat: 'acessorios', price: 590, emoji: '⛑️' },
    { id: 4, name: 'Bicicleta Caloi Explorer Sport', cat: 'bikes', price: 2890, emoji: '🚲' },
    { id: 5, name: 'Luz Dianteira Cygolite', cat: 'acessorios', price: 220, emoji: '💡' }
];

let cart = [];

function initStorefront() {
    renderProducts('todos');
}

function renderProducts(filter) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    const filtered = filter === 'todos' ? mockProducts : mockProducts.filter(p => p.cat === filter);
    
    grid.innerHTML = filtered.map(p => `
      <div class="product-card">
        <div class="product-img">
          <div class="product-img-placeholder">${p.emoji}</div>
          <div class="product-actions-overlay">
            <button class="product-add-btn" onclick="addToCart(${p.id})">ADICIONAR AO CARRINHO</button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">R$ ${p.price.toLocaleString('pt-BR')}</div>
        </div>
      </div>
    `).join('');
}

function filterProducts(filter, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(filter);
}

// Carrinho de Compras
function addToCart(id) {
    const product = mockProducts.find(p => p.id === id);
    const existing = cart.find(c => c.id === id);
    if (existing) { existing.qty++; } else { cart.push({ ...product, qty: 1 }); }
    updateCart();
    showToast(`${product.emoji} ${product.name} adicionado!`);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    updateCart();
}

function updateCart() {
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartTotal').textContent = `R$ ${total.toLocaleString('pt-BR')}`;

    const itemsEl = document.getElementById('cartItems');
    if (cart.length === 0) {
        itemsEl.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🚲</div><div class="cart-empty-text">Carrinho vazio</div></div>`;
    } else {
        itemsEl.innerHTML = cart.map(c => `
        <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid var(--border); color: var(--white); font-family: var(--font-condensed);">
          <div>${c.qty}x ${c.name}</div>
          <div style="color: var(--orange);">R$ ${c.price * c.qty} 
            <button onclick="removeFromCart(${c.id})" style="background:none; border:none; color:var(--gray); cursor:pointer; margin-left: 10px;">✕</button>
          </div>
        </div>
      `).join('');
    }
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('open');
}

function checkout() {
    if (cart.length === 0) { showToast('⚠️ Seu carrinho está vazio!'); return; }
    showToast('✅ Pedido processado com sucesso!');
    cart = []; updateCart(); toggleCart();
}

function submitForm() {
    const nome = document.getElementById('c-nome').value;
    const email = document.getElementById('c-email').value;
    const msg = document.getElementById('c-msg').value;

    if(!nome || !email || !msg) {
        showToast('⚠️ Preencha nome, e-mail e mensagem.'); return;
    }
    
    showToast('✉️ Mensagem enviada! Responderemos em breve.');
    document.getElementById('c-nome').value = '';
    document.getElementById('c-email').value = '';
    document.getElementById('c-msg').value = '';
    document.getElementById('c-tel').value = '';
}

// ==========================================
// LÓGICA DO ADMIN
// ==========================================
function doLogin() {
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'ENTRANDO...';
    setTimeout(() => {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-container').style.display = 'flex';
        showToast('✅ Login realizado como Admin!');
    }, 800);
}

function doLogout() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-container').style.display = 'none';
    document.getElementById('loginBtn').textContent = 'ENTRAR →';
    window.location.hash = ''; // Redireciona de volta para a loja
}

function showView(viewName, btnElement) {
    document.querySelectorAll('#app-admin .view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('#app-admin .nav-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById('view-' + viewName).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
    document.getElementById('topbarTitle').textContent = viewName.toUpperCase();
}