(function () {
  "use strict";

  const C = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const CART_KEY = "candle_cart_v1";

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString("vi-VN") + "đ";

  // ---------- Hình nến minh họa (SVG) ----------
  function candleSVG(wax, jar) {
    return (
      '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="60" cy="142" rx="38" ry="5" fill="rgba(0,0,0,.12)"/>' +
      '<rect x="22" y="48" width="76" height="92" rx="14" fill="' + jar + '"/>' +
      '<rect x="27" y="58" width="66" height="76" rx="10" fill="' + wax + '"/>' +
      '<ellipse cx="60" cy="58" rx="33" ry="6" fill="rgba(255,255,255,.35)"/>' +
      '<rect x="58.5" y="38" width="3" height="22" rx="1.5" fill="#3b2f2a"/>' +
      '<path d="M60 8 C48 24 50 36 60 38 C70 36 72 24 60 8Z" fill="#ffb347"/>' +
      '<path d="M60 18 C54 27 55 34 60 36 C65 34 66 27 60 18Z" fill="#fff3c4"/>' +
      '<rect x="36" y="82" width="48" height="30" rx="4" fill="rgba(255,255,255,.55)"/>' +
      "</svg>"
    );
  }

  function productVisual(p) {
    return p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />'
      : candleSVG(p.colors[0], p.colors[1]);
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
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    toast("Đã thêm vào giỏ hàng");
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

  // ---------- Render ----------
  function renderProducts() {
    $("productGrid").innerHTML = PRODUCTS.map(
      (p) =>
        '<article class="card">' +
        '<div class="card-img" style="background:' + p.colors[0] + '33">' + productVisual(p) + "</div>" +
        '<div class="card-body">' +
        "<h3>" + p.name + "</h3>" +
        '<p class="notes">' + p.notes + "</p>" +
        '<p class="desc">' + p.desc + "</p>" +
        '<div class="meta"><span>' + p.size + "</span><span>Cháy " + p.burn + "</span></div>" +
        '<div class="card-foot"><span class="price">' + fmt(p.price) + "</span>" +
        '<button class="add-btn" data-add="' + p.id + '">Thêm vào giỏ</button></div>' +
        "</div></article>"
    ).join("");
  }

  function renderCart() {
    const t = totals();
    $("cartCount").textContent = t.count;
    $("cartSubtotal").textContent = fmt(t.subtotal);
    $("cartShip").textContent = t.count === 0 ? "0đ" : t.ship === 0 ? "Miễn phí" : fmt(t.ship);
    $("cartTotal").textContent = fmt(t.total);
    $("formTotal").textContent = fmt(t.total);
    $("checkoutBtn").disabled = t.count === 0;

    if (t.count > 0 && t.ship > 0) {
      $("shipHint").textContent = "Mua thêm " + fmt(C.freeShipFrom - t.subtotal) + " để được miễn phí vận chuyển.";
    } else {
      $("shipHint").textContent = "";
    }

    const ids = Object.keys(cart);
    if (ids.length === 0) {
      $("cartItems").innerHTML = '<p class="empty">Giỏ hàng đang trống.<br />Chọn một mùi hương bạn thích nhé.</p>';
      return;
    }
    $("cartItems").innerHTML = ids
      .map((id) => {
        const p = byId[id];
        return (
          '<div class="cart-item">' +
          '<div class="cart-thumb" style="background:' + p.colors[0] + '55">' + productVisual(p) + "</div>" +
          "<div><h4>" + p.name + "</h4><small>" + fmt(p.price) + " · " + p.size + "</small>" +
          '<div class="qty"><button data-dec="' + id + '" aria-label="Giảm">−</button>' +
          "<span>" + cart[id] + "</span>" +
          '<button data-inc="' + id + '" aria-label="Tăng">+</button></div></div>' +
          "<div style=\"text-align:right\"><strong>" + fmt(p.price * cart[id]) + "</strong><br />" +
          '<button class="remove" data-remove="' + id + '">Xoá</button></div>' +
          "</div>"
        );
      })
      .join("");
  }

  // ---------- Drawer / dialog ----------
  function openCart() {
    $("overlay").hidden = false;
    $("drawer").classList.add("open");
    $("drawer").setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    $("overlay").hidden = true;
    $("drawer").classList.remove("open");
    $("drawer").setAttribute("aria-hidden", "true");
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

  function buildOrder(form) {
    const t = totals();
    const items = Object.keys(cart).map((id) => ({
      id,
      name: byId[id].name,
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
      subtotal: t.subtotal,
      shipping: t.ship,
      total: t.total,
    };
    // Tin nhắn dựng sẵn để Make/n8n chỉ cần gắn thẳng vào Telegram
    order.text =
      "🕯 ĐƠN MỚI " + order.code + "\n" +
      "👤 " + order.customer.name + " — " + order.customer.phone + "\n" +
      "📍 " + order.customer.address + "\n" +
      items.map((i) => "• " + i.name + " x" + i.qty).join("\n") + "\n" +
      "💰 Tổng: " + fmt(order.total) + " (ship " + fmt(order.shipping) + ")\n" +
      "💳 " + (order.payment === "cod" ? "COD" : "Chuyển khoản") +
      (order.customer.note ? "\n📝 " + order.customer.note : "");
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
    // Gửi dạng form để Make tách sẵn thành từng trường (code, text, name, phone...)
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
      itemsText: order.items.map((i) => i.name + " x" + i.qty).join(", "),
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
    if (!form.name.value.trim()) return "Vui lòng nhập họ và tên.";
    if (!/^(0|\+?84)\d{9,10}$/.test(form.phone.value.replace(/[\s.\-]/g, "")))
      return "Số điện thoại chưa đúng, vui lòng kiểm tra lại.";
    if (form.address.value.trim().length < 10) return "Vui lòng nhập địa chỉ nhận hàng đầy đủ.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const err = validate(form);
    $("formError").textContent = err;
    if (err) return;
    if (Object.keys(cart).length === 0) return;

    const btn = $("submitBtn");
    btn.disabled = true;
    btn.textContent = "Đang gửi đơn...";
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
      $("formError").textContent = "Gửi đơn chưa được, vui lòng thử lại hoặc nhắn fanpage giúp shop nhé.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Xác nhận đặt hàng";
    }
  }

  function showSuccess(order, demo) {
    $("orderCode").textContent = order.code;
    if (order.payment === "bank") {
      $("successMsg").textContent = "Vui lòng chuyển khoản " + fmt(order.total) + " để shop lên đơn nhé.";
      $("qrImg").src = vietQrUrl(order.total, order.code);
      $("qrBox").hidden = false;
    } else {
      $("successMsg").textContent = "Shop sẽ liên hệ xác nhận và giao hàng. Bạn trả " + fmt(order.total) + " khi nhận hàng.";
      $("qrBox").hidden = true;
    }
    $("demoNote").hidden = !demo;
    if (demo) $("demoNote").textContent = "Chế độ DEMO: đơn chưa được gửi tới Telegram. Điền orderWebhookUrl trong config.js để nhận đơn thật.";
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

  // ---------- Khởi tạo ----------
  function applyConfig() {
    document.title = C.brand + " — Nến thơm sáp đậu nành";
    $("brandName").textContent = C.brand;
    $("footBrand").textContent = C.brand;
    $("footBrand2").textContent = C.brand;
    $("tagline").textContent = C.tagline;
    $("footPhone").textContent = C.phone;
    $("footEmail").textContent = C.email;
    $("footFanpage").href = C.fanpage;
    $("year").textContent = new Date().getFullYear();
    $("faqShip").textContent =
      "Đồng giá " + fmt(C.shippingFee) + " toàn quốc, miễn phí cho đơn từ " + fmt(C.freeShipFrom) + ".";
    $("heroArt").innerHTML = candleSVG("#f3dfb8", "#b5703a");
  }

  function init() {
    applyConfig();
    renderProducts();
    renderCart();

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove]");
      if (!t) return;
      if (t.dataset.add) addToCart(t.dataset.add);
      else if (t.dataset.inc) changeQty(t.dataset.inc, 1);
      else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
      else if (t.dataset.remove) removeItem(t.dataset.remove);
    });

    $("openCart").addEventListener("click", openCart);
    $("closeCart").addEventListener("click", closeCart);
    $("overlay").addEventListener("click", closeCart);
    $("checkoutBtn").addEventListener("click", openCheckout);
    $("closeCheckout").addEventListener("click", closeCheckout);
    $("closeSuccess").addEventListener("click", closeCheckout);
    $("doneBtn").addEventListener("click", closeCheckout);
    $("orderForm").addEventListener("submit", onSubmit);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
  }

  init();
})();
