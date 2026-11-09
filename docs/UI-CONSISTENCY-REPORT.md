# 🧩 BÁO CÁO ĐỒNG NHẤT UI/UX & LOGIC — Manga · Movie · Music · Media

> **Ngày rà soát:** 2026-11-04 · **Commit:** `a511bcd` (nhánh `main`)
> **Phạm vi:** React app (`react-app/src`) — các trang danh sách, card, slider, player/reader, store và hook của 4 loại nội dung.
> **Phương pháp:** đọc và đặt cạnh nhau code của từng loại, đối chiếu tên trường với backend. Chưa chạy app để kiểm tra trực quan; mục nào cần xác nhận trên giao diện được ghi *"cần kiểm tra"*.
> **Liên quan:** [ISSUES-REPORT.md](ISSUES-REPORT.md) (B6, B7 được nhắc lại ở đây) · [DEAD-CODE-REPORT.md](DEAD-CODE-REPORT.md)
> **Lưu ý (2026-11-09):** số dòng trong các link là vị trí lúc rà soát; các trang Manga/Movie/Music đã được viết lại trong đợt thiết kế card nên nhiều link lệch dòng. Lỗi phát hiện sau đó (R1–R7) xem [AUDIT-2026-11-09.md](AUDIT-2026-11-09.md).

---

## 1. Trả lời ngắn

**Nhìn thì giống, nhưng bên trong không giống.**

- **Manga, Movie, Music** có *bố cục* gần như y hệt: slider Random / Top / Recent ở trên, khung trắng chứa nút Back + breadcrumb + "Per page" + Filter + Grid/List, ô tìm kiếm, ô thống kê, lưới card, phân trang. Lý do: các trang này được **copy-paste từ nhau** rồi sửa tay, **không có component khung dùng chung**.
- Vì copy rồi sửa riêng, **chi tiết và logic đã lệch nhau**: mỗi loại tìm kiếm khác, sắp xếp khác, phân trang khác, lưu "Recent" khác, đếm lượt xem khác, báo lỗi khác. Một số chỗ lệch đã thành **bug** (mục 5).
- **Media Gallery** là **một ứng dụng khác hẳn** (kiểu Google Photos): thanh công cụ riêng, không slider, không ô tìm kiếm, phân trang phía server, state cục bộ thay vì store. Không theo khuôn của 3 loại kia.

Hình dung đơn giản:

```
                 ┌──────────── Dùng chung thật sự ────────────┐
                 │ Layout/Header/Sidebar · Breadcrumb · Button │
                 │ Pagination* · DeleteConfirmModal · Slider  │
                 │ (RandomSlider/TopViewSlider/RecentSlider    │
                 │  + UniversalCard)                           │
                 └─────────────────────────────────────────────┘
  ┌───────── Viết riêng cho từng loại (copy-paste rồi sửa) ─────────┐
  │ MangaHome 710 dòng │ MovieHome 504 dòng │ MusicHome 530 dòng     │
  │ MangaCard (CSS)    │ MovieCard (Tailwind)│ MusicCard (Tailwind+   │
  │                    │                     │  framer-motion)        │
  │ fetchMangaFolders  │ fetchMovieFolders   │ fetchMusicFolders      │
  │ useRecentManager   │ useRecentMoviesMgr  │ useRecentMusicManager  │
  └─────────────────────────────────────────────────────────────────┘
  ┌────────── Ứng dụng riêng ──────────┐
  │ MediaHome + 5 component media/*    │
  └────────────────────────────────────┘
  * Manga và Media không dùng Pagination chung, tự viết nút Prev/Next.
```

---

## 2. So sánh trang danh sách (Home)

| Hạng mục | Manga | Movie | Music | Media |
|---|---|---|---|---|
| Slider Random/Top/Recent | Có, **chỉ ở thư mục gốc** | Có, mọi cấp thư mục | Có, mọi cấp thư mục | Không có |
| Khoảng đệm trang | `p-1 sm:p-2` (sát mép) | `p-3 sm:p-6` | `p-3 sm:p-6` | `container px-4 py-6` |
| Thống kê | 3 ô: Tổng · **Yêu thích** · Kết quả | 4 ô: Tổng · Thư mục · File video · Kết quả | 4 ô: Tổng · Thư mục · File audio · Kết quả | Không có |
| Số cột lưới (xl) | 6 | 9 | 10 | 6 (thư mục) |
| Tỷ lệ ảnh card | Bìa dọc (CSS riêng) | 16:9 | 1:1 | Ảnh vuông/tự do |
| Chế độ List | Viết **thẳng trong trang** | `MovieCard variant="list"` | `MusicCard variant="list"` | Không có |
| Tìm kiếm | Chỉ theo **tên**, phân biệt dấu | Tên + đường dẫn, **bỏ dấu** | Tên/ca sĩ/album/tiêu đề/đường dẫn, **bỏ dấu** | Không có |
| Sắp xếp | Tên (tự nhiên 1,2,10) — trước đây có thêm "Ngày", "Lượt xem" nhưng không hoạt động (U3) | Tên · Loại · Lượt xem (U2) | **Thư mục luôn lên đầu**, rồi Tên/Ca sĩ/Album/Lượt nghe | Server sắp theo ngày chụp |
| Lựa chọn "Per page" | 12–96 (không có 1) | 1–96 | 1–96 | Cố định 100 |
| Phân trang | Nút Prev/Next + hộp "Jump" **tự viết**, trang lưu **trên URL** | Component `Pagination` chung, trang lưu **trong state** | Như Movie | Nút Prev/Next tự viết, phân trang **phía server** |
| Quay lại từ player/reader | Về đúng trang cũ, **tự nhảy tới item vừa xem** (`focus`) | **Về trang 1** | **Về trang 1** | — |
| Grid/List được nhớ? | Không | Không | Không | — |
| Màn hình tải | Spinner riêng, chữ tiếng Việt | `LoadingOverlay`, tiếng Anh | `LoadingOverlay`, tiếng Anh | Spinner riêng |
| Khi lỗi | **Thay cả trang**, có nút "Thử lại" | Banner đỏ, **không** có nút thử lại | Banner đỏ, không nút thử lại | Toast |
| Xoá item | Toast (do trang gọi) + tải lại danh sách | Toast (do store gọi), nội dung rỗng (U9) | Như Movie | Toast + tải lại |
| Ngôn ngữ | Pha Việt/Anh ("Tìm kiếm manga...") | Tiếng Anh | Tiếng Anh | Pha Việt/Anh |
| Bộ icon | lucide-react **+** react-icons | lucide-react **+** react-icons | react-icons | lucide-react + SVG tay |
| Panel Filter | Hiện tức thì | Hiện tức thì, nằm **dưới** ô thống kê | Có hiệu ứng mở (framer-motion), nằm **trên** ô thống kê | — |

**Kết luận phần UI:** người dùng sẽ thấy 3 trang "na ná nhau" nhưng mỗi nơi phản ứng một kiểu: Manga nhớ trang còn Movie/Music thì không; Music luôn đưa thư mục lên đầu còn Movie thì trộn lẫn. Trước bản sửa 2026-11-04, **mọi toast `showToast` đều không hiện** trên các trang danh sách (xem U9).

---

## 3. So sánh card

Hiện có **4 loại card** cho cùng một khái niệm "item trong thư mục":

| | `MangaCard` | `MovieCard` | `MusicCard` | `UniversalCard` (trong slider) |
|---|---|---|---|---|
| Style | Class CSS `manga-card` riêng | Tailwind | Tailwind + framer-motion (phóng to khi hover) | Tailwind + hằng số `uiStyles` |
| Nút ❤️ | Có (cha xử lý) | Có (card tự gọi store) | **Không** — thay bằng nút ➕ thêm playlist | Có, ẩn với music |
| Nhãn loại (Folder/mp4…) | Không | Có (góc dưới trái) | Có (góc trên trái) | Có |
| Lượt xem | Không hiển thị | Ẩn (`showViews=false`) | Lưới: **không bao giờ hiện** (U1) · List: "N plays" | Có |
| Thư mục được làm nổi | Không | Không | Viền xanh/tím + số item | Không |

### Cùng một thao tác, kết quả khác nhau

- **Bấm vào thư mục nhạc**: ở lưới (`MusicCard`) → **mở thư mục** ([MusicCard.jsx:44](../react-app/src/components/music/MusicCard.jsx#L44)); ở slider (`UniversalCard`) → **phát cả thư mục trong player** ([UniversalCard.jsx:206](../react-app/src/components/common/UniversalCard.jsx#L206)). Có comment cho thấy đây là chủ ý, nhưng người dùng sẽ thấy cùng một hình thư mục mà bấm ra hai kết quả.
- **Bấm vào manga từ slider** → `UniversalCard` gọi API tăng view **rồi** reader lại tăng view lần nữa ([UniversalCard.jsx:125-135](../react-app/src/components/common/UniversalCard.jsx#L125), [MangaReader.jsx:512-517](../react-app/src/pages/manga/MangaReader.jsx#L512)). Bấm từ lưới thì chỉ tăng 1 lần. (U6)
- **Slider ghi "Recent" cả khi bấm thư mục**, lưới thì chỉ ghi khi mở nội dung.

---

## 4. So sánh logic

### 4.1. Tải danh sách thư mục (store)

| | Manga | Movie | Music |
|---|---|---|---|
| Hàm | `fetchMangaFolders` [store/index.js:258](../react-app/src/store/index.js#L258) | `fetchMovieFolders` [:538](../react-app/src/store/index.js#L538) | `fetchMusicFolders` [:875](../react-app/src/store/index.js#L875) |
| Cache | **localStorage** (`mangaCache`) — mở lại thư mục không gọi API | Không cache | Không cache |
| Chống gọi trùng | Không | Map "in-flight" | Map "in-flight" |
| Kiểm tra prefix nguồn trước khi tải | `ROOT_` | `V_` | **Không kiểm tra** (U4) |
| Dựng URL thumbnail | Không xử lý (hàm `cleanImageUrl` không làm gì) | ~40 dòng tự dựng `/video/...` | ~25 dòng tự dựng `/audio/...` (bản sao của Movie) |

Ngoài ra còn `utils/thumbnailUtils.js` (`buildThumbnailUrl`, `processThumbnails`) — một cách dựng thumbnail **thứ ba**, dùng cho slider và Recent.

### 4.2. "Đã xem gần đây" (Recent) — 3 cách ghi, 1 cách đọc

Slider Recent luôn **đọc** bằng `useRecentItems`, sắp xếp theo trường `lastViewed` ([useRecentItems.js:83](../react-app/src/hooks/useRecentItems.js#L83)) và hiện "x phút trước" từ `item.lastViewed`. Nhưng việc **ghi** thì mỗi loại một kiểu:

| | Manga | Movie | Music |
|---|---|---|---|
| Ai ghi | `MangaCard`, `MangaReader`, `UniversalCard` → `useRecentManager` | `MovieCard` → `useRecentMoviesManager` **và** `MoviePlayer` → `useRecentManager` (ghi 2 lần) | `MusicPlayer`/`V2` → `useRecentMusicManager`; slider → `useRecentManager` |
| Trường thời gian | `lastViewed` ✅ | `timestamp` rồi bị ghi đè bằng `lastViewed` | **`timestamp`** ❌ |
| Giới hạn | `recentHistoryCount` (cài đặt, mặc định 20) | 20 | **50** |
| Tôn trọng "Tắt theo dõi Recent" | Có | Có (qua MoviePlayer) / Không (qua MovieCard) | **Không** |

→ Hệ quả: bài hát phát từ player **không có nhãn thời gian** trong slider Recent và bị xếp **dưới** những mục có `lastViewed` dù nghe gần hơn (U5). Tắt "Recent tracking" trong cài đặt thì Music vẫn ghi.

Lưu ý thêm: cài đặt Recent (bật/tắt, số lượng) nằm trong **`mangaSettings`** nhưng áp dụng cho cả Movie và Music.

### 4.3. Đếm lượt xem — 3 quy tắc khác nhau

| | Manga | Movie | Music |
|---|---|---|---|
| Khi nào tính 1 lượt | Ngay khi **mở** reader | Sau khi xem **≥ 3 giây** | **Mỗi lần sự kiện `play`** (chống trùng chỉ 1 giây) |
| Tạm dừng rồi phát tiếp | — | Không tính thêm | **Tính thêm 1 lượt** (U7 — chủ ý của tác giả) |
| Gọi API bằng | `apiService` (có token) | `fetch()` trần (không token) | `fetch()` trần (không token) |
| Vị trí | [MangaReader.jsx:170](../react-app/src/pages/manga/MangaReader.jsx#L170) | [MoviePlayer.jsx:291](../react-app/src/pages/movie/MoviePlayer.jsx#L291) | [MusicPlayerProvider.jsx:119](../react-app/src/components/music/MusicPlayerProvider.jsx#L119) (dùng chung cho player v1 và v2) |

Vì Movie/Music dùng `fetch()` không gắn `x-secure-token`, **nguồn được bảo vệ bằng mật khẩu sẽ không bao giờ tăng view** (đã ghi ở ISSUES **B6**). Top Views / Most Played của nguồn đó sẽ trống.

### 4.4. Yêu thích / Playlist

- Manga, Movie: có ❤️ và trang Favorites riêng (`/manga/favorites`, `/movie/favorites`). Hai trang này cũng viết riêng: `MovieFavorites` dùng `MovieCard`, `MangaFavorites` tự vẽ card.
- Music: **không có favorite**, thay bằng Playlist (`/music/playlists`). Store music không có `toggleFavorite`.
- Media: favorite là một **tab** trong trang (`view=favorites`), cập nhật lạc quan (optimistic).

Đây là khác biệt **hợp lý theo loại nội dung**, không cần ép giống nhau — nhưng nên ghi rõ thành quy ước.

### 4.5. Player / Reader

- Mỗi loại một trang toàn màn hình riêng, **header và nút Back khác nhau**: Manga dùng `returnUrl` trên URL để quay về đúng chỗ; Movie tự dựng URL thư mục cha; Music có **2 player** (v1, v2 — mobile luôn v1, [App.jsx:32-45](../react-app/src/App.jsx#L32)) và quay về thư mục cha.
- Khác nhau về giao diện ở đây là bình thường (đọc truyện ≠ xem phim ≠ nghe nhạc). Cái nên đồng nhất là **hành vi quay lại** (về đúng trang/vị trí cũ) — hiện chỉ Manga làm được.

---

## 5. Bug sinh ra từ việc lệch nhau

> **Cập nhật 2026-11-04:** đã sửa U1, U2, U3, U4, U6, U8, U9 (cột *Trạng thái*). Mới kiểm tra cú pháp bằng esbuild, **chưa chạy app** để xác nhận trên giao diện.

| Mã | Mức | Vấn đề | Vị trí | Cách sửa | Trạng thái |
|---|---|---|---|---|---|
| **U1** | 🟡 | Lưới Music không bao giờ hiện số lượt nghe: card đọc `item.views`, backend trả `viewCount` (chế độ List thì đọc đúng `viewCount`) | [MusicCard.jsx:146](../react-app/src/components/music/MusicCard.jsx#L146) | Đổi thành `item.viewCount > 0` | ✅ Đã sửa (MovieCard cũng đổi sang `viewCount` cho đồng bộ) |
| **U2** | 🟡 | Movie "Sort by Views" không có tác dụng: sắp theo `views`, backend trả `viewCount` (`SELECT *` ở [movie-folder.js:22](../backend/api/movie/movie-folder.js#L22)) | [MovieHome.jsx:183](../react-app/src/pages/movie/MovieHome.jsx#L183) | Đổi thành `viewCount` | ✅ Đã sửa |
| **U3** | 🟡 | Manga có lựa chọn "Last Updated" và "Most Viewed" nhưng cả hai không có tác dụng: API `mode=path` (cả đọc ổ đĩa lẫn đọc DB, [folder-loader.js:174](../backend/utils/folder-loader.js#L174)) chỉ trả `name/path/thumbnail` — không có ngày, size hay lượt xem | [MangaHome.jsx:284-304](../react-app/src/pages/manga/MangaHome.jsx#L284) | Bỏ 2 lựa chọn và nhánh `date`/`size` không dùng. Muốn sắp theo lượt xem thì backend phải join bảng `views` ở `mode=path` | ✅ Đã sửa (bỏ lựa chọn) |
| **U4** | 🟡 | MusicHome tải dữ liệu với **bất kỳ** `sourceKey` (Manga/Movie kiểm tra prefix). Đang ở nguồn `ROOT_*`/`V_*`/`MEDIA_*` rồi bấm "Music" ở sidebar → gọi API music với key sai → lỗi hoặc danh sách rỗng (*cần kiểm tra* thông báo hiển thị) | [MusicHome.jsx:111](../react-app/src/pages/music/MusicHome.jsx#L111) | Thêm `sourceKey.startsWith('M_')` như 2 trang kia | ✅ Đã sửa |
| **U5** | 🟡 | Recent của Music ghi `timestamp` nhưng slider đọc `lastViewed` → mất nhãn "x phút trước", thứ tự sai khi trộn với mục ghi từ slider; giới hạn 50 thay vì cài đặt; bỏ qua công tắc tắt Recent | [useMusicData.js:142-146](../react-app/src/hooks/useMusicData.js#L142), [useRecentItems.js:83](../react-app/src/hooks/useRecentItems.js#L83) | Cho Music dùng `useRecentManager('music')` (hoặc ghi `lastViewed`) | Chưa sửa |
| **U6** | 🟢 | Mở manga từ slider bị tính **2 lượt xem** (UniversalCard + Reader) | [UniversalCard.jsx:124-127](../react-app/src/components/common/UniversalCard.jsx#L124) | Bỏ lời gọi trong UniversalCard — Reader đã đếm, giống cách Movie/Music đang làm | ✅ Đã sửa |
| **U7** | 🟢 | Music tính thêm 1 lượt mỗi lần tạm dừng rồi phát lại | [MusicPlayerProvider.jsx:119-145](../react-app/src/components/music/MusicPlayerProvider.jsx#L119) | *(Nếu muốn đổi)* Đánh dấu "đã đếm" theo bài như MoviePlayer — số lượt nghe sẽ thấp hơn trước | ⚪ Giữ nguyên — **chủ ý của tác giả**: commit `e5c9f9e` (2025-08-09) ghi *"Removed viewedTracksRef to allow counting on every playback start"* |
| **U8** | 🟢 | Manga và Media truyền `isLoading` cho `DeleteConfirmModal`, nhưng modal chỉ nhận `isDeleting` → khi đang xoá nút không bị khoá, không có trạng thái chờ, bấm được nhiều lần | [MangaHome.jsx:698](../react-app/src/pages/manga/MangaHome.jsx#L698), [MediaHome.jsx:449](../react-app/src/pages/media/MediaHome.jsx#L449), [DeleteConfirmModal.jsx:17](../react-app/src/components/common/DeleteConfirmModal.jsx#L17) | Đổi prop thành `isDeleting` | ✅ Đã sửa |
| **U9** | 🟠 | *(Đính chính: bản đầu ghi "Movie/Music xoá không báo gì" — sai, store của hai loại này có gọi toast.)* Vấn đề thật có 2 lớp: (1) component `<Toast />` hiển thị `useUIStore().showToast` **chỉ được gắn trong MoviePlayer**, nên ~130 lời gọi `showToast` ở mọi trang khác (xoá, favorite Media, playlist, lỗi tải…) **không bao giờ hiện**; (2) store Movie/Music đọc `result.message`/`result.type` trên response axios thay vì `result.data.*` → toast thành công rỗng, lỗi chỉ hiện chuỗi chung của axios | [App.jsx:69](../react-app/src/App.jsx#L69), [store/index.js:779-808](../react-app/src/store/index.js#L779), [:1005-1027](../react-app/src/store/index.js#L1005) | Gắn `<Toast />` một lần ở `App.jsx` (bỏ bản trong MoviePlayer); đọc `result.data`, lỗi lấy `err.response.data.error` | ✅ Đã sửa |
| **U10** | 🟢 | Movie/Music về trang 1 sau khi thoát player (trang lưu trong state), Manga thì giữ trang | [MovieHome.jsx:39](../react-app/src/pages/movie/MovieHome.jsx#L39), [MusicHome.jsx:51](../react-app/src/pages/music/MusicHome.jsx#L51) | Lưu `page` lên URL như Manga | ✅ Đã sửa 2026-11-05 — `useFolderBrowser` lưu `page/size/sort` trên URL (xem [CARD-REDESIGN-PROPOSAL.md](CARD-REDESIGN-PROPOSAL.md)) |
| **U11** | 🟢 | `RecentSlider` lấy store theo `type === 'movie' ? movieStore : mangaStore` → Music dùng nhầm store Manga (hiện chưa lộ ra vì card music ẩn ❤️). Cùng file có `return null` **trước** khi gọi hook `useRecentItems` → vi phạm Rules of Hooks khi bật/tắt Recent tracking lúc đang ở trang Manga | [RecentSlider.jsx:57](../react-app/src/components/common/RecentSlider.jsx#L57), [:67-75](../react-app/src/components/common/RecentSlider.jsx#L67) | Chọn store giống `RandomSlider`; đưa điều kiện vào `enabled` của hook | ✅ Đã sửa 2026-11-08 (`return null` chuyển xuống sau mọi hook) |

Đã có trong [ISSUES-REPORT.md](ISSUES-REPORT.md): **B6** (fetch không token → view movie/music thất bại với nguồn bảo mật), **B7** (MangaReader gửi `increase-view` sai payload khi thêm vào hàng đợi tải).

---

## 6. Vì sao lại thành ra thế này

1. **Không có "khung trang duyệt thư mục" dùng chung.** Toàn bộ phần đầu trang (Back, breadcrumb, per-page, filter, grid/list, search, stats, phân trang) được lặp lại 3 lần, khoảng 400 dòng mỗi trang. Sửa một chỗ thì 2 chỗ kia không được sửa theo.
2. **Mỗi loại có card riêng + slider lại có card thứ tư.** Logic điều hướng khi bấm card nằm ở 4 nơi.
3. **Logic dữ liệu bị nhân bản**: 3 hàm fetch, 3 cách dựng thumbnail, 3 hook ghi Recent, 3 quy tắc đếm view.
4. **Tên trường không thống nhất giữa frontend và backend** (`views` vs `viewCount`, `timestamp` vs `lastViewed`) — nguồn gốc của U1, U2, U5.
5. Cài đặt chung (Recent) lại nằm trong store của Manga (`mangaSettings`).

---

## 7. Đề xuất

### Bước 1 — Sửa nhanh (mỗi mục vài dòng, không đổi kiến trúc)

U1, U2, U3, U4, U8, U9 và U6 — ✅ **đã làm 2026-11-04**. U10 — ✅ đã làm 2026-11-05 (cùng đợt gộp khung chung). U11 — ✅ đã làm 2026-11-08. U7 giữ nguyên vì là chủ ý. Còn lại: U5.

### Bước 2 — Thống nhất hành vi (vẫn giữ 3 trang riêng)

- Một hook ghi Recent duy nhất: `useRecentManager(type)` cho cả 3 loại, luôn ghi `lastViewed` (sửa U5, xoá `useRecentMoviesManager`/`useRecentMusicManager` — `useRandomMovies`, `useTopViewMovies`, `useRandomMusic`, `useTopViewMusic` hiện không ai dùng).
- Một quy tắc đếm view: đếm ở player/reader, 1 lần cho mỗi lần mở, qua `apiService` (sửa U6, B6; U7 là chủ ý của tác giả nên Music vẫn đếm mỗi lần bắt đầu phát).
- Lưu `page` và `view` (grid/list) lên URL/localStorage cho cả 3 loại (sửa U10 — ✅ đã làm qua `useFolderBrowser`).
- Thống nhất: tìm kiếm bỏ dấu, thư mục luôn lên đầu, sắp xếp tự nhiên, toast khi xoá, cùng component loading/error, một bộ icon, một ngôn ngữ hiển thị.

### Bước 3 — Gộp khung chung (refactor)

> ✅ **Đã làm 2026-11-05** theo [CARD-REDESIGN-PROPOSAL.md](CARD-REDESIGN-PROPOSAL.md): `ItemCard` dùng chung + `BrowseLayout`/`useFolderBrowser` cho Manga/Movie/Music. Phần trình phát nhạc chung xem [MUSIC-UX-REVIEW.md](MUSIC-UX-REVIEW.md) (P1).

```
components/browse/
  BrowseLayout.jsx      ← Back + Breadcrumb + PerPage + Filter + Grid/List + Search + Stats + Pagination
  useFolderBrowser.js   ← đọc path/page/size/sort từ URL, lọc, sắp xếp, phân trang, xoá
  ItemCard.jsx          ← 1 card, nhận "adapter" theo loại (tỷ lệ ảnh, nút ❤️ hay ➕, cách điều hướng)
config/contentTypes.js  ← mỗi loại khai báo: prefix key, store, tuỳ chọn sort, cột lưới, tỷ lệ ảnh, route player
```

Khi đó `MangaHome`/`MovieHome`/`MusicHome` chỉ còn khoảng 50–100 dòng khai báo, và `UniversalCard` trong slider dùng chung `ItemCard`. Media Gallery có thể giữ nguyên cấu trúc riêng nhưng nên dùng lại `Breadcrumb`, `Pagination` và nút Back để cảm giác điều hướng giống phần còn lại.

**Nên giữ khác nhau** (khác vì bản chất nội dung, không phải do copy): giao diện player/reader, ❤️ (Manga/Movie) vs Playlist (Music), tỷ lệ ảnh bìa, các chế độ Timeline/Album của Media.
