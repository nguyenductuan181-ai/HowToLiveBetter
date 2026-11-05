# Trang đọc online

Trang đọc EPUB tiếng Việt trên trình duyệt, chạy tại <https://sach.thantamtue.vn/how-to-live-better>.

- Đọc thẳng file `/HowToLiveBetter-vi.epub` trong cùng bucket R2 bằng epub.js 0.3.93 và JSZip 3.10.1 (tự host, không gọi CDN ngoài).
- Có mục lục lọc được, tìm toàn văn gõ không dấu, cỡ chữ, nền sáng/vàng/tối, chữ có chân/không chân, chế độ cuộn hoặc lật trang, nhớ vị trí đọc, link sâu tới từng mục (`#ch13.xhtml%23s13e5`).
- Trên màn hình rộng mục lục ghim thành cột bên trái; thanh dưới hiện mục đang đọc; nút liên kết chép hoặc chia sẻ link tới đúng mục đó.
- Bản HTML thuần ở `/how-to-live-better/doc/`: mỗi chương một trang tĩnh, chữ nằm thẳng trong trang (không iframe, không cần JS), nên chế độ đọc (Reader) của Safari, Firefox, Edge, Chrome dùng được, in và dịch trang được, Google đọc được. Phím ← → sang chương trước, sau.
- Phím tắt trong trình đọc: ← → phần hoặc trang, Space / Shift+Space / PageUp / PageDown cuộn một màn (cuối phần thì sang phần sau), ↑ ↓, Home, End, `/` tìm, `T` mục lục, Esc đóng bảng.
- Nền Tự động theo máy, Sáng, Vàng, Tối; nút mặt trời/mặt trăng trên thanh trên đổi nhanh sáng và tối, bản HTML dùng chung lựa chọn này.
- Nút tải EPUB kèm hướng dẫn mở file trên iPhone, Android, Windows, Kindle; tự báo khi đang mở trong Zalo, Facebook, Messenger.

## Build và đăng

Chạy ở thư mục gốc của repo:

```sh
npm --prefix tools/vi/web-reader ci
curl -L -o /tmp/htlb-vi.epub https://sach.thantamtue.vn/HowToLiveBetter-vi.epub
npm --prefix tools/vi/web-reader run build -- --epub /tmp/htlb-vi.epub   # ra dist/web-reader/
CLOUDFLARE_ACCOUNT_ID=<id> sh tools/vi/web-reader/deploy.sh
```

R2 không có trang index, nên trang được upload thành ba key: `how-to-live-better`, `how-to-live-better/` và `how-to-live-better/index.html`. CSS và JS mang `?v=<hash>` nên được cache lâu; trang HTML cache 5 phút.

Khi ra bản EPUB mới thì ghi đè object `HowToLiveBetter-vi.epub` (trình đọc lấy ngay bản đó), rồi build và deploy lại để bản HTML thuần khớp nội dung mới.
