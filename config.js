// ====== CẤU HÌNH CỬA HÀNG — chỉnh file này là đủ, không cần sửa code ======
window.SHOP_CONFIG = {
  brand: "Ánh Hương",
  tagline: "Nến thơm sáp đậu nành, đổ tay từng mẻ",

  // Liên hệ & mạng xã hội
  fanpage: "https://facebook.com/ten-fanpage-cua-ban",
  phone: "0900 000 000",
  email: "hello@example.com",

  // Webhook nhận đơn (Make.com / n8n). Để trống = chế độ DEMO (đơn chỉ in ra console).
  // Ví dụ: "https://hook.eu2.make.com/xxxxxxxxxxxx"
  orderWebhookUrl: "https://hook.eu1.make.com/af7ucvoptqpkqjq0hvb1nvrt3avjbz9d",

  // Thông tin chuyển khoản để sinh mã VietQR
  // bankId: mã ngân hàng theo VietQR (MB, VCB, TCB, ACB, BIDV, VPB, TPB...)
  bank: {
    bankId: "MB",
    accountNo: "0000000000",
    accountName: "NGUYEN VAN A",
  },

  // Vận chuyển
  shippingFee: 25000,
  freeShipFrom: 500000,

  // Tiền tố mã đơn, ví dụ AH241013-4F2K
  orderPrefix: "AH",
};
