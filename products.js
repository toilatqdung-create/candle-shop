// ====== DANH SÁCH SẢN PHẨM MẪU (song ngữ) — thay bằng mùi hương thật của bạn ======
// Mỗi chữ có hai bản: vi (tiếng Việt) và en (tiếng Anh).
// notes: tháp hương gồm hương đầu (top), hương giữa (heart), hương cuối (base).
// colors: wax = màu sáp, jar = màu hũ, glow = màu ánh sáng toả ra ở đầu trang.
// burn: số giờ cháy. Có ảnh thật: thêm  image: "images/ten-file.jpg"  vào sản phẩm.
window.PRODUCTS = [
  {
    id: "oai-huong",
    name: { vi: "Oải Hương Chiều Muộn", en: "Lavender Dusk" },
    notes: {
      top: { vi: "Cam bergamot", en: "Bergamot" },
      heart: { vi: "Oải hương", en: "Lavender" },
      base: { vi: "Xạ hương trắng", en: "White musk" },
    },
    desc: {
      vi: "Dịu và thư giãn, hợp phòng ngủ và những buổi tối cần chậm lại.",
      en: "Soft and calming. Made for bedrooms and evenings that need to slow down.",
    },
    price: 189000,
    size: "180g",
    burn: 40,
    colors: { wax: "#d9cfe6", jar: "#7d6a9c", glow: "#b79be0" },
  },
  {
    id: "go-dan-huong",
    name: { vi: "Gỗ Đàn Hương", en: "Sandalwood" },
    notes: {
      top: { vi: "Tuyết tùng", en: "Cedar" },
      heart: { vi: "Đàn hương", en: "Sandalwood" },
      base: { vi: "Vani", en: "Vanilla" },
    },
    desc: {
      vi: "Ấm, trầm và ôm lấy không gian. Hương gỗ nhẹ, không gắt.",
      en: "Warm and deep, it wraps around a room. A gentle wood scent that never turns sharp.",
    },
    price: 199000,
    size: "180g",
    burn: 40,
    colors: { wax: "#e6d2b4", jar: "#7a4f33", glow: "#e0a56a" },
  },
  {
    id: "tra-trang",
    name: { vi: "Trà Trắng & Lê", en: "White Tea & Pear" },
    notes: {
      top: { vi: "Lê xanh", en: "Green pear" },
      heart: { vi: "Hoa nhài", en: "Jasmine" },
      base: { vi: "Trà trắng", en: "White tea" },
    },
    desc: {
      vi: "Thanh, sạch, tươi mát. Dễ chịu cho phòng khách và góc làm việc.",
      en: "Clean, fresh and light. Easy to live with in a living room or at a desk.",
    },
    price: 179000,
    size: "180g",
    burn: 40,
    colors: { wax: "#eef0dc", jar: "#8ea37c", glow: "#cfe3a8" },
  },
  {
    id: "vani-caramel",
    name: { vi: "Vani Caramel", en: "Vanilla Caramel" },
    notes: {
      top: { vi: "Caramel", en: "Caramel" },
      heart: { vi: "Vani Madagascar", en: "Madagascar vanilla" },
      base: { vi: "Hạt dẻ", en: "Chestnut" },
    },
    desc: {
      vi: "Ngọt ấm như mùi bánh vừa ra lò, nữ tính và dễ thương.",
      en: "Sweet and warm, like a cake just out of the oven.",
    },
    price: 189000,
    size: "180g",
    burn: 40,
    colors: { wax: "#f3dcae", jar: "#b9772f", glow: "#f0b45a" },
  },
  {
    id: "rung-thong",
    name: { vi: "Rừng Thông Sương Sớm", en: "Pine Forest Mist" },
    notes: {
      top: { vi: "Bạc hà", en: "Mint" },
      heart: { vi: "Thông", en: "Pine" },
      base: { vi: "Rêu sồi", en: "Oakmoss" },
    },
    desc: {
      vi: "Se lạnh và trong trẻo như buổi sáng trong rừng. Hợp phòng làm việc.",
      en: "Cool and clear like a morning in the forest. Good for a workroom.",
    },
    price: 199000,
    size: "180g",
    burn: 40,
    colors: { wax: "#cfe0d6", jar: "#3f5e4d", glow: "#86c3a2" },
  },
  {
    id: "hoa-hong-gia",
    name: { vi: "Hồng Cổ Điển", en: "Classic Rose" },
    notes: {
      top: { vi: "Hoa hồng", en: "Rose" },
      heart: { vi: "Hoắc hương", en: "Patchouli" },
      base: { vi: "Hổ phách", en: "Amber" },
    },
    desc: {
      vi: "Hồng nhung đằm sâu, lãng mạn nhưng không ngọt gắt. Món quà dễ tặng.",
      en: "A deep velvet rose, romantic without being sugary. An easy gift to give.",
    },
    price: 209000,
    size: "180g",
    burn: 40,
    colors: { wax: "#f1d3d6", jar: "#9c4651", glow: "#e88a98" },
  },
];
