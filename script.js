(function () {
  "use strict";

  const C = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  const I18N = window.I18N;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const ids = PRODUCTS.map((p) => p.id);
  const CART_KEY = "candle_cart_v1";
  const LANG_KEY = "candle_lang";
  const EASE = "cubic-bezier(.2,.7,.2,1)";

  const $ = (id) => document.getElementById(id);
  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReduce = () => reduceMq.matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- Ngôn ngữ ----------
  let lang = pickLang();

  function pickLang() {
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (q === "vi" || q === "en") return q;
    } catch (e) { /* bỏ qua */ }
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "vi" || saved === "en") return saved;
    } catch (e) { /* bỏ qua */ }
    return /^vi/i.test(navigator.language || "vi") ? "vi" : "en";
  }

  // Tiền hiển thị cho khách (theo ngôn ngữ đang chọn)
  const fmt = (n) => n.toLocaleString(lang === "vi" ? "vi-VN" : "en-US") + "₫";
  // Tiền trong tin nhắn Telegram gửi cho shop: luôn tiếng Việt, giữ nguyên như trước
  const fmtVN = (n) => n.toLocaleString("vi-VN") + "đ";

  const L = (obj) => obj[lang] || obj.vi;

  function t(key, vars) {
    const table = I18N[lang] || I18N.vi;
    const s = table[key] !== undefined ? table[key] : I18N.vi[key] !== undefined ? I18N.vi[key] : key;
    const all = Object.assign(
      { fee: fmt(C.shippingFee), free: fmt(C.freeShipFrom), brand: C.brand, year: new Date().getFullYear() },
      vars || {}
    );
    return s.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
  }

  // ---------- Hình nến (SVG). Màu lấy từ biến CSS --c-wax và --c-jar ----------
  function candleSVG(lit) {
    return (
      '<svg class="candle' + (lit ? " is-lit" : "") + '" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="100" cy="247" rx="62" ry="7" fill="rgba(0,0,0,.2)"/>' +
      '<rect class="k-jar" x="38" y="104" width="124" height="140" rx="16"/>' +
      '<rect class="k-wax" x="44" y="112" width="112" height="126" rx="11"/>' +
      '<ellipse class="k-surface" cx="100" cy="112" rx="56" ry="8"/>' +
      '<rect class="k-sheen" x="50" y="120" width="6" height="106" rx="3"/>' +
      '<rect class="k-wick" x="98.5" y="86" width="3" height="28" rx="1.5"/>' +
      '<rect class="k-label" x="62" y="150" width="76" height="50" rx="3"/>' +
      '<text class="k-label-name" x="100" y="173" text-anchor="middle">' + C.brand + "</text>" +
      '<text class="k-label-size" x="100" y="189" text-anchor="middle">180g</text>' +
      '<g class="smoke">' +
      '<path class="wisp" d="M100 26 C92 12 108 4 100 -10 C93 -22 106 -30 100 -44"/>' +
      '<path class="wisp" d="M104 22 C112 10 96 2 104 -12 C110 -22 98 -32 104 -46"/>' +
      "</g>" +
      '<g class="flame-wrap"><g class="flame">' +
      '<path class="k-flame-outer" d="M100 32 C84 56 86 82 100 88 C114 82 116 56 100 32Z"/>' +
      '<path class="k-flame-inner" d="M100 52 C92 66 93 80 100 84 C107 80 108 66 100 52Z"/>' +
      "</g></g></svg>"
    );
  }

  function colorVars(p) {
    return "--c-wax:" + p.colors.wax + ";--c-jar:" + p.colors.jar + ";--c-glow:" + p.colors.glow + ";";
  }
  function visual(p) {
    return p.image ? '<img src="' + p.image + '" alt="' + L(p.name) + '" loading="lazy" draggable="false" />' : candleSVG(false);
  }
  function notesLine(p) {
    return [p.notes.top, p.notes.heart, p.notes.base].map(L).join(", ");
  }
  // Chọn màu chữ dễ đọc trên nền cho trước
  function onColor(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    const lum = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? "#2a2024" : "#f7f6f1";
  }

  // ---------- Giỏ hàng ----------
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      const clean = {};
      for (const id in raw) if (byId[id] && raw[id] > 0) clean[id] = Math.floor(raw[id]);
      return clean;
    } catch (e) {
      return {};
    }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* bỏ qua */ }
  }

  function totals() {
    let subtotal = 0, count = 0;
    for (const id in cart) {
      subtotal += byId[id].price * cart[id];
      count += cart[id];
    }
    const ship = count === 0 ? 0 : subtotal >= C.freeShipFrom ? 0 : C.shippingFee;
    return { subtotal, count, ship, total: subtotal + ship };
  }

  function addToCart(id, qty, srcEl) {
    if (!byId[id]) return;
    cart[id] = (cart[id] || 0) + (qty || 1);
    saveCart();
    renderCart();
    toast(t("toast.added"));
    flyToCart(srcEl, byId[id]);
  }
  function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }
  function removeItem(id) {
    delete cart[id];
    saveCart();
    renderCart();
  }

  // Hiệu ứng: một viên nến nhỏ bay từ nút bấm vào giỏ hàng
  function bumpCart() {
    const el = $("cartCount");
    if (el.animate && !prefersReduce()) {
      el.animate([{ transform: "scale(1)" }, { transform: "scale(1.45)" }, { transform: "scale(1)" }], { duration: 380, easing: EASE });
    }
  }
  function flyToCart(src, p) {
    if (prefersReduce() || !src || !src.getBoundingClientRect || !document.body.animate) return bumpCart();
    const a = src.getBoundingClientRect();
    const b = $("openCart").getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "fly";
    dot.style.left = a.left + a.width / 2 - 14 + "px";
    dot.style.top = a.top + a.height / 2 - 14 + "px";
    dot.style.background = "linear-gradient(135deg," + p.colors.wax + " 50%," + p.colors.jar + " 50%)";
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = dot.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - 90) + "px) scale(1.2)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(.3)", opacity: 0.35 },
      ],
      { duration: 780, easing: "cubic-bezier(.5,0,.3,1)" }
    );
    anim.onfinish = () => { dot.remove(); bumpCart(); };
  }

  // ---------- Đầu trang: chọn mùi hương ----------
  let current = ids[0];
  let heroBusy = false;
  const idxOf = (id) => ids.indexOf(id);
  const stepId = (from, d) => ids[(idxOf(from) + d + ids.length) % ids.length];

  function slideIn(el, i) {
    if (prefersReduce() || !el.animate) return;
    el.animate([{ transform: "translateY(70%)", opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: 650, delay: i * 70, easing: EASE, fill: "backwards",
    });
  }

  function renderChips() {
    $("heroChips").innerHTML = PRODUCTS.map(
      (p) =>
        '<button type="button" class="chip" data-scent="' + p.id + '" aria-pressed="' + (p.id === current) + '"' +
        ' aria-label="' + L(p.name) + '" title="' + L(p.name) + '"' +
        ' style="--chip-wax:' + p.colors.wax + ";--chip-jar:" + p.colors.jar + '"></button>'
    ).join("");
  }

  function renderHeroPick(animate) {
    const p = byId[current];
    $("heroName").textContent = L(p.name);
    $("heroTop").textContent = L(p.notes.top);
    $("heroHeart").textContent = L(p.notes.heart);
    $("heroBase").textContent = L(p.notes.base);
    $("heroFacts").textContent = t("hero.facts", { size: p.size, burn: p.burn });
    $("heroPrice").textContent = fmt(p.price);
    $("heroAdd").dataset.add = p.id;
    if (animate) [$("heroName"), $("heroTop"), $("heroHeart"), $("heroBase"), $("heroFacts"), $("heroPrice")].forEach(slideIn);
  }

  function paintScent(id, animate) {
    current = id;
    const p = byId[id];
    const st = $("hero").style;
    st.setProperty("--c-wax", p.colors.wax);
    st.setProperty("--c-jar", p.colors.jar);
    st.setProperty("--c-glow", p.colors.glow);
    document.querySelectorAll("#heroChips .chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scent === id)));
    renderHeroPick(animate);
  }

  // Đổi mùi: nến cũ trượt đi, nến mới trượt vào, nền và ánh sáng đổi màu mượt
  function goScent(id, dir) {
    if (id === current || heroBusy || !byId[id]) return;
    const d = dir || (idxOf(id) > idxOf(current) ? 1 : -1);
    const candle = $("heroCandle");
    if (prefersReduce() || !candle.animate) return paintScent(id, false);
    heroBusy = true;
    const out = candle.animate(
      [{ transform: "translateX(0) scale(1)", opacity: 1 }, { transform: "translateX(" + -70 * d + "px) scale(.94)", opacity: 0 }],
      { duration: 260, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" }
    );
    out.onfinish = () => {
      paintScent(id, true);
      const inn = candle.animate(
        [{ transform: "translateX(" + 70 * d + "px) scale(.94)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 600, easing: EASE }
      );
      out.cancel();
      inn.onfinish = () => { heroBusy = false; };
    };
    setTimeout(() => { heroBusy = false; }, 1300);
  }

  function splitTitle() {
    const h = $("heroTitle");
    const text = t("hero.title");
    h.setAttribute("aria-label", text);
    h.innerHTML = text.split(" ").map((w) => '<span class="w" aria-hidden="true"><span>' + w + "</span></span>").join(" ");
    if (prefersReduce() || !h.animate) return;
    h.querySelectorAll(".w > span").forEach((s, i) => {
      s.animate([{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 950, delay: 150 + i * 90, easing: EASE, fill: "backwards" });
    });
  }

  function makeSparks() {
    const box = $("sparks");
    if (prefersReduce() || box.children.length) return;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("i");
      s.style.cssText =
        "left:" + Math.random() * 100 + "%;--s:" + (2 + Math.random() * 3) + "px;--t:" + (8 + Math.random() * 9) + "s;--d:" +
        -Math.random() * 14 + "s;--x:" + (Math.random() - 0.5) * 140 + "px";
      box.appendChild(s);
    }
  }

  function setupHero() {
    const hero = $("hero");
    const box = $("candleBox");
    let touched = false;
    let hovering = false;
    let visible = true;

    // Tự chuyển mùi cho đến khi khách tự thao tác
    const markTouched = () => { touched = true; };
    ["pointerdown", "keydown", "touchstart"].forEach((ev) => hero.addEventListener(ev, markTouched, { passive: true }));
    hero.addEventListener("pointerenter", () => { hovering = true; });
    hero.addEventListener("pointerleave", () => { hovering = false; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.3 }).observe(hero);
    }
    if (!prefersReduce()) {
      setInterval(() => {
        if (touched || hovering || !visible || document.hidden) return;
        goScent(stepId(current, 1), 1);
      }, 6500);
    }

    // Nến nghiêng nhẹ theo con trỏ chuột
    if (!prefersReduce() && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        box.style.transform = "perspective(900px) rotateY(" + x * 12 + "deg) rotateX(" + -y * 8 + "deg)";
      });
      hero.addEventListener("pointerleave", () => { box.style.transform = ""; });
    }

    // Vuốt trái phải trên điện thoại
    const stage = $("heroStage");
    let tx = null;
    stage.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 45) goScent(stepId(current, dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });

    $("heroPrev").addEventListener("click", () => goScent(stepId(current, -1), -1));
    $("heroNext").addEventListener("click", () => goScent(stepId(current, 1), 1));
    makeSparks();
  }

  // ---------- Danh sách sản phẩm dạng slider ----------
  let productsRendered = false;

  function renderProducts() {
    const first = !productsRendered;
    productsRendered = true;
    $("productGrid").innerHTML = PRODUCTS.map(
      (p, i) =>
        '<article class="item' + (first ? " reveal" : "") + '" style="' + colorVars(p) + "--d:" + i * 0.07 + 's">' +
        '<button type="button" class="arch" data-view="' + p.id + '" aria-label="' + t("card.view") + ": " + L(p.name) + '">' +
        visual(p) + '<span class="view-pill">' + t("card.view") + "</span></button>" +
        '<div class="item-body">' +
        "<h3>" + L(p.name) + "</h3>" +
        '<p class="item-notes">' + notesLine(p) + "</p>" +
        '<p class="item-desc">' + L(p.desc) + "</p>" +
        '<div class="item-foot"><span class="price">' + fmt(p.price) + "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-add="' + p.id + '">' + t("card.add") + "</button></div>" +
        "</div></article>"
    ).join("");
    if (first) setupReveal();
    railUpdate();
  }

  function renderMarquee() {
    const once = PRODUCTS.map((p) => '<span class="marquee-item">' + L(p.name) + "</span>").join("");
    $("marqueeTrack").innerHTML = prefersReduce() ? once : once + once;
  }

  function railUpdate() {
    const r = $("productGrid");
    const max = r.scrollWidth - r.clientWidth;
    const w = clamp(r.clientWidth / Math.max(r.scrollWidth, 1), 0.12, 1);
    const x = max > 0 ? r.scrollLeft / max : 0;
    const bar = $("railBar");
    bar.style.setProperty("--w", w * 100 + "%");
    bar.style.setProperty("--x", x * ((1 - w) / w) * 100 + "%");
    $("railPrev").disabled = r.scrollLeft <= 2;
    $("railNext").disabled = r.scrollLeft >= max - 2;
  }

  function setupRail() {
    const rail = $("productGrid");
    const step = () => {
      const c = rail.querySelector(".item");
      return (c ? c.getBoundingClientRect().width : 300) + parseFloat(getComputedStyle(rail).columnGap || 24);
    };
    $("railPrev").addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    $("railNext").addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    rail.addEventListener("scroll", railUpdate, { passive: true });

    // Kéo bằng chuột
    let drag = null;
    let suppress = false;
    rail.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: rail.scrollLeft, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; rail.classList.add("dragging"); }
      if (drag.moved) rail.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      if (drag.moved) { suppress = true; setTimeout(() => { suppress = false; }, 0); }
      rail.classList.remove("dragging");
      drag = null;
    });
    rail.addEventListener("click", (e) => { if (suppress) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  // ---------- Panel xem nhanh (trượt từ bên phải) ----------
  let panelId = null;
  let panelQty = 1;

  function panelHTML(p) {
    const tiers = [
      ["top", "hero.top", 46, p.colors.wax],
      ["heart", "hero.heart", 74, p.colors.glow],
      ["base", "hero.base", 100, p.colors.jar],
    ];
    return (
      '<div class="pv">' +
      '<div class="pv-art"><div class="pv-glow"></div>' + candleSVG(true) + "</div>" +
      '<h2 id="panelName">' + L(p.name) + "</h2>" +
      '<p class="pv-desc">' + L(p.desc) + "</p>" +
      '<div class="pyramid">' +
      tiers.map((x, i) =>
        '<div class="tier" style="--w:' + x[2] + "%;--i:" + i + ";background:" + x[3] + ";color:" + onColor(x[3]) + '">' +
        "<small>" + t(x[1]) + "</small><b>" + L(p.notes[x[0]]) + "</b></div>"
      ).join("") +
      "</div>" +
      '<p class="facts">' + t("hero.facts", { size: p.size, burn: p.burn }) + "</p>" +
      '<div class="pv-buy">' +
      '<div class="stepper" role="group" aria-label="' + t("panel.qty") + '">' +
      '<button type="button" data-pq="-1" aria-label="' + t("cart.dec") + '">−</button>' +
      '<output id="panelQty">' + panelQty + "</output>" +
      '<button type="button" data-pq="1" aria-label="' + t("cart.inc") + '">+</button></div>' +
      '<button type="button" class="btn pv-add" id="panelAdd"><span>' + t("panel.add") + '</span><span id="panelPrice">' + fmt(p.price * panelQty) + "</span></button>" +
      "</div></div>"
    );
  }

  function renderPanel() {
    const p = byId[panelId];
    const el = $("panel");
    el.style.setProperty("--c-wax", p.colors.wax);
    el.style.setProperty("--c-jar", p.colors.jar);
    el.style.setProperty("--c-glow", p.colors.glow);
    $("panelBody").innerHTML = panelHTML(p);
  }

  function openPanel(id) {
    panelId = id;
    panelQty = 1;
    renderPanel();
    openLayer("panel");
  }

  function switchPanel(d) {
    panelId = stepId(panelId, d);
    panelQty = 1;
    const body = $("panelBody");
    if (prefersReduce() || !body.animate) return renderPanel();
    const out = body.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(" + -34 * d + "px)" }], { duration: 180, easing: "ease-in", fill: "forwards" });
    out.onfinish = () => {
      renderPanel();
      body.animate([{ opacity: 0, transform: "translateX(" + 34 * d + "px)" }, { opacity: 1, transform: "none" }], { duration: 460, easing: EASE });
      out.cancel();
    };
  }

  function changePanelQty(d) {
    panelQty = clamp(panelQty + d, 1, 20);
    $("panelQty").textContent = panelQty;
    $("panelPrice").textContent = fmt(byId[panelId].price * panelQty);
  }

  // ---------- Giỏ hàng ----------
  function renderCart() {
    const tt = totals();
    $("cartCount").textContent = tt.count;
    $("cartSubtotal").textContent = fmt(tt.subtotal);
    $("cartShip").textContent = tt.count === 0 ? fmt(0) : tt.ship === 0 ? t("cart.free") : fmt(tt.ship);
    $("cartTotal").textContent = fmt(tt.total);
    $("formTotal").textContent = fmt(tt.total);
    $("checkoutBtn").disabled = tt.count === 0;
    $("shipHint").textContent =
      tt.count > 0 && tt.ship > 0 ? t("cart.hintFree", { amount: fmt(C.freeShipFrom - tt.subtotal) }) : "";

    const keys = Object.keys(cart);
    if (keys.length === 0) {
      $("cartItems").innerHTML = '<p class="empty">' + t("cart.empty") + "</p>";
      return;
    }
    $("cartItems").innerHTML = keys
      .map((id) => {
        const p = byId[id];
        return (
          '<div class="cart-item">' +
          '<div class="cart-thumb" style="' + colorVars(p) + '">' + visual(p) + "</div>" +
          "<div><h4>" + L(p.name) + "</h4><small>" + fmt(p.price) + ", " + p.size + "</small>" +
          '<div class="qty"><button type="button" data-dec="' + id + '" aria-label="' + t("cart.dec") + '">−</button>' +
          "<span>" + cart[id] + "</span>" +
          '<button type="button" data-inc="' + id + '" aria-label="' + t("cart.inc") + '">+</button></div></div>' +
          '<div style="text-align:right"><strong>' + fmt(p.price * cart[id]) + "</strong><br />" +
          '<button type="button" class="remove" data-remove="' + id + '">' + t("cart.remove") + "</button></div>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------- Ngăn kéo (giỏ hàng) và panel xem nhanh ----------
  let layer = null;
  let lastFocus = null;
  const layerEl = (name) => $(name === "cart" ? "drawer" : "panel");

  function openLayer(name) {
    if (layer === name) return;
    if (layer) {
      layerEl(layer).classList.remove("open");
      layerEl(layer).setAttribute("aria-hidden", "true");
    } else {
      lastFocus = document.activeElement;
    }
    layer = name;
    const el = layerEl(name);
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    $("overlay").hidden = false;
    document.body.style.overflow = "hidden";
    $(name === "cart" ? "closeCart" : "panelClose").focus();
  }
  function closeLayer() {
    if (!layer) return;
    const el = layerEl(layer);
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    layer = null;
    $("overlay").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function trapTab(e) {
    if (!layer || e.key !== "Tab") return;
    const f = Array.from(layerEl(layer).querySelectorAll("button,[href],input,textarea,select"))
      .filter((x) => !x.disabled && x.getClientRects().length);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  let toastTimer;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
  }

  // ---------- Hiệu ứng theo cuộn trang ----------
  let io = null;
  function setupReveal() {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (prefersReduce() || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    els.forEach((e) => io.observe(e));
  }

  function updateTimeline() {
    const steps = $("steps");
    const r = steps.getBoundingClientRect();
    const vh = window.innerHeight;
    let p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.12), 0, 1);
    if (prefersReduce()) p = 1;
    steps.style.setProperty("--p", p.toFixed(3));
    const n = steps.children.length;
    Array.from(steps.children).forEach((li, i) => li.classList.toggle("is-on", p > 0.02 + (i / n) * 0.9));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      $("scrollProgress").style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      updateTimeline();
    });
  }

  // ---------- Đặt hàng ----------
  function orderCode() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const date = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate());
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return C.orderPrefix + date + "-" + rand;
  }

  // Tin nhắn gửi cho shop luôn bằng tiếng Việt, tên sản phẩm tiếng Việt,
  // bất kể khách đang xem website bằng ngôn ngữ nào.
  function buildOrder(form) {
    const tt = totals();
    const items = Object.keys(cart).map((id) => ({
      id,
      name: byId[id].name.vi,
      qty: cart[id],
      price: byId[id].price,
    }));
    const order = {
      code: orderCode(),
      createdAt: new Date().toISOString(),
      customer: {
        name: form.name.value.trim(),
        phone: form.phone.value.replace(/\s+/g, ""),
        address: form.address.value.trim(),
        note: form.note.value.trim(),
      },
      payment: form.payment.value, // "cod" | "bank"
      items,
      subtotal: tt.subtotal,
      shipping: tt.ship,
      total: tt.total,
    };
    const payLabel = order.payment === "cod" ? "COD" : "Chuyển khoản";
    order.itemsText = items.map((i) => i.name + " x" + i.qty).join(", ");
    order.text =
      "🕯 ĐƠN MỚI " + order.code + "\n" +
      "👤 " + order.customer.name + " — " + order.customer.phone + "\n" +
      "📍 " + order.customer.address + "\n" +
      items.map((i) => "• " + i.name + " x" + i.qty).join("\n") + "\n" +
      "💰 Tổng: " + fmtVN(order.total) + " (ship " + fmtVN(order.shipping) + ")\n" +
      "💳 " + payLabel +
      (order.customer.note ? "\n📝 " + order.customer.note : "") +
      (lang === "en" ? "\n🌐 Khách xem bản tiếng Anh" : "");
    order.line =
      "🧾 " + order.code + "\n" +
      "👤 " + order.customer.name + "\n" +
      "🛒 " + order.itemsText + "\n" +
      "💰 " + fmtVN(order.total) + " · " + payLabel + "\n" +
      "───────────";
    return order;
  }

  async function sendOrder(order) {
    if (!C.orderWebhookUrl) {
      // Chế độ DEMO: chỉ lưu cục bộ và in ra console
      console.log("[DEMO] Đơn hàng:", order);
      try {
        const list = JSON.parse(localStorage.getItem("demo_orders") || "[]");
        list.push(order);
        localStorage.setItem("demo_orders", JSON.stringify(list));
      } catch (e) { /* bỏ qua */ }
      return { demo: true };
    }
    // Gửi dạng form để Make tách sẵn thành từng trường (code, text, name, phone, line...)
    const body = new URLSearchParams({
      code: order.code,
      text: order.text,
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      note: order.customer.note,
      payment: order.payment,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      itemsText: order.itemsText,
      line: order.line,
      items: JSON.stringify(order.items),
    });
    await fetch(C.orderWebhookUrl, { method: "POST", mode: "no-cors", body });
    return { demo: false };
  }

  function vietQrUrl(amount, code) {
    const b = C.bank;
    return (
      "https://img.vietqr.io/image/" + encodeURIComponent(b.bankId) + "-" + encodeURIComponent(b.accountNo) +
      "-compact2.png?amount=" + amount +
      "&addInfo=" + encodeURIComponent(code) +
      "&accountName=" + encodeURIComponent(b.accountName)
    );
  }

  function validate(form) {
    if (!form.name.value.trim()) return "err.name";
    if (!/^(0|\+?84)\d{9,10}$/.test(form.phone.value.replace(/[\s.\-]/g, ""))) return "err.phone";
    if (form.address.value.trim().length < 10) return "err.address";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const errKey = validate(form);
    $("formError").textContent = errKey ? t(errKey) : "";
    if (errKey) return;
    if (Object.keys(cart).length === 0) return;

    const btn = $("submitBtn");
    btn.disabled = true;
    btn.textContent = t("checkout.sending");
    try {
      const order = buildOrder(form);
      const res = await sendOrder(order);
      showSuccess(order, res.demo);
      cart = {};
      saveCart();
      renderCart();
      form.reset();
    } catch (ex) {
      console.error(ex);
      $("formError").textContent = t("err.send");
    } finally {
      btn.disabled = false;
      btn.textContent = t("checkout.submit");
    }
  }

  function showSuccess(order, demo) {
    $("orderCode").textContent = order.code;
    if (order.payment === "bank") {
      $("successMsg").textContent = t("success.bank", { amount: fmt(order.total) });
      $("qrImg").src = vietQrUrl(order.total, order.code);
      $("qrBox").hidden = false;
    } else {
      $("successMsg").textContent = t("success.cod", { amount: fmt(order.total) });
      $("qrBox").hidden = true;
    }
    $("demoNote").hidden = !demo;
    $("checkoutView").hidden = true;
    $("successView").hidden = false;
  }

  function openCheckout() {
    if (Object.keys(cart).length === 0) return;
    closeLayer();
    $("formError").textContent = "";
    $("checkoutView").hidden = false;
    $("successView").hidden = true;
    $("checkoutDialog").showModal();
  }
  function closeCheckout() {
    $("checkoutDialog").close();
  }

  // ---------- Áp dụng ngôn ngữ cho toàn trang ----------
  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    const meta = $("metaDesc");
    if (meta) meta.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", t(el.dataset.i18nPh)); });
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

    splitTitle();
    renderChips();
    paintScent(current, false);
    renderProducts();
    renderMarquee();
    renderCart();
    if (layer === "panel") renderPanel();
    $("submitBtn").textContent = t("checkout.submit");
  }

  function setLang(next) {
    if (next !== "vi" && next !== "en") return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* bỏ qua */ }
    applyLang();
  }

  // ---------- Khởi tạo ----------
  function init() {
    $("brandName").textContent = C.brand;
    $("footBrand").textContent = C.brand;
    $("footPhone").textContent = C.phone;
    $("footEmail").textContent = C.email;
    $("footFanpage").href = C.fanpage;
    $("heroCandle").innerHTML = candleSVG(true);

    applyLang();
    setupHero();
    setupRail();
    setupReveal();

    document.addEventListener("click", (e) => {
      const lb = e.target.closest("[data-lang]");
      if (lb) return setLang(lb.dataset.lang);
      const chip = e.target.closest("[data-scent]");
      if (chip) return goScent(chip.dataset.scent);
      const view = e.target.closest("[data-view]");
      if (view) return openPanel(view.dataset.view);
      const pq = e.target.closest("[data-pq]");
      if (pq) return changePanelQty(Number(pq.dataset.pq));
      if (e.target.closest("#panelAdd")) return addToCart(panelId, panelQty, e.target.closest("#panelAdd"));
      const tgt = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove]");
      if (!tgt) return;
      if (tgt.dataset.add) addToCart(tgt.dataset.add, 1, tgt);
      else if (tgt.dataset.inc) changeQty(tgt.dataset.inc, 1);
      else if (tgt.dataset.dec) changeQty(tgt.dataset.dec, -1);
      else if (tgt.dataset.remove) removeItem(tgt.dataset.remove);
    });

    $("openCart").addEventListener("click", () => openLayer("cart"));
    $("closeCart").addEventListener("click", closeLayer);
    $("panelClose").addEventListener("click", closeLayer);
    $("panelPrev").addEventListener("click", () => switchPanel(-1));
    $("panelNext").addEventListener("click", () => switchPanel(1));
    $("overlay").addEventListener("click", closeLayer);
    $("checkoutBtn").addEventListener("click", openCheckout);
    $("closeCheckout").addEventListener("click", closeCheckout);
    $("closeSuccess").addEventListener("click", closeCheckout);
    $("doneBtn").addEventListener("click", closeCheckout);
    $("orderForm").addEventListener("submit", onSubmit);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLayer();
      trapTab(e);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { onScroll(); railUpdate(); });
    onScroll();
  }

  init();
})();
