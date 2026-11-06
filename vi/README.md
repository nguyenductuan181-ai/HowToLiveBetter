# Cẩm nang sống đáng giá: Ấn bản tiếng Việt

Bản chuyển hóa và hiệu đính tiếng Việt của tác phẩm 《高性价比人生指南》 (HowToLiveBetter), nguyên tác của **eternity4719**: <https://github.com/eternity4719/HowToLiveBetter>.

Kho lưu trữ và theo dõi phát triển ấn bản thích ứng Việt Nam: <https://github.com/nguyenductuan181-ai/HowToLiveBetter>.

Tệp sách điện tử hoàn chỉnh: **`dist/HowToLiveBetter-vi.epub`** (định dạng EPUB 3, reflowable, chuẩn ngôn ngữ `vi`).

## Nội dung và quy mô

- 34 chương với 772 mục hành động định lượng.
- Mỗi mục chuẩn hóa đầy đủ: tiêu đề hành động, Chi phí, Nói dễ hiểu, Lợi ích, Mức chứng cứ, Nguồn dẫn chứng, Ghi chú.
- 10 bài chuyên khảo sâu (phụ lục) bao quát các thời khắc quyết định của đời người: sổ tay đối chiếu thực thi tại Việt Nam, hôn nhân, danh mục khẩn cấp, cứu người bị nạn, giấy phép nền tảng số, nhịp sinh học ca đêm, mất việc làm, sinh con, bệnh mạn tính, chuyển vùng sinh sống.
- Lời giới thiệu, bối cảnh thực thi và bảng đối chiếu thuật ngữ.

## Cấu trúc thư mục

```
vi/
  front/           lời giới thiệu, bối cảnh, bảng thuật ngữ, thông tin ấn bản
  book/            34 chương nội dung cốt lõi tiếng Việt
  docs/            10 bài chuyên khảo sâu và sổ tay thực thi tại Việt Nam
  fonts/           bộ phông chữ Literata, Be Vietnam Pro, Cormorant Garamond (OFL 1.1)
  source.json      cam kết nguyên tác, giấy phép và siêu dữ liệu
  manifest.json    bản đồ đối soát từ nguyên tác tiếng Trung sang bản dịch
  qa/              dữ liệu kiểm định chất lượng, báo cáo đối chiếu
tools/vi/
  build-epub.mjs        kịch bản đóng gói tệp EPUB tự động
  make-cover.mjs        kịch bản tạo bìa sách tiêu chuẩn
  check-content.mjs     kịch bản kiểm tra tính toàn vẹn của nội dung
  audit.mjs             đối chiếu chi tiết số liệu với nguyên tác
```

## Dựng tệp EPUB

Yêu cầu môi trường: Node.js phiên bản 20 trở lên.

```bash
npm --prefix tools/vi ci
node tools/vi/build-epub.mjs
```

Sau khi chạy xong, tệp sách điện tử xuất xưởng tại `dist/HowToLiveBetter-vi.epub`.

## Tiêu chí chất lượng

- **Bảo toàn số liệu:** Mọi chỉ số thống kê, khoảng tin cậy, tỷ số nguy cơ và mã số DOI nghiên cứu từ nguyên tác đều được bảo toàn.
- **Bản địa hóa thực tế:** Các quy định mang tính hành chính đặc thù của Trung Quốc được chú thích rõ, đồng thời được quy chiếu trực tiếp sang pháp luật Việt Nam (Bộ luật Lao động 2019, Luật BHYT, Luật Hôn nhân & Gia đình) trong Sổ tay thực thi tại Việt Nam.
- **Quy chuẩn hiển thị:** Tương thích tốt với các dòng máy đọc sách màn hình mực điện tử e-ink (Kindle, Boox, Kobo) nhờ độ tương phản cao và phông chữ tiếng Việt đầy đủ dấu thanh.

## Giấy phép và ghi công

- Nguyên tác và bản dịch phát hành theo giấy phép bản quyền mở **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
- Bản ấn bản kế thừa nền tảng của cộng đồng HowToLiveBetter-vi (chuanman2707, thuongtin), sau đó được hiệu đính và bổ sung tài liệu thực thi cho người Việt bởi Nguyen Duc Tuan.
