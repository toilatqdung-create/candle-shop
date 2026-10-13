# Website nến thơm — bản demo (Hướng A)

Website tĩnh (HTML/CSS/JS thuần), không cần cài thư viện hay build.

## 1. Chạy thử trên localhost

Mở terminal trong thư mục `candle-shop`, chạy MỘT trong các lệnh:

```bash
python3 -m http.server 8000     # nếu có Python
# hoặc
npx serve .                      # nếu có Node.js
```

Mở trình duyệt: http://localhost:8000

(Nên chạy qua server như trên thay vì bấm đúp file `index.html`, để hành vi giống khi lên GitHub Pages.)

## 2. Tuỳ chỉnh

| Muốn đổi gì | Sửa file |
|---|---|
| Tên shop, hotline, fanpage, phí ship, ngân hàng, webhook | `config.js` |
| Mùi hương, giá, mô tả | `products.js` |
| Màu sắc, font | `styles.css` (biến `:root` ở đầu file) |
| Nội dung câu chuyện, cách dùng, hỏi đáp | `index.html` |

Dùng ảnh thật: bỏ ảnh vào thư mục `images/`, rồi thêm `image: "images/ten-anh.jpg"` vào sản phẩm trong `products.js`.

## 3. Đưa lên GitHub Pages

1. Tạo repo mới trên GitHub (ví dụ `candle-shop`), để Public.
2. Trong thư mục dự án:
   ```bash
   git init
   git add .
   git commit -m "Website nen thom"
   git branch -M main
   git remote add origin https://github.com/<ten-ban>/candle-shop.git
   git push -u origin main
   ```
3. Vào repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
4. Sau 1–2 phút web chạy tại `https://<ten-ban>.github.io/candle-shop/`.

Khi có domain riêng: Settings → Pages → Custom domain, rồi trỏ DNS (CNAME) về `<ten-ban>.github.io`. Bật "Enforce HTTPS".

## 4. Nhận đơn về Telegram (qua Make.com)

Website gửi mỗi đơn dưới dạng JSON tới một webhook. Trường `text` đã là tin nhắn dựng sẵn.

1. **Tạo bot Telegram:** chat với `@BotFather` → `/newbot` → lấy **token**.
2. Tạo nhóm Telegram (bật Topics nếu muốn), thêm bot vào nhóm. Lấy `chat_id` của nhóm (thêm `@RawDataBot` vào nhóm một lúc để xem id, rồi xoá nó).
3. Trên **make.com** tạo scenario:
   - Module 1: **Webhooks → Custom webhook** (copy URL webhook).
   - Module 2: **Telegram Bot → Send a Text Message or a Reply**, chọn kết nối bằng token, Chat ID = id nhóm, Text = trường `text` từ webhook.
   - (Tuỳ chọn) Module 3: **Google Sheets → Add a Row** để lưu đơn vào sheet.
4. Dán URL webhook vào `orderWebhookUrl` trong `config.js`, đẩy lại lên GitHub.

Lưu ý bảo mật: **không bao giờ để token bot Telegram trong code web** (ai cũng xem được). Token chỉ nằm trong Make/n8n. Webhook URL thì khó đoán nhưng vẫn công khai, nên nếu bị spam hãy chuyển sang n8n/Cloudflare Worker có kiểm tra thêm.

## 5. Giới hạn của bản demo

- Giỏ hàng lưu trong trình duyệt của khách, chưa có tài khoản hay trừ tồn kho tự động.
- Mã VietQR chỉ là gợi ý thanh toán, chưa tự xác nhận tiền về. Bạn đối soát thủ công (hoặc dùng PayOS/Casso sau này).
- Chưa có chống spam đơn ảo. Khi chạy thật nên thêm kiểm tra (ví dụ Cloudflare Turnstile).
