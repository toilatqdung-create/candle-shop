# Website nến thơm: giao diện mới, song ngữ VI / EN

Website tĩnh (HTML/CSS/JS thuần). Chạy thử trên máy:

```bash
python3 -m http.server 8000     # rồi mở http://localhost:8000
```

## Các file trong bản cập nhật này

| File | Việc của file |
|---|---|
| `index.html` | Khung trang |
| `styles.css` | Toàn bộ giao diện (màu, chữ, bố cục) |
| `script.js` | Giỏ hàng, đặt đơn, đổi mùi hương, đổi ngôn ngữ |
| `i18n.js` | **Toàn bộ chữ trên web, tiếng Việt và tiếng Anh** |
| `products.js` | Sản phẩm song ngữ (tên, mô tả, tháp hương, giá, màu) |

**Không có `config.js` trong gói này.** Giữ nguyên `config.js` hiện có trong repo của bạn (nơi chứa webhook Make và thông tin ngân hàng). Bản mới vẫn đọc các mục `brand`, `phone`, `email`, `fanpage`, `orderWebhookUrl`, `bank`, `shippingFee`, `freeShipFrom`, `orderPrefix` như cũ.

## Cập nhật lên GitHub

Trong repo, bấm **Add file → Upload files**, kéo 5 file ở bảng trên vào (file nào trùng tên sẽ được thay), rồi **Commit changes**. Đợi 1-2 phút và nhấn Ctrl+F5 trên web.

## Song ngữ

- Khách bấm **VI / EN** trên đầu trang. Lựa chọn được nhớ cho lần sau.
- Lần đầu vào, web tự chọn tiếng Việt nếu trình duyệt là tiếng Việt, ngược lại hiện tiếng Anh.
- Gửi link riêng từng ngôn ngữ: `...candle-shop/?lang=en` hoặc `?lang=vi`.
- **Tin Telegram về shop luôn bằng tiếng Việt** (tên sản phẩm, tiền, trường `line` và `itemsText`), dù khách đặt bằng ngôn ngữ nào. Đơn của khách xem bản tiếng Anh có thêm dòng "🌐 Khách xem bản tiếng Anh" để bạn trả lời đúng ngôn ngữ. Nhờ vậy Make và kho dữ liệu hiện tại chạy tiếp, không phải sửa gì.

## Sửa nội dung

- **Chữ trên web:** sửa trong `i18n.js`. Mỗi dòng có hai bản `vi` và `en`, nhớ sửa cả hai.
- **Sản phẩm:** sửa `products.js`. Mỗi chữ cần cả `vi` và `en`. `colors` quyết định màu hũ nến, màu sáp và ánh sáng ở đầu trang khi chọn mùi đó. Có ảnh thật thì thêm `image: "images/ten-anh.jpg"`.
- **Thêm sản phẩm thứ 7 trở lên:** thêm một khối vào `products.js`. Tiêu đề "Sáu mùi hương" nằm ở khoá `scents.title` trong `i18n.js`, nhớ đổi lại cho khớp số lượng.
- **Màu sắc, chữ:** biến `:root` ở đầu `styles.css`.

## Phông chữ

Web dùng Fraunces (tiêu đề) và Be Vietnam Pro (nội dung) tải từ Google Fonts, nên cần có mạng. Khi offline, trình duyệt dùng phông thay thế và giao diện vẫn dùng được.
