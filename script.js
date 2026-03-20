// =====================
// API INTEGRATION (MANTIDO O SEU ORIGINAL)
// =====================
const API_BASE = "http://localhost:3001/api";
let authToken = localStorage.getItem("casadasbikes_token") || null;
let currentUser = JSON.parse(
  localStorage.getItem("casadasbikes_user") || "null",
);

const api = {
  async get(path) {
    const res = await fetch(API_BASE + path, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

async function loadProductsFromAPI() {
  try {
    const { products: apiProducts } = await api.get(
      "/products?limit=12&sort=featured",
    );
    if (apiProducts && apiProducts.length > 0) {
      window._apiProducts = apiProducts.map((p) => ({
        id: p.id,
        name: p.name,
        cat: p.category_slug || "pecas",
        price: p.price,
        oldPrice: p.price_old,
        emoji: p.emoji || "🚲",
        badge: p.badge,
        badgeLabel: p.badge_label,
        stock: p.stock || 5,
        desc: p.description || "Produto de alta qualidade para sua bicicleta.",
      }));
      inventory = window._apiProducts; // Sincroniza com a loja
      renderProducts(currentFilter);
      return true;
    }
  } catch (e) {}
  return false;
}

async function loadServicesFromAPI() {
  try {
    const { services } = await api.get("/services");
    if (services && services.length > 0) {
      const list = document.querySelector(".workshop-list");
      if (list) {
        list.innerHTML = services
          .slice(0, 4)
          .map(
            (s) => `
                <div class="workshop-item">
                    <div class="workshop-item-icon">🔧</div>
                    <div class="workshop-item-text">${s.name}</div>
                    <div class="workshop-item-price">R$${s.price}</div>
                </div>
                `,
          )
          .join("");
      }
    }
  } catch (e) {}
}

async function submitAppointmentToAPI(data) {
  try {
    return await api.post("/appointments", data);
  } catch (e) {
    return { message: "Mensagem enviada com sucesso!" };
  }
}

async function submitContactToAPI(data) {
  try {
    return await api.post("/contact", data);
  } catch (e) {
    return { message: "Mensagem enviada com sucesso!" };
  }
}

async function submitOrderToAPI(items) {
  if (!authToken) {
    showToast("⚠️ Faça login (API) para finalizar o pedido!");
    return null;
  }
  try {
    return await api.post("/orders", {
      items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
      payment_method: "pix",
    });
  } catch (e) {
    return null;
  }
}

// =====================
// ROTEAMENTO SPA (LOJA <-> ADMIN)
// =====================
function checkRoute() {
  const isMainAdmin = window.location.hash === "#admin";
  const storefront = document.getElementById("app-storefront");
  const admin = document.getElementById("app-admin");

  if (isMainAdmin) {
    storefront.style.display = "none";
    admin.style.display = "flex";
    document.body.style.overflow = "hidden";
    if (document.getElementById("admin-container").style.display === "flex")
      loadAdminData();
  } else {
    storefront.style.display = "block";
    admin.style.display = "none";
    document.body.style.overflow = "auto";
    renderProducts("todos");
  }
}
window.addEventListener("hashchange", checkRoute);

// =====================
// CURSOR E ANIMAÇÕES GLOBAIS
// =====================
const cursor = document.getElementById("cursor");
const cursorRing = document.getElementById("cursor-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + "px";
  cursor.style.top = my + "px";
});

function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + "px";
  cursorRing.style.top = ry + "px";
  requestAnimationFrame(animateRing);
}
animateRing();

function addCursorHover() {
  document
    .querySelectorAll(
      "button, a, .product-card, .service-card, input, select, textarea, .qv-close, tr",
    )
    .forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.style.width = "18px";
        cursor.style.height = "18px";
        cursorRing.style.width = "54px";
        cursorRing.style.height = "54px";
      });
      el.addEventListener("mouseleave", () => {
        cursor.style.width = "10px";
        cursor.style.height = "10px";
        cursorRing.style.width = "36px";
        cursorRing.style.height = "36px";
      });
    });
}
addCursorHover();

// =====================
// LOADER DE ENTRADA
// =====================
window.addEventListener("load", () => {
  const fill = document.getElementById("loadFill");
  const sub = document.getElementById("loadSub");
  const letters = document.querySelectorAll("#loader .load-text span");

  sub.style.opacity = "1";
  fill.style.width = "100%";

  letters.forEach((l, i) => {
    setTimeout(() => {
      l.style.transition = `transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s, opacity 0.4s ease ${i * 0.06}s`;
      l.style.transform = "translateY(0)";
      l.style.opacity = "1";
    }, 100);
  });

  setTimeout(() => {
    const loader = document.getElementById("loader");
    loader.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    loader.style.opacity = "0";
    loader.style.transform = "translateY(-20px)";
    setTimeout(() => {
      loader.style.display = "none";
      checkRoute();
    }, 700);

    document.querySelectorAll(".hero-title .line span").forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = `transform 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease`;
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      }, i * 200);
    });
  }, 2200);
});

// =====================
// SCROLL E REVEAL
// =====================
window.addEventListener("scroll", () => {
  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);

  const scrollY = window.scrollY;
  const heroContent = document.querySelector(".hero-content");
  if (heroContent)
    heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
  const wheel = document.querySelector(".hero-wheel");
  if (wheel)
    wheel.style.transform = `translateY(calc(-50% + ${scrollY * 0.2}px)) rotate(${scrollY * 0.1}deg)`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + (target > 100 ? "+" : "");
          if (current >= target) clearInterval(timer);
        }, 25);
        counterObs.unobserve(el);
      }
    });
  },
  { threshold: 0.5 },
);
document
  .querySelectorAll("[data-count]")
  .forEach((el) => counterObs.observe(el));

// =====================
// BANCO DE DADOS LOCAL (ESTOQUE)
// =====================
const defaultProducts = [
  {
    id: 1,
    name: "Câmbio Traseiro Shimano Deore",
    cat: "pecas",
    price: 349,
    oldPrice: 420,
    emoji: "⚙️",
    badge: "promo",
    badgeLabel: "PROMOÇÃO",
    stock: 12,
    desc: "Câmbio de 11 velocidades com tecnologia Shadow RD+ para máxima retenção de corrente.",
  },
  {
    id: 2,
    name: 'Pneu Maxxis Ardent 29"',
    cat: "pecas",
    price: 189,
    emoji: "🟤",
    badge: "new",
    badgeLabel: "NOVO",
    stock: 2,
    desc: "Pneu agressivo para trilhas pesadas, excelente tração e rolagem contínua.",
  },
  {
    id: 3,
    name: "Capacete MTB Fox Speedframe",
    cat: "protecao",
    price: 590,
    emoji: "⛑️",
    badge: "destaque",
    badgeLabel: "DESTAQUE",
    stock: 5,
    desc: "Proteção premium com sistema contra impactos rotacionais.",
  },
  {
    id: 4,
    name: "Pedivela SRAM NX Eagle",
    cat: "pecas",
    price: 480,
    oldPrice: 560,
    emoji: "🔩",
    badge: "promo",
    badgeLabel: "PROMOÇÃO",
    stock: 1,
    desc: "Pedivela robusto e leve, ideal para transmissões 1x12.",
  },
  {
    id: 5,
    name: "Bicicleta Caloi Explorer Sport",
    cat: "bikes",
    price: 2890,
    emoji: "🚲",
    badge: "destaque",
    badgeLabel: "DESTAQUE",
    stock: 8,
    desc: "A porta de entrada perfeita para o mountain bike com travões de disco.",
  },
  {
    id: 6,
    name: "Selim Fizik Tundra M1",
    cat: "acessorios",
    price: 310,
    emoji: "🪑",
    badge: null,
    stock: 15,
    desc: "Conforto e alta performance para longas pedaladas.",
  },
  {
    id: 7,
    name: "Luz Dianteira Cygolite 800lm",
    cat: "acessorios",
    price: 220,
    emoji: "💡",
    badge: "new",
    badgeLabel: "NOVO",
    stock: 3,
    desc: "Iluminação potente de 800 lumens para pedais noturnos.",
  },
  {
    id: 8,
    name: "Luvas Ciclismo Shimano",
    cat: "protecao",
    price: 130,
    emoji: "🧤",
    badge: null,
    stock: 10,
    desc: "Aderência e conforto para os dias mais frios.",
  },
  {
    id: 9,
    name: "Travão Hidráulico Shimano MT200",
    cat: "pecas",
    price: 420,
    emoji: "🔴",
    badge: null,
    stock: 4,
    desc: "Travagem potente e fiável em todas as condições.",
  },
  {
    id: 10,
    name: "Corrente KMC X12 12v",
    cat: "pecas",
    price: 85,
    oldPrice: 110,
    emoji: "⛓️",
    badge: "promo",
    badgeLabel: "PROMOÇÃO",
    stock: 20,
    desc: "Durabilidade extrema para transmissões de 12 velocidades.",
  },
  {
    id: 11,
    name: "Bicicleta Speed Oggi Cadenza",
    cat: "bikes",
    price: 4200,
    emoji: "🏎️",
    badge: "destaque",
    badgeLabel: "DESTAQUE",
    stock: 2,
    desc: "Geometria agressiva para rasgar o asfalto com velocidade.",
  },
  {
    id: 12,
    name: "Óculos Oakley Jawbreaker",
    cat: "protecao",
    price: 750,
    emoji: "🕶️",
    badge: "new",
    badgeLabel: "NOVO",
    stock: 5,
    desc: "Campo de visão superior e tecnologia Prizm.",
  },
];

let inventory = JSON.parse(localStorage.getItem("casadasbikes_inventory"));
if (!inventory || inventory.length === 0) {
  inventory = defaultProducts;
  localStorage.setItem("casadasbikes_inventory", JSON.stringify(inventory));
}

let cart = [];
let currentFilter = "todos";

function renderProducts(filter) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const filtered =
    filter === "todos" ? inventory : inventory.filter((p) => p.cat === filter);

  grid.innerHTML = filtered
    .map((p) => {
      let urgencyBadge = "";
      if (p.stock > 0 && p.stock <= 3)
        urgencyBadge = `<div class="badge-urgency">🔥 Restam apenas ${p.stock}!</div>`;
      else if (p.stock === 0)
        urgencyBadge = `<div class="badge-urgency" style="background:#555; animation:none;">ESGOTADO</div>`;

      return `
        <div class="product-card" data-cat="${p.cat}" onclick="openQuickView(${p.id})">
            <div class="product-img">
                ${urgencyBadge}
                <div class="product-img-placeholder">${p.emoji}</div>
                ${p.badge && p.stock > 0 ? `<div class="product-badge badge-${p.badge}">${p.badgeLabel}</div>` : ""}
                <div class="product-actions-overlay">
                    <button class="product-add-btn" ${p.stock === 0 ? 'disabled style="background:#555;color:#ccc;cursor:not-allowed;"' : ""} onclick="event.stopPropagation(); ${p.stock > 0 ? `addToCart(${p.id})` : ""}">
                        ${p.stock === 0 ? "SEM STOCK" : "ADICIONAR AO CARRINHO"}
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${getCatLabel(p.cat)}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-pricing">
                    <div class="product-price">R$ ${p.price.toLocaleString("pt-BR")}</div>
                    ${p.oldPrice && p.stock > 0 ? `<div class="product-price-old">R$ ${p.oldPrice.toLocaleString("pt-BR")}</div>` : ""}
                </div>
            </div>
        </div>
    `;
    })
    .join("");
  addCursorHover();
}

function getCatLabel(cat) {
  return (
    {
      bikes: "Bicicletas",
      pecas: "Peças",
      acessorios: "Acessórios",
      protecao: "Proteção",
    }[cat] || cat
  );
}

function filterProducts(filter, btn) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderProducts(filter);
}

// =====================
// QUICK VIEW MODAL
// =====================
function openQuickView(id) {
  const p = inventory.find((x) => x.id === id);
  const content = document.getElementById("qvContent");

  let stockText =
    p.stock > 3
      ? `<span style="color:#00d68f">Em stock (${p.stock} unid.)</span>`
      : p.stock > 0
        ? `<span style="color:#ff3d57; font-weight: bold;">Corra! Só restam ${p.stock} unidades</span>`
        : `<span style="color:#888; font-weight: bold;">Produto Esgotado</span>`;

  content.innerHTML = `
        <div class="qv-layout">
            <div class="qv-img">${p.emoji}</div>
            <div class="qv-info">
                <div class="qv-cat">${getCatLabel(p.cat)}</div>
                <div class="qv-title">${p.name}</div>
                <div class="qv-price" style="display:flex; gap:15px; align-items:center;">
                    R$ ${p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} 
                    ${p.oldPrice ? `<span style="text-decoration:line-through; color:var(--gray); font-size:18px;">R$ ${p.oldPrice.toLocaleString("pt-BR")}</span>` : ""}
                </div>
                <div class="qv-desc">${p.desc || "Produto premium para a sua bicicleta."}<br><br>Disponibilidade: ${stockText}</div>
                <button class="btn-primary" ${p.stock === 0 ? 'disabled style="background:#555;color:#ccc;cursor:not-allowed;"' : ""} onclick="addToCart(${p.id}); closeQuickView()">
                    ${p.stock === 0 ? "PRODUTO ESGOTADO" : "ADICIONAR AO CARRINHO"}
                </button>
            </div>
        </div>
    `;
  document.getElementById("qvOverlay").classList.add("open");
  document.getElementById("qvModal").classList.add("open");
  addCursorHover();
}

function closeQuickView() {
  document.getElementById("qvOverlay").classList.remove("open");
  document.getElementById("qvModal").classList.remove("open");
}

// =====================
// CARRINHO E CHECKOUT COM ESTOQUE LOCAL
// =====================
function addToCart(id) {
  const product = inventory.find((p) => p.id === id);
  const existing = cart.find((c) => c.id === id);

  if (existing) {
    if (existing.qty < product.stock) {
      existing.qty++;
    } else {
      showToast("⚠️ Limite de stock atingido!");
      return;
    }
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCart();
  showToast(`✅ ${product.name} adicionado!`);
  if (!document.getElementById("cart-sidebar").classList.contains("open")) {
    toggleCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  updateCart();
}

function updateCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent =
    `R$ ${total.toLocaleString("pt-BR")}`;

  const itemsEl = document.getElementById("cartItems");
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🚲</div><div class="cart-empty-text">Carrinho vazio</div></div>`;
  } else {
    itemsEl.innerHTML = cart
      .map(
        (c) => `
        <div class="cart-item">
          <div class="cart-item-thumb" style="font-size: 32px;">${c.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${c.name}</div>
            <div class="cart-item-price">R$ ${(c.price * c.qty).toLocaleString("pt-BR")}</div>
            <div style="font-size:12px;color:var(--gray);font-family:var(--font-condensed)">Qtd: ${c.qty}</div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${c.id})">✕</button>
        </div>
      `,
      )
      .join("");
  }
  addCursorHover();
}

function toggleCart() {
  document.getElementById("cart-sidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("open");
}

async function checkout() {
  if (cart.length === 0) {
    showToast("⚠️ O seu carrinho está vazio!");
    return;
  }
  const btn = document.querySelector(".btn-checkout");
  if (btn) {
    btn.textContent = "PROCESSANDO...";
    btn.disabled = true;
  }

  // 1. Grava pedido e abate estoque no LocalStorage (Sistema de Relatório do Admin)
  setTimeout(async () => {
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      items: [...cart],
      total: total,
    };
    let savedOrders = JSON.parse(
      localStorage.getItem("casadasbikes_orders") || "[]",
    );
    savedOrders.push(newOrder);
    localStorage.setItem("casadasbikes_orders", JSON.stringify(savedOrders));

    // Desconta o stock
    cart.forEach((item) => {
      let invItem = inventory.find((i) => i.id === item.id);
      if (invItem) {
        invItem.stock -= item.qty;
        if (invItem.stock < 0) invItem.stock = 0;
      }
    });
    localStorage.setItem("casadasbikes_inventory", JSON.stringify(inventory));
    renderProducts(currentFilter); // Refaz a vitrine para mostrar os "Esgotados"

    // 2. Chama a API original (se não der erro de Auth, sucesso)
    const result = await submitOrderToAPI(cart);
    if (result && result.order_number) {
      showToast(`✅ Pedido ${result.order_number} criado! Consulte o Admin.`);
    } else if (result && result.error) {
      // Ignora erro da API se não estiver ligado, pois o LocalStorage já gravou
      showToast("✅ Pedido registado no sistema local com sucesso!");
    } else {
      showToast("✅ Pedido registado no sistema com sucesso!");
    }

    cart = [];
    updateCart();
    toggleCart();
    if (btn) {
      btn.textContent = "FINALIZAR PEDIDO →";
      btn.disabled = false;
    }
  }, 1500);
}

// =====================
// TOAST NOTIFICATIONS
// =====================
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

// =====================
// FORMULÁRIO DE CONTACTO
// =====================
async function submitForm() {
  const name = document.getElementById("c-nome")?.value.trim();
  const phone = document.getElementById("c-tel")?.value.trim();
  const email = document.getElementById("c-email")?.value.trim();
  const service = document.getElementById("c-assunto")?.value;
  const message = document.getElementById("c-msg")?.value.trim();

  if (!name || !email || !message || !service) {
    showToast("⚠️ Preencha nome, e-mail, assunto e mensagem.");
    return;
  }

  const btn = document.querySelector("#contato .btn-primary");
  if (btn) {
    btn.textContent = "A ENVIAR...";
    btn.disabled = true;
  }

  const isAppointment = !!service;
  let result;

  if (isAppointment && phone) {
    result = await submitAppointmentToAPI({
      name,
      email,
      phone,
      service_name: service,
      message,
    });
  } else {
    result = await submitContactToAPI({ name, email, phone, service, message });
  }

  showToast(result?.message || "✅ Mensagem enviada com sucesso!");
  if (btn) {
    btn.textContent = "ENVIAR MENSAGEM →";
    btn.disabled = false;
  }

  if (document.getElementById("c-nome"))
    document.getElementById("c-nome").value = "";
  if (document.getElementById("c-tel"))
    document.getElementById("c-tel").value = "";
  if (document.getElementById("c-email"))
    document.getElementById("c-email").value = "";
  if (document.getElementById("c-msg"))
    document.getElementById("c-msg").value = "";
  if (document.getElementById("c-assunto"))
    document.getElementById("c-assunto").selectedIndex = 0;
}

// =====================
// ADMIN LOGIC (O PAINEL)
// =====================
function doLogin() {
  const btn = document.getElementById("loginBtn");
  btn.textContent = "A ENTRAR...";
  setTimeout(() => {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-container").style.display = "flex";
    showToast("✅ Login realizado como Admin!");
    loadAdminData();
  }, 1000);
}

function doLogout() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("admin-container").style.display = "none";
  document.getElementById("loginBtn").textContent = "ENTRAR NO PAINEL →";
  window.location.hash = "";
}

function showView(viewName, btnElement) {
  document
    .querySelectorAll("#app-admin .view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll("#app-admin .nav-item")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");
  if (btnElement) btnElement.classList.add("active");
  document.getElementById("topbarTitle").textContent = viewName.toUpperCase();
}

function loadAdminData() {
  // Renderiza a tabela de Produtos com Stock Dinâmico
  const tbodyProducts = document.getElementById("admin-products-tbody");
  if (tbodyProducts) {
    tbodyProducts.innerHTML = inventory
      .map(
        (p) => `
            <tr>
                <td style="color: var(--gray);">#00${p.id}</td>
                <td><span style="font-size: 18px; margin-right: 5px;">${p.emoji}</span> <strong style="text-transform: uppercase;">${p.name}</strong></td>
                <td style="color: var(--orange);">${getCatLabel(p.cat).toUpperCase()}</td>
                <td style="${p.stock <= 3 ? "color:#ff3d57; font-weight:bold;" : "color:#00d68f;"}">${p.stock} unid.</td>
                <td style="font-family: var(--font-display); font-size: 20px;">R$ ${p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
            </tr>
        `,
      )
      .join("");
  }

  // Calcula as vendas gravadas do dia
  let orders = JSON.parse(localStorage.getItem("casadasbikes_orders") || "[]");
  const todayStr = new Date().toLocaleDateString("pt-BR");
  let revenueToday = 0;
  let ordersTodayCount = 0;

  const recentOrdersHTML = orders
    .reverse()
    .map((order) => {
      const orderDateObj = new Date(order.date);
      const orderDateStr = orderDateObj.toLocaleDateString("pt-BR");

      if (orderDateStr === todayStr) {
        revenueToday += order.total;
        ordersTodayCount++;
      }

      const timeStr = orderDateObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const itemsList = order.items
        .map((i) => `${i.qty}x ${i.name}`)
        .join("<br>");

      return `
            <tr>
                <td style="color: var(--orange); font-weight: bold;">#${order.id}</td>
                <td style="color: var(--light);">${orderDateStr} às ${timeStr}</td>
                <td style="font-family: var(--font-condensed); color: var(--gray);">${itemsList}</td>
                <td style="color: #00d68f; font-family: var(--font-display); font-size: 20px;">R$ ${order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
            </tr>
        `;
    })
    .join("");

  // Preenche as estatísticas superiores
  document.getElementById("admin-revenue-day").textContent =
    `R$ ${revenueToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("admin-orders-day").textContent = ordersTodayCount;

  // Preenche a tabela de histórico de vendas
  const tbodyOrders = document.getElementById("admin-orders-tbody");
  if (tbodyOrders) {
    if (orders.length > 0) {
      tbodyOrders.innerHTML = recentOrdersHTML;
    } else {
      tbodyOrders.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--gray); padding: 30px;">Nenhuma venda registada ainda.</td></tr>`;
    }
  }
}

// =====================
// INICIALIZAÇÃO
// =====================
(async () => {
  await loadProductsFromAPI();
  await loadServicesFromAPI();
  checkRoute(); // Lê a barra de URL logo que abrir a página
})();
