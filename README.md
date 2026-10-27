# Lịch tập

Web app theo dõi tập thể dục hằng ngày, làm cho điện thoại, không cần đăng nhập.

## 3 màn hình

1. **Hôm nay** – mở app mà hôm nay chưa xác nhận thì vào thẳng màn này. Chạm chọn danh mục (chọn được nhiều), chọn bài đã tập, rồi bấm *Xác nhận đã tập* hoặc *Không tập*. Nếu hôm qua chưa xác nhận sẽ có nút chuyển nhanh *Hôm qua* (cho trường hợp tập khuya, qua 0h mới mở app).
2. **Lịch** – cuộn dọc giống app Lịch iPhone. Ngày có tập được khoanh vòng mảnh theo màu danh mục, nhiều danh mục thì vòng chia nhiều phần. Ngày không tập hoặc nghỉ thì không có vòng. Chạm vào ngày để xem và sửa.
   - Nút **‹ 2026** góc trên mở **màn xem năm**: 12 tháng thu nhỏ, mỗi ngày có tập là 1 chấm màu, kèm tổng buổi, chuỗi dài nhất và số buổi theo danh mục của cả năm. Đổi năm bằng mũi tên hoặc vuốt ngang; chạm vào tháng để nhảy tới tháng đó.
   - Lịch chỉ dựng sẵn 12 tháng gần nhất cho nhẹ. Xem xa hơn: bấm *Xem các tháng trước* ở đầu lịch, hoặc nhảy từ màn xem năm. Mỗi tháng có kích thước tính trước nên trình duyệt chỉ vẽ phần đang nhìn thấy, cuộn không giật.
3. **Bài tập** – thêm/sửa/xoá danh mục (mỗi danh mục 1 màu), thêm bài tập trong từng danh mục, đổi thứ tự danh mục.

## Kiến trúc

- **Vite + Preact + TypeScript**, CSS thuần, font hệ thống. Bundle ~19 KB gzip.
- **Local-first**: dữ liệu luôn có sẵn trong `localStorage` → mở app là vẽ ngay, không spinner. Mọi thao tác cập nhật giao diện tức thì, rồi đẩy lên server trong nền qua hàng đợi (`outbox`). Mất mạng vẫn dùng bình thường, có mạng lại tự đồng bộ.
- **Service worker** cache toàn bộ app → lần mở sau gần như tức thì, kể cả offline. Bản deploy mới được tải ngầm, áp dụng ở lần mở kế tiếp.
- **1 API duy nhất** `POST /api/sync` (`api/sync.js`): gửi các thay đổi, nhận lại toàn bộ dữ liệu trong cùng 1 request. Xung đột giữa 2 máy: bản sửa sau thắng (theo thời điểm sửa).
- **DB: Upstash Redis** (tạo trong Vercel → Storage). 2 key: `lichtap:cats` (danh mục) và `lichtap:days` (hash theo ngày). Dữ liệu 1 năm ~40 KB.
- Xoá danh mục/bài tập là *xoá mềm*: ẩn khỏi danh sách nhưng lịch cũ vẫn giữ màu.
- Mỗi danh mục một màu riêng trong bảng 12 màu, không cho chọn màu đã có danh mục khác dùng.

```
api/sync.js              Vercel Function (đọc/ghi Redis)
src/lib/store.ts         state + localStorage + hàng đợi đồng bộ
src/components/          TodayScreen, CalendarScreen, YearView, ManageScreen, DayEditor, Sheet…
public/sw.js             service worker
```

## Deploy lên Vercel

1. Đẩy repo lên GitHub, import vào Vercel (Framework: **Vite**, để mặc định build `npm run build`, output `dist`).
2. Vercel → project → **Storage** → **Create** → **Upstash for Redis** (gói free là đủ) → chọn region gần nhất (Singapore) → **Connect** vào project. Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN`.
3. *(Nên làm)* Thêm biến môi trường `APP_KEY` = một chuỗi bí mật bất kỳ. Không có nó thì ai biết link cũng xem/sửa được dữ liệu.
   Sau đó mở app 1 lần bằng `https://<app>.vercel.app/?key=<APP_KEY>` — mã được lưu vào máy, URL tự xoá mã. Mỗi máy/trình duyệt mới làm lại 1 lần.
4. Redeploy (biến môi trường chỉ có hiệu lực sau khi deploy lại).
5. *(Tuỳ chọn)* Settings → Functions → Region chọn **Singapore (sin1)** cho cùng vùng với Redis.
6. Trên iPhone: mở bằng Safari → Chia sẻ → **Thêm vào MH chính** để chạy toàn màn hình như app.
   iOS chỉ đọc cấu hình thanh trạng thái **lúc thêm vào MH chính**: nếu đổi phần `<head>` của `index.html`, phải xoá icon cũ rồi thêm lại (trước đó mở trang trong Safari và tải lại 2 lần để chắc chắn đang là bản mới).

## Chạy ở máy

```bash
npm install
npm run dev          # chỉ giao diện, dữ liệu lưu localStorage (API sẽ báo lỗi, không sao)
vercel dev           # giao diện + API thật (cần `vercel link` và `vercel env pull`)
npm run build:demo   # bản demo 1 file HTML có dữ liệu mẫu: dist-demo/demo.html
```

## Biến môi trường

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | có | Vercel tự thêm khi connect Upstash. Cũng nhận `UPSTASH_REDIS_REST_URL/TOKEN`. |
| `APP_KEY` | nên có | Mã truy cập đơn giản cho app cá nhân. |
| `KEY_PREFIX` | không | Tiền tố key Redis, mặc định `lichtap`. |

## Ghi chú

- “Hôm nay” tính theo giờ của điện thoại.
