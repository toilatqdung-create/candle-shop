(function () {
  "use strict";

  const C = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  const I18N = window.I18N;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const CART_KEY = "candle_cart_v1";
  const LANG_KEY = "candle_lang";

  const $ = (id) => document.getElementById(id);

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
    let s = table[key] !== undefined ? table[key] : I18N.vi[key] !== undefined ? I18N.vi[key] : key;
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
    return p.image ? '<img src="' + p.image + '" alt="' + L(p.name) + '" loading="lazy" />' : candleSVG(false);
  }
  function notesLine(p) {
    return [p.notes.top, p.notes.heart, p.notes.base].map(L).join(", ");
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

  function addToCart(id) {
    if (!byId[id]) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    toast(t("toast.added"));
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

  // ---------- Hiển thị ----------
  let current = PRODUCTS[0].id;

  function renderChips() {
    $("heroChips").innerHTML = PRODUCTS.map(
      (p) =>
        '<button type="button" class="chip" data-scent="' + p.id + '" aria-pressed="' + (p.id === current) + '"' +
        ' aria-label="' + L(p.name) + '" title="' + L(p.name) + '"' +
        ' style="--chip-wax:' + p.colors.wax + ";--chip-jar:" + p.colors.jar + '"></button>'
    ).join("");
  }

  function renderHeroPick() {
    const p = byId[current];
    $("heroName").textContent = L(p.name);
    $("heroTop").textContent = L(p.notes.top);
    $("heroHeart").textContent = L(p.notes.heart);
    $("heroBase").textContent = L(p.notes.base);
    $("heroFacts").textContent = t("hero.facts", { size: p.size, burn: p.burn });
    $("heroPrice").textContent = fmt(p.price);
    $("heroAdd").dataset.add = p.id;
  }

  function setScent(id) {
    if (!byId[id]) return;
    current = id;
    const p = byId[id];
    const st = $("heroStage").style;
    st.setProperty("--c-wax", p.colors.wax);
    st.setProperty("--c-jar", p.colors.jar);
    st.setProperty("--c-glow", p.colors.glow);
    document.querySelectorAll("#heroChips .chip").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.scent === id))
    );
    renderHeroPick();
  }

  function renderProducts() {
    $("productGrid").innerHTML = PRODUCTS.map(
      (p) =>
        '<article class="item" style="' + colorVars(p) + '">' +
        '<div class="arch">' + visual(p) + "</div>" +
        '<div class="item-body">' +
        "<h3>" + L(p.name) + "</h3>" +
        '<p class="item-notes">' + notesLine(p) + "</p>" +
        '<p class="item-desc">' + L(p.desc) + "</p>" +
        '<div class="item-foot"><span class="price">' + fmt(p.price) + "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-add="' + p.id + '">' + t("card.add") + "</button></div>" +
        "</div></article>"
    ).join("");
  }

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

    const ids = Object.keys(cart);
    if (ids.length === 0) {
      $("cartItems").innerHTML = '<p class="empty">' + t("cart.empty") + "</p>";
      return;
    }
    $("cartItems").innerHTML = ids
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

  // ---------- Ngăn kéo giỏ hàng ----------
  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $("overlay").hidden = false;
    $("drawer").classList.add("open");
    $("drawer").setAttribute("aria-hidden", "false");
    $("closeCart").focus();
  }
  function closeCart() {
    $("overlay").hidden = true;
    $("drawer").classList.remove("open");
    $("drawer").setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  let toastTimer;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
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
    closeCart();
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

    renderChips();
    renderHeroPick();
    renderProducts();
    renderCart();
    $("submitBtn").textContent = t("checkout.submit");
    if (!$("successView").hidden) {
      // đang xem màn hình thành công thì không đổi nội dung đã có mã đơn
      $("successView").querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    }
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
    setScent(current);

    document.addEventListener("click", (e) => {
      const lb = e.target.closest("[data-lang]");
      if (lb) return setLang(lb.dataset.lang);
      const chip = e.target.closest("[data-scent]");
      if (chip) return setScent(chip.dataset.scent);
      const tgt = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove]");
      if (!tgt) return;
      if (tgt.dataset.add) addToCart(tgt.dataset.add);
      else if (tgt.dataset.inc) changeQty(tgt.dataset.inc, 1);
      else if (tgt.dataset.dec) changeQty(tgt.dataset.dec, -1);
      else if (tgt.dataset.remove) removeItem(tgt.dataset.remove);
    });

    $("openCart").addEventListener("click", openCart);
    $("closeCart").addEventListener("click", closeCart);
    $("overlay").addEventListener("click", closeCart);
    $("checkoutBtn").addEventListener("click", openCheckout);
    $("closeCheckout").addEventListener("click", closeCheckout);
    $("closeSuccess").addEventListener("click", closeCheckout);
    $("doneBtn").addEventListener("click", closeCheckout);
    $("orderForm").addEventListener("submit", onSubmit);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("drawer").classList.contains("open")) closeCart();
    });
  }

  init();
})();
