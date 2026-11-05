# Trang đọc online

Trang đọc EPUB tiếng Việt trên trình duyệt, chạy tại <https://sach.thantamtue.vn/how-to-live-better>.

- Đọc thẳng file `/HowToLiveBetter-vi.epub` trong cùng bucket R2 bằng epub.js 0.3.93 và JSZip 3.10.1 (tự host, không gọi CDN ngoài).
- Có mục lục lọc được, tìm toàn văn gõ không dấu, cỡ chữ, nền sáng/vàng/tối, chữ có chân/không chân, chế độ cuộn hoặc lật trang, nhớ vị trí đọc, link sâu tới từng mục (`#ch13.xhtml%23s13e5`).
- Trên màn hình rộng mục lục ghim thành cột bên trái; thanh dưới hiện mục đang đọc; nút liên kết chép hoặc chia sẻ link tới đúng mục đó.
- Nút tải EPUB kèm hướng dẫn mở file trên iPhone, Android, Windows, Kindle; tự báo khi đang mở trong Zalo, Facebook, Messenger.

## Build và đăng

Chạy ở thư mục gốc của repo:

```sh
npm --prefix tools/vi/web-reader ci
npm --prefix tools/vi/web-reader run build      # ra dist/web-reader/
CLOUDFLARE_ACCOUNT_ID=<id> sh tools/vi/web-reader/deploy.sh
```

R2 không có trang index, nên trang được upload thành ba key: `how-to-live-better`, `how-to-live-better/` và `how-to-live-better/index.html`. CSS và JS mang `?v=<hash>` nên được cache lâu; trang HTML cache 5 phút.

Khi ra bản EPUB mới chỉ cần ghi đè object `HowToLiveBetter-vi.epub`; trang đọc luôn lấy bản đó.
