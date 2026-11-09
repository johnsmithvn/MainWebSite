# 🃏 ĐỀ XUẤT THIẾT KẾ LẠI CARD & TRANG MANGA

> **Ngày:** 2026-11-04 · **Nhánh:** `fix/security-path-traversal` · **Trạng thái:** ✅ **Đã làm hết P1–P6** (xem mục [6](#6-đã-làm-p1--chữ-và-vùng-bấm-2026-11-04), [7](#7-đã-làm-p2--khoảng-trắng-và-lưới-2026-11-04), [8](#8-đã-làm-p3--trạng-thái-tải-2026-11-04), [9](#9-đã-làm-p4--bố-cục-trang-manga-2026-11-04), [10](#10-đã-làm-p5--phụ-đề-có-dữ-liệu-và-đầu-trang-bộ-truyện-2026-11-04), [11](#11-đã-làm-p6--một-card-một-khung-trang-một-bảng-màu-2026-11-05)). Các mục 1–5 bên dưới là bản đề xuất ban đầu, giữ lại để đối chiếu.
> **Bản xem trực quan:** [Artifact "Thiết kế lại card và trang Manga"](https://claude.ai/artifact/6bbCVEuUNvGW8qvkajbtcE) (mở được trên điện thoại). Bản gốc nằm trong repo ở [CARD-REDESIGN-PREVIEW.html](CARD-REDESIGN-PREVIEW.html): mở thẳng bằng trình duyệt, không cần build.
> **Liên quan:** [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md). Đề xuất này đi theo **Bước 3** ở đó (gộp `ItemCard` và khung chung) và không lặp lại các lỗi U1–U11. [MUSIC-UX-REVIEW.md](MUSIC-UX-REVIEW.md) lo phần player.
> **Cập nhật 2026-11-09:** lần đầu chạy với backend thật ở [AUDIT-2026-11-09.md](AUDIT-2026-11-09.md). Từ đợt này phát sinh 1 lỗi: R5, Movie/Music mất cách sắp xếp khi mở thư mục con, đã sửa. `useFolderBrowser` nay xử lý thêm `?focus=` (nút ← về đúng trang của thư mục vừa rời, R4). Số dòng trong các link mục 1–5 là vị trí trước khi viết lại, có thể lệch dòng.
> **Phương pháp:** đọc code card, lưới, slider, CSS và constants. Dựng lại bằng HTML với cùng padding và số cột, rồi đo trong trình duyệt (điện thoại 390px, máy tính 1280px). Chưa chạy React app thật.

---

## 1. Trả lời ngắn

**Nên nâng cấp, nhưng không cần làm lại từ đầu.** Việc cần làm là tinh chỉnh có hệ thống bốn thứ: chữ, khoảng trắng, vùng bấm và trạng thái tải. Sau đó gộp card. Ý tưởng nền của giao diện hiện tại vẫn đúng: mỗi loại một tỉ lệ ảnh, slider ở đầu trang, phân trang lưu trên URL.

Vì sao nên làm:

1. **Tên khó đọc trên điện thoại.** Card manga chỉ có 1 dòng chữ 11px, tên tiếng Nhật dài còn khoảng 7 ký tự. Movie và Music có 2 dòng chữ 12px, còn dòng thông tin chỉ 9px.
2. **Có vùng bấm vô hình.** Nút ❤ và nút xoá của Manga, Music và Media có `opacity: 0` nhưng vẫn nhận chạm. Trên điện thoại không có hover, nên người dùng không thấy nút mà vẫn chạm nhầm được.
3. **Phí bề rộng.** Ba lớp padding chồng nhau nên lưới chỉ dùng 79–85% bề rộng điện thoại. Trên máy tính 1280px, Movie chia 9 cột (ảnh 117×66px) và Music chia 10 cột (ảnh 104px).
4. **Bốn card, bốn kiểu.** Badge mỗi loại đặt một góc. Loại file hiện hai lần. Movie in dung lượng dạng byte thô. MangaCard không xử lý ảnh lỗi.
5. **Tải trang bị giật.** Spinner che cả trang, khung chờ của slider cao cố định 256px, rồi bố cục nhảy khi dữ liệu về.

Giữ nguyên:

- Tỉ lệ ảnh theo loại. Riêng manga đổi 3:4 sang 5:7; đây là thay đổi nhỏ, ưu tiên thấp.
- Lưới ảnh khít kiểu Google Photos của Media.
- Ba slider Random, Top, Recent. Ở Manga, slider vẫn chỉ hiện ở thư mục gốc.
- Trang lưu trên URL, và khi quay lại từ trình đọc thì tự nhảy tới truyện vừa đọc (`focus`).
- ❤ cho Manga và Movie, Playlist cho Music. Header, Sidebar và Breadcrumb dùng chung.

---

## 2. Hiện trạng (đo từ code)

### 2.1. Card trong lưới

| | Manga | Movie | Music | Media |
|---|---|---|---|---|
| Component | [MangaCard.jsx](../react-app/src/components/manga/MangaCard.jsx) + [manga-card.css](../react-app/src/styles/components/manga-card.css) | [MovieCard.jsx](../react-app/src/components/movie/MovieCard.jsx) | [MusicCard.jsx](../react-app/src/components/music/MusicCard.jsx) | [MediaGrid.jsx](../react-app/src/components/media/MediaGrid.jsx); thư mục viết thẳng trong [MediaHome.jsx:339](../react-app/src/pages/media/MediaHome.jsx#L339) |
| Tỉ lệ ảnh | 3:4 (CSS) | 16:9 | 1:1 | 1:1. Ảnh thư mục cao cố định 128px |
| Số cột (mặc định / sm / md / lg / xl) | 3 / 4 / 5 / 6 / 6 | 2 / 3 / 5 / 7 / 9 | 3 / 4 / 6 / 8 / 10 | 2 / 3 / 4 / 5 / 6 |
| Khe lưới | 8 / 12 / 16px | 8 / 12px | 8 / 12px | 4px (ảnh), 16px (thư mục) |
| Đệm quanh lưới, điện thoại | Layout 16 + trang 4 + khung 9 = **29px** mỗi bên | 16 + 12 + 13 = **41px** | **41px** | 16 + 16 = **32px** |
| Cắt tên | **1 dòng**, `nowrap` + `…`, 11px trên điện thoại ([manga-card.css:259-262](../react-app/src/styles/components/manga-card.css#L259)) | 2 dòng, 12px | 2 dòng, 12px | Ảnh: chỉ hiện khi hover. Thư mục: 2 dòng, 14px, căn giữa |
| Tooltip tên | Có (`title`) | Có | Không | Không |
| Dòng phụ | Không có | Loại file + **`item.size` thô** ([MovieCard.jsx:232](../react-app/src/components/movie/MovieCard.jsx#L232)), 9px | Loại file + lượt nghe, 9px | Thư mục: "N items" |
| Badge trên ảnh | Chỉ ❤ khi đã thích | ❤ (luôn hiện), loại file ở góc dưới trái | Loại file ở góc trên trái, ➕ ở góc trên phải (bài hát) | Checkbox luôn hiện, thời lượng video ở góc dưới trái |
| Nút vô hình nhưng bấm được | ❤ ([:105](../react-app/src/styles/components/manga-card.css#L105)), xoá ([:161](../react-app/src/styles/components/manga-card.css#L161)) | Xoá | Xoá ([MusicCard.jsx:149](../react-app/src/components/music/MusicCard.jsx#L149)) | ❤, xoá ([MediaGrid.jsx:145-173](../react-app/src/components/media/MediaGrid.jsx#L145)) |
| Đang tải | Spinner toàn trang ([MangaHome.jsx:357](../react-app/src/pages/manga/MangaHome.jsx#L357)) | `LoadingOverlay` | `LoadingOverlay` | Spinner |
| Ảnh lỗi | **Không xử lý**: `LazyLoadImage` không có `onError`, nên hiện biểu tượng ảnh hỏng | `video-thumb` hoặc `folder-thumb` | `music-thumb` hoặc `folder-thumb` | Ảnh hỏng rơi về **`folder-thumb.png`**, trông như thư mục ([MediaGrid.jsx:68-77](../react-app/src/components/media/MediaGrid.jsx#L68)) |
| Thư mục được làm nổi | Không | Không | Viền xanh/tím 2px, chữ xanh. Chip "N items" không bao giờ hiện vì backend không trả `itemCount` | Card kiểu khác hẳn |
| Dark mode | Card `#1f2937`, **cùng màu** khung chứa | `gray-800` + viền `gray-700` | Như Movie | `gray-800` |

### 2.2. Slider (Random / Top / Recent)

- Một card chung [UniversalCard.jsx](../react-app/src/components/common/UniversalCard.jsx), variant `compact-slider`. Tỉ lệ theo loại lấy từ `ASPECT_RATIOS` ([uiStyles.js:136](../react-app/src/constants/uiStyles.js#L136)).
- **Bề rộng slide giống nhau cho mọi loại**: 90/105/120/150/170/190px theo breakpoint ([embla.css:68-135](../react-app/src/styles/components/embla.css#L68)). Vì vậy card phim 16:9 trong slider chỉ cao khoảng 59px trên điện thoại.
- ❤ luôn hiện (khác lưới manga là ẩn). Ở Top, **mọi card có sẵn nút thùng rác** "Xoá lượt xem".
- Recent gắn chip xanh dương "about 2 hours ago" (date-fns tiếng Anh). Random hiện "5 minutes ago".
- Khung chờ là khối xám `h-64` (256px) cố định, không đúng hình card ([RandomSlider.jsx:303](../react-app/src/components/common/RandomSlider.jsx#L303), [RecentSlider.jsx:388](../react-app/src/components/common/RecentSlider.jsx#L388), [TopViewSlider.jsx:362](../react-app/src/components/common/TopViewSlider.jsx#L362)).

### 2.3. Trang Manga (thư mục gốc, điện thoại 390px)

Thứ tự từ trên xuống, đều nằm trong `Layout` (`container px-4 py-6`):

1. 3 slider xếp chồng: 📚 Random, 🔥 Top Views, 🕒 Recently. Mỗi slider có tiêu đề, nút và chấm trang riêng.
2. Khung trắng `manga-main-container` chứa thanh công cụ 2 hàng (Home + breadcrumb; per page, Filter, Grid/List). Thanh này **cuộn mất** theo trang.
3. Ô tìm kiếm "Tìm kiếm manga..." (lọc trong thư mục, khác ô tìm kiếm trên header).
4. 3 ô thống kê: Total Items, Favorites, Search Results.
5. Lưới 3 cột, rồi phân trang "⬅ Prev · 1 / 42 · Next ➡".

**Đo trên bản dựng lại:** lưới truyện bắt đầu ở **1.122px**, tức khoảng 1,3 màn hình iPhone. Trên máy tính 1280px là 1.527px. Nút "Filter" chỉ có một lựa chọn (Tên). Chữ trộn Anh và Việt.

---

## 3. Quy tắc đề xuất

### 3.1. Tỉ lệ ảnh

| Loại | Tỉ lệ | Ghi chú |
|---|---|---|
| Manga | **5:7** (đang dùng 3:4) | Gần khổ trang B6/B5. Dùng `object-position: top` để không mất tên truyện in ở đầu bìa |
| Movie | 16:9 | Giữ nguyên |
| Music | 1:1 | Giữ nguyên |
| Media | 1:1 | Giữ nguyên, không bo góc, không chữ |

### 3.2. Lưới và khoảng cách

- Lưới dùng `grid-template-columns: repeat(auto-fill, minmax(var(--card-min), 1fr))` nên tự chia cột theo bề rộng thật, kể cả khi mở sidebar.
- Bề rộng tối thiểu (`<640` / `≥640` / `≥1024`):
  - Manga và Music: 104 / 128 / 144px
  - Movie: 152 / 200 / 220px
  - Media: 104 / 132 / 150px
- Khe ngang 8 / 12 / 16px. **Khe dọc lớn hơn**: 16 / 20 / 24px, vì dưới mỗi ảnh còn 2 dòng tên. Media giữ khe khít: 2px trên điện thoại, 4px trên máy tính.
- **Chỉ một lớp đệm**, là 16px của `Layout`. Bỏ `p-1 sm:p-2` hoặc `p-3 sm:p-6` của trang và bỏ khung trắng `*-main-container`.
- Card không còn nền trắng và bóng đổ. Ảnh bo góc 8px, có viền mờ 1px. Chữ nằm thẳng trên nền trang.

Số cột (hiện tại → đề xuất), đo trên bản dựng lại:

| Loại | 390px | 768px | 1024px | 1280px | Card ở 390px | Card ở 1280px |
|---|---|---|---|---|---|---|
| Manga | 3 → 3 | 5 → 5 | 6 → 6 | 6 → 7 | 105 → 114px | 188 → 165px |
| Movie | 2 → 2 | 5 → 3 | 7 → 4 | 9 → 5 | 150 → 175px | 117 → 237px |
| Music | 3 → 3 | 6 → 5 | 8 → 6 | 10 → 7 | 97 → 114px | 104 → 165px |
| Media (ảnh) | 2 → 3 | 4 → 5 | 5 → 6 | 6 → 8 | 161 → 118px | 199 → 153px |

Slider dùng card cùng cỡ với lưới: manga và nhạc rộng 104 / 136 / 152px, phim 200 / 240 / 260px. Không dùng chung một bề rộng cho mọi loại nữa.

### 3.3. Tên và phụ đề

- **Tên:** 13px trên điện thoại, 14px từ 640px trở lên, `font-weight: 500`, `line-height: 1.3`. Tối đa **2 dòng** (`line-clamp-2`) và luôn giữ chỗ đủ 2 dòng (`min-height: 2.6em`) để các hàng thẳng nhau. Thêm `overflow-wrap: anywhere` cho tên file dài liền.
- **Tên đầy đủ:** trên máy tính dùng `title` (tooltip). Trên điện thoại, nhấn giữ mở bảng thao tác, có tên đầy đủ ở đầu.
- **Bỏ đuôi file** khỏi tên (`.mkv`, `.mp4`, `.mp3`, `.flac`, `.pdf`…), vì đuôi đã có ở phụ đề.
- **Phụ đề:** 1 dòng, 11,5px (12,5px trên máy tính), màu chữ phụ, cắt bằng `…`.

| Loại | Trường hợp | Phụ đề | Lấy từ |
|---|---|---|---|
| Manga | Thư mục bộ truyện | 📁 24 chương | `chapterCount`: **có trong bảng `folders`** ([db.js:37-38](../backend/utils/db.js#L37)), `cache-scan` đã ghi. Chỉ thiếu trong câu SELECT của [folder-loader.js:174](../backend/utils/folder-loader.js#L174) |
| Manga | Chương có ảnh | 186 trang | `imageCount` (như trên) |
| Manga | File PDF | 📄 PDF | `type: 'pdf'` |
| Manga | Slider Đọc tiếp, Ngẫu nhiên | Tên bộ cha | Phần cha của `path` |
| Movie | Video | MKV · 4,2 GB; thời lượng đặt trên ảnh | `path`, `size`, `duration` (API trả bằng `SELECT *`) |
| Movie, Music | Thư mục | 📁 Thư mục | `type`. Muốn hiện "36 video" thì backend phải đếm thêm |
| Music | Bài hát | Ca sĩ · 3:58 | `artist` (join `songs`), `duration` |
| Music | Playlist | Playlist | `isPlaylist` |
| Media | Thư mục | 134 mục | `itemCount` |

### 3.4. Badge

- **Tối đa 2 badge và một dấu ❤** trên mỗi ảnh:
  - Góc trên trái: trạng thái theo ngữ cảnh. Hạng #1–#3 ở hàng Xem nhiều, thời điểm đọc ở hàng Đọc tiếp. Lưới thường để trống góc này.
  - Góc trên phải: ❤ **chỉ khi đã thích**. Đây là dấu hiệu, không phải nút.
  - Góc dưới phải: một con số, như thời lượng video hoặc lượt xem ở Top.
- Mọi badge cùng kiểu: nền `rgb(0 0 0 / .62)`, chữ trắng 10,5px đậm, bo 6px.
- **Thư mục có mép xếp chồng** (2 lớp mỏng phía trên ảnh), dùng chung cho cả 4 loại.
- **Bỏ:** badge loại file (Folder, mp4, mp3), chip gradient "N items", viền xanh/tím của thư mục nhạc, chip xanh dương của Recent, hiệu ứng nhấc card lên (`y: -4`) và phóng to ảnh.
- ▶ chỉ hiện khi rê chuột, và chỉ với nội dung phát được (phim, nhạc).

### 3.5. Thao tác

- Bỏ mọi nút trong suốt mà vẫn bấm được.
- **Nút ⋯** nằm cạnh phụ đề, vùng chạm 32px. Trên điện thoại, nhấn giữ card (khoảng 500ms) cũng mở **bảng thao tác** từ dưới lên. Trên máy tính, chuột phải mở menu tương tự.
- Thao tác theo loại:
  - Manga: Yêu thích, Đọc từ đầu, Mở thư mục chứa, Xoá khỏi DB.
  - Movie: Yêu thích, Mở thư mục chứa, Xoá khỏi DB.
  - Music: Thêm vào playlist, Phát tiếp theo, Xoá khỏi DB.
  - Media: Yêu thích, Chọn nhiều, Xoá khỏi DB.
  - Hàng Top: thêm "Xoá lượt xem".
- "Xoá khỏi DB" luôn ở cuối, chữ đỏ, và vẫn qua `DeleteConfirmModal`.
- Media: ô chọn chỉ hiện khi rê chuột hoặc khi đang chọn nhiều. Nhấn giữ một ảnh để bắt đầu chọn.

### 3.6. Đang tải và ảnh lỗi

- **Skeleton đúng hình card** (tỉ lệ ảnh và 2 dòng tên) cho lưới và slider. Lúc đầu hiện 12 card, hoặc bằng `perPage` nếu ít hơn. Header, thanh công cụ và tiêu đề mục vẫn hiện như bình thường. Bỏ spinner toàn trang và khối `h-64`.
- Ảnh nằm trên nền xám nhạt và hiện dần trong 150ms khi `onLoad`. Giữ `loading="lazy"` và `decoding="async"`.
- Bỏ hiệu ứng blur của `LazyLoadImage` ở MangaCard, vì nó tải thêm `default-cover.jpg`.
- **Ảnh lỗi hoặc thumbnail rỗng** (`null`, `"null"`): hiện ô màu sinh từ tên, biểu tượng theo loại (sách, phim, nốt nhạc, ảnh, thư mục) và 1–2 chữ đầu của tên. Không gọi thêm file ảnh mặc định. `onerror` chỉ chạy một lần.

### 3.7. Sáng và tối

- Hiện có hai màu nền tối lệch nhau: `Layout` dùng `dark-900` (#0f172a, [Layout.jsx:90](../react-app/src/components/common/Layout.jsx#L90)), còn các trang dùng `gray-900` (#111827). Card MangaCard tối cùng màu khung chứa.
- Đề xuất dùng một bảng màu xanh đen (slate) duy nhất:

| Vai trò | Sáng | Tối |
|---|---|---|
| Nền trang | #f8fafc | #0f172a |
| Bề mặt (thanh, chip, bảng) | #ffffff | #1e293b |
| Chữ chính | #0f172a | #f1f5f9 |
| Chữ phụ | #64748b | #94a3b8 |
| Viền | #e2e8f0 | #2b3a4f |
| Nhấn | #2563eb | #60a5fa |

---

## 4. Bố cục trang Manga đề xuất

1. **Thanh công cụ dính** ngay dưới header (cao 48px trên điện thoại, 56px trên máy tính).
   - Điện thoại: Back hoặc Home, breadcrumb rút gọn ("… › Tên bộ"), nút đổi lưới/danh sách và nút ⋯ (sắp xếp, số mục mỗi trang).
   - Máy tính: thêm luôn ô "Lọc trong thư mục này…", sắp xếp và số mục/trang trên thanh.
2. **Đọc tiếp** lên đầu, lấy từ lịch sử Recent. Mỗi card có tên chương, tên bộ ở phụ đề và thời điểm đọc ở góc ảnh.
3. **Ngẫu nhiên và Xem nhiều gộp một hàng có tab**, có nút làm mới. Tắt tự chạy (autoplay), bỏ chấm trang. Card kế tiếp lộ một phần để báo còn nữa. Trên máy tính có nút ‹ ›.
4. **Bỏ 3 ô thống kê.** Số mục ghi cạnh tiêu đề: "Tất cả · 1.248 mục".
5. **Ô lọc** ghi rõ "Lọc trong thư mục này" để phân biệt với tìm kiếm chung trên header.
6. **Lưới** theo mục 3.2. **Phân trang** dùng nút 40px: điện thoại "‹ Trang 1 / 42 ›", máy tính có số trang. Giữ `page`, `size`, `focus` trên URL như bây giờ.
7. **Trong một bộ truyện** (thư mục có chương con):
   - Đầu trang có bìa, tên đầy đủ, "24 chương · 3.840 trang", nút **"Đọc tiếp · Ch. 12"** và ❤.
   - Chương đang đọc tìm được ở phía client: lấy mục Recent mới nhất có `path` bắt đầu bằng thư mục hiện tại.
   - Danh sách chương dạng hàng; chương đang đọc được tô nền và trang tự cuộn tới đó.
   - Mục `__self__` ("Đọc ngay") trở thành nút "Đọc từ đầu" trong phần đầu trang.
8. **Nhớ chế độ lưới/danh sách theo từng thư mục** trong localStorage.

**Đo trên bản dựng lại:** lưới bắt đầu ở 769px trên điện thoại (trước 1.122px) và 885px trên máy tính (trước 1.527px).

Khi gộp khung chung theo Bước 3 của UI-CONSISTENCY-REPORT, Movie và Music dùng cùng bố cục này. Khác biệt chỉ nằm ở hàng slider và thao tác.

---

## 5. Lộ trình và file cần sửa

> ⚠️ Nhiều file dưới đây (`UniversalCard.jsx`, `MovieCard.jsx`, `MusicCard.jsx`, các trang `*Home.jsx`) đang được một phiên khác sửa phần UI/music. **Nên làm sau khi phiên đó xong**, để tránh hai bên sửa đè lên nhau.

| Ưu tiên | Việc | Mức | File |
|---|---|---|---|
| **P1** ✅ | Tên 2 dòng 13–14px, giữ chỗ 2 dòng, tooltip; bỏ nút trong suốt, thêm ⋯ và nhấn giữ; ảnh dự phòng; định dạng dung lượng. **Đã làm**, xem mục 6 | Nhỏ | `components/manga/MangaCard.jsx`, `styles/components/manga-card.css`, `components/movie/MovieCard.jsx`, `components/music/MusicCard.jsx`, `components/media/MediaGrid.jsx`, `components/common/UniversalCard.jsx`. Mới: `components/common/Thumb.jsx`, `components/common/CardActions.jsx` |
| **P2** ✅ | Bỏ padding chồng và khung trắng; lưới `auto-fill` theo loại; khe dọc lớn hơn. **Đã làm**, xem mục 7 | Nhỏ | `constants/uiStyles.js` (thêm `GRID`, sửa `ASPECT_RATIOS.manga`), `pages/manga/MangaHome.jsx`, `pages/movie/MovieHome.jsx`, `pages/music/MusicHome.jsx`, `pages/media/MediaHome.jsx`, `components/media/MediaGrid.jsx` |
| **P3** ✅ | Skeleton cho lưới và slider; ảnh hiện dần. **Đã làm**, xem mục 8 | Nhỏ | Mới: `components/common/CardSkeleton.jsx`. Sửa 4 trang Home và `RandomSlider.jsx`, `TopViewSlider.jsx`, `RecentSlider.jsx` |
| **P4** ✅ | Bố cục trang Manga: thanh công cụ dính, bỏ thống kê, Đọc tiếp lên đầu, tab Ngẫu nhiên/Xem nhiều, phân trang gọn. **Đã làm**, xem mục 9 | Vừa | `pages/manga/MangaHome.jsx`, `components/manga/MangaRandomSection.jsx`, `components/common/RandomSlider.jsx`, `TopViewSlider.jsx`, `RecentSlider.jsx`, `styles/components/embla.css` (bề rộng slide theo loại) |
| **P5** ✅ | Phụ đề có dữ liệu; phần đầu trang bộ truyện với "Đọc tiếp". **Đã làm**, xem mục 10 | Vừa | `backend/utils/folder-loader.js` (thêm `imageCount, chapterCount` vào SELECT của `loadFolderFromDB`; nhánh đọc ổ đĩa có thể bỏ qua), các card, `pages/manga/MangaHome.jsx` |
| **P6** ✅ | Gộp 4 card thành `components/common/ItemCard.jsx` + adapter theo loại; một bảng màu tối. **Đã làm**, xem mục 11 | Lớn | Như Bước 3 của [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md#bước-3--gộp-khung-chung-refactor), cộng `tailwind.config.js`, `components/common/Layout.jsx`, `pages/manga/MangaFavorites.jsx` (đang tự vẽ card riêng) |

Gợi ý hằng số cho P2 (đặt trong `constants/uiStyles.js`):

```js
export const CARD_TYPES = {
  manga: { ratio: 'aspect-[5/7]', fit: 'object-cover object-top', min: [104, 128, 144], slide: [104, 136, 152] },
  movie: { ratio: 'aspect-video', fit: 'object-cover',            min: [152, 200, 220], slide: [200, 240, 260] },
  music: { ratio: 'aspect-square', fit: 'object-cover',           min: [104, 128, 144], slide: [104, 136, 152] },
  media: { ratio: 'aspect-square', fit: 'object-cover',           min: [104, 132, 150], gap: [2, 3, 4] },
};
// lưới: style={{ '--card-min': `${min[bp]}px` }} + className="grid gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:gap-x-4 lg:gap-y-6
//        [grid-template-columns:repeat(auto-fill,minmax(var(--card-min),1fr))]"
```

### Cách kiểm tra khi làm thật

- Mở mỗi trang ở 390px và 1280px. So số cột, cỡ card và vị trí bắt đầu lưới với bảng ở mục 3.2 và mục 4.
- Trên điện thoại (hoặc DevTools ở chế độ cảm ứng), chạm vào 4 góc ảnh. Không được bật ❤ hay mở hộp xoá.
- Tắt mạng hoặc đổi thumbnail thành URL sai: phải hiện ô dự phòng, không có biểu tượng ảnh hỏng, không lặp request.
- Bật chế độ tối: card và khung phải tách nhau rõ, nền trang không bị hai màu.
- Bấm vào một truyện, đọc, rồi Back: vẫn về đúng trang và tự nhảy tới truyện vừa đọc (`focus`).

---

## 6. Đã làm: P1 — chữ và vùng bấm (2026-11-04)

### Thành phần mới (dùng chung)

| File | Vai trò |
|---|---|
| [hooks/useCardActions.js](../react-app/src/hooks/useCardActions.js) | Mở bảng thao tác bằng nút ⋯, **nhấn giữ 500ms** (cảm ứng; vuốt quá 10px thì huỷ) hoặc **chuột phải**. Sau khi nhấn giữ, cú click lúc nhả tay bị chặn nên không mở item. |
| [components/common/CardActionSheet.jsx](../react-app/src/components/common/CardActionSheet.jsx) | Bảng thao tác, render bằng portal ra `body`. Điện thoại: trượt từ dưới lên. Máy tính: hộp giữa màn hình. Đầu bảng hiện **tên đầy đủ** và đường dẫn. Đóng bằng Esc hoặc chạm nền. Click "ma" (không bắt đầu trong bảng) bị bỏ qua. Kèm `CardMoreButton` (nút ⋯, vùng chạm 32px). |
| [components/common/CardThumb.jsx](../react-app/src/components/common/CardThumb.jsx) | Thử lần lượt các nguồn ảnh. Ảnh hiện dần khi tải xong. Hết nguồn hoặc thumbnail rỗng (`null`, `"null"`) thì hiện **ô dự phòng**: màu sinh từ tên, biểu tượng theo loại, 1–2 chữ đầu. Không gọi file ảnh mặc định, nên không có vòng lặp `onError`. |
| [styles/components/card-common.css](../react-app/src/styles/components/card-common.css) | Màu của ô dự phòng (sáng và tối). Class `.card-pressable` chặn menu ảnh và bôi chữ khi nhấn giữ. |
| `utils/formatters.js` → `stripExtension()` | Bỏ đuôi file khỏi tên hiển thị. |

### Thay đổi theo card

| Card | Thay đổi |
|---|---|
| **MangaCard** + `manga-card.css` | Tên 2 dòng, 13px (điện thoại) / 14px, giữ chỗ 2 dòng, có tooltip. Thêm dòng phụ (nhãn PDF) và nút ⋯ (Yêu thích, Xoá). Dùng `CardThumb` thay `LazyLoadImage`, nên ảnh lỗi không còn hiện biểu tượng ảnh hỏng. `@media (hover: none)`: ẩn hẳn ❤ chưa thích và nút xoá; ❤ đã thích vẫn hiện. |
| **MovieCard** | Tên 2 dòng, 13/14px, bỏ đuôi file. Dòng phụ hiện **dung lượng đã định dạng** (trước đây là số byte thô). Thêm ⋯ (Yêu thích, Xoá). Nút xoá ẩn trên màn hình cảm ứng. Ở dạng danh sách, nút ❤ luôn hiện trên cảm ứng. Dùng `CardThumb`. |
| **MusicCard** | Tên 2 dòng, 13/14px, có tooltip, bỏ đuôi file. Thêm ⋯ (Thêm vào playlist, Xoá). Nút xoá chuyển vào trong ảnh (không đè dòng thông tin) và ẩn trên cảm ứng. Ở dạng danh sách, nút ➕ luôn hiện trên cảm ứng. Dùng `CardThumb`. |
| **MediaGrid**, **MediaTimeline** | Nhấn giữ hoặc chuột phải mở bảng (Yêu thích, Chọn/Bỏ chọn, Xoá). ❤ luôn hiện khi đã thích; khi chưa thích, ❤ và nút xoá ẩn trên cảm ứng. Ảnh lỗi: thumbnail → ảnh gốc → ô dự phòng (không còn rơi về `folder-thumb.png`). Nút xoá chỉ hiện khi trang cha có truyền `onDeleteClick`. |
| **UniversalCard** (slider) | Có tooltip. Cỡ chữ lấy từ `TEXT_STYLES` trong `constants/uiStyles.js`: 13px, giữ chỗ 2 dòng, dòng phụ 11px. |
| MediaAlbums, thư mục ở MediaHome, MangaFavorites | Nút xoá hoặc bỏ thích chỉ hiện khi rê chuột thì nay **luôn hiện trên màn hình cảm ứng**. Nút vẫn hiện rõ, nên không còn bị chạm nhầm. |

Trên máy tính (có chuột), các nút hiện khi rê chuột **giữ nguyên** như cũ. Nút ⋯ là cách thêm, không thay thế chúng.

### Đã kiểm tra

- `vite build` qua. CSS sinh đủ các class mới, kể cả biến thể `[@media(hover:none)]`.
- Render các card thật với dữ liệu giả trên một trang thử tạm (đã xoá sau khi kiểm tra), ở 375px chế độ cảm ứng và ở máy tính, cả sáng lẫn tối:
  - Nút ⋯ mở bảng mà không mở item.
  - Chọn hành động thì chạy đúng callback và đóng bảng.
  - Nhấn giữ mở bảng. Click sau khi nhả tay không mở item. Click "ma" lên nền không đóng bảng.
  - Esc đóng bảng. Chạm thường sau đó vẫn mở item.
  - Ảnh lỗi hiện ô dự phòng. Máy tính vẫn còn các nút hiện khi rê chuột.

**Chưa kiểm tra:** chưa chạy trong app thật với backend và dữ liệu thật. Chưa thử nhấn giữ trên iPhone và Android thật; trình mô phỏng chỉ gửi touch event giả.

---

## 7. Đã làm: P2 — khoảng trắng và lưới (2026-11-04)

### Thay đổi

| File | Thay đổi |
|---|---|
| [constants/uiStyles.js](../react-app/src/constants/uiStyles.js) | Thêm **`CARD_GRIDS`** (`manga`, `movie`, `music`, `media`, `mediaFolders`): lưới `repeat(auto-fill, minmax(var(--card-min), 1fr))`, bề rộng tối thiểu theo mục 3.2. Khe ngang 8/12/16px, khe dọc 16/20/24px; riêng Media khe 2/3/4px. `ASPECT_RATIOS.manga` đổi sang `aspect-[5/7]` (card trong slider). |
| [pages/manga/MangaHome.jsx](../react-app/src/pages/manga/MangaHome.jsx) | Bỏ `p-1 sm:p-2` ở hai lớp bọc và bỏ khung trắng `manga-main-container` (nền, viền, padding). Bỏ nền `gray-900` riêng của trang, để dùng nền của Layout (hết hai màu nền tối lệch nhau). Lưới dùng `CARD_GRIDS.manga`. Slider cách phần dưới 16/24px. |
| [pages/movie/MovieHome.jsx](../react-app/src/pages/movie/MovieHome.jsx), [pages/music/MusicHome.jsx](../react-app/src/pages/music/MusicHome.jsx) | Tương tự: bỏ `p-3 sm:p-6` hai lớp và khung trắng; lưới dùng `CARD_GRIDS.movie` / `CARD_GRIDS.music`. |
| [pages/media/MediaHome.jsx](../react-app/src/pages/media/MediaHome.jsx) | Bỏ `container px-4` lồng bên trong Layout (đệm 32px → 16px) và nền riêng của trang. Lưới thư mục dùng `CARD_GRIDS.mediaFolders`. |
| [components/media/MediaGrid.jsx](../react-app/src/components/media/MediaGrid.jsx), [MediaTimeline.jsx](../react-app/src/components/media/MediaTimeline.jsx) | Lưới ảnh dùng `CARD_GRIDS.media`: 3 cột trên điện thoại (trước là 2). |
| [styles/components/manga-card.css](../react-app/src/styles/components/manga-card.css) + MangaCard | Ảnh bìa 5:7, `object-position: top`. Bỏ `max-width` 240/200px của card lưới để card lấp đầy ô. |

### Đo được (trang Home thật với store giả, khung giống Layout)

| Loại | 390px | 768px | 1024px | 1280px |
|---|---|---|---|---|
| Manga | 3 cột · card 114px | 5 · 136px | 6 · 151px | 7 · 163px |
| Movie | 2 · 175px | 3 · 235px | 4 · 234px | 5 · 235px |
| Music | 3 · 114px | 5 · 136px | 6 · 151px | 7 · 163px |
| Media (ảnh) | 3 · 118px | 5 · 145px | 6 · 162px | 8 · 153px |

- Lề lưới đúng 16px ở mọi bề rộng. Trên điện thoại 390px, lưới rộng 358px; trước là 308–332px.
- Cột 390px là số khi không có thanh cuộn, giống điện thoại. Các cột còn lại đo trong iframe có thanh cuộn 8px, giống trình duyệt máy tính.
- `vite build` qua.

### Chưa đổi (để cho các bước sau)

- Slider vẫn trong khung trắng, khối chờ cao 256px và bề rộng slide dùng chung cho mọi loại (P3, P4).
- Card vẫn có nền trắng và bóng đổ. Mép xếp chồng cho thư mục, badge mới và phụ đề có dữ liệu thuộc P5–P6.
- Lưới ở `MangaFavorites`, `MovieFavorites`, `MusicPlaylists` và `MediaAlbums` chưa dùng `CARD_GRIDS`.
- Chưa chạy trong app thật với backend và dữ liệu thật.

---

## 8. Đã làm: P3 — trạng thái tải (2026-11-04)

### Thay đổi

| File | Thay đổi |
|---|---|
| [components/common/CardSkeleton.jsx](../react-app/src/components/common/CardSkeleton.jsx) (mới) | `CardSkeleton` có đúng hình card theo loại (tỉ lệ ảnh, 2 dòng tên, 1 dòng phụ; biến thể `slider` không viền như UniversalCard). `CardGridSkeleton` dùng chính `CARD_GRIDS`, nên số cột khớp lưới thật. `CardListSkeleton` dùng cho chế độ danh sách. Có `role="status"` và chữ ẩn "Đang tải…" cho trình đọc màn hình. |
| [pages/manga/MangaHome.jsx](../react-app/src/pages/manga/MangaHome.jsx) | Bỏ spinner thay cả trang. Khi đang tải, slider, thanh công cụ, ô tìm kiếm và thống kê vẫn hiện; chỗ lưới hiện skeleton. Số card skeleton bằng `min(số mục mỗi trang, 12)`. Chế độ danh sách hiện skeleton dạng hàng. |
| [pages/movie/MovieHome.jsx](../react-app/src/pages/movie/MovieHome.jsx), [pages/music/MusicHome.jsx](../react-app/src/pages/music/MusicHome.jsx) | Bỏ `LoadingOverlay` thay cả trang; thay bằng skeleton như trên. Loading toàn cục (`useUIStore`) vẫn có overlay riêng trong Layout. |
| [pages/media/MediaHome.jsx](../react-app/src/pages/media/MediaHome.jsx) | Lưới ảnh, timeline, yêu thích và chi tiết album hiện 24 ô vuông skeleton. Danh sách album vẫn dùng spinner. |
| `RandomSlider`, `TopViewSlider`, `RecentSlider` | Bỏ khối xám cao cố định 256px; thay bằng `CardSkeleton` đúng loại (manga/movie/music). |
| [components/common/UniversalCard.jsx](../react-app/src/components/common/UniversalCard.jsx) | Ảnh dùng `CardThumb`: nền xám chờ, ảnh hiện dần; ảnh lỗi hiện ô dự phòng thay vì đổi `src` sang ảnh mặc định (không còn rủi ro lặp `onError`). Bìa manga trong slider căn lên trên. |

### Đã kiểm tra

Đo trên trang tạm (trang Home thật, store giả bật `loading`, rồi tắt `loading`):

| | 390px: skeleton / card thật | 1280px: skeleton / card thật |
|---|---|---|
| Manga (lưới) | 221 / 222px | 306 / 305px |
| Movie (lưới) | 171 / 171px | 221 / 221px |
| Music (lưới) | 185 / 185px | 251 / 251px |
| Slider manga / movie / music | 236 / 236 · 143 / 143 · 188 / 188px | — |

- Số cột của skeleton bằng số cột của lưới thật. Vị trí lưới giữ nguyên khi dữ liệu về, nên bố cục không nhảy.
- Thanh công cụ hiện trong lúc tải. Chế độ tối hiển thị đúng.
- `vite build` qua.

**Chưa kiểm tra:** chưa chạy trong app thật với backend; ảnh thật trong slider chưa được tải thử (trang tạm không có backend).

---

## 9. Đã làm: P4 — bố cục trang Manga (2026-11-04)

### Thay đổi

| File | Thay đổi |
|---|---|
| [pages/manga/MangaHome.jsx](../react-app/src/pages/manga/MangaHome.jsx) | **Thanh công cụ dính** dưới header (`sticky top-16`, cao 48px / 56px, nền mờ). Gồm: nút Về thư mục cha hoặc Về trang chủ, breadcrumb (cuộn ngang được và tự cuộn tới thư mục hiện tại), nút Lưới/Danh sách. Điện thoại có thêm nút ⋯ mở bảng "Số mục mỗi trang". Máy tính đặt luôn ô "Lọc trong thư mục này…" và "N mục/trang" trên thanh. **Bỏ 3 ô thống kê** và nút Filter (chỉ có một kiểu sắp xếp). Thay bằng tiêu đề "Tất cả · N mục", có thêm "Trang x/y" bên phải. Trên điện thoại, ô lọc nằm dưới tiêu đề. **Phân trang** dùng `PageNav` cho cả lưới lẫn danh sách (trước đây chế độ danh sách không có phân trang). Đổi trang thì cuộn tới tiêu đề mục, tránh bị thanh dính che. **Nhớ lưới/danh sách theo từng thư mục** (`manga.viewModeByPath`, tối đa 300 thư mục; thư mục mới dùng lựa chọn gần nhất). Hàng ở chế độ danh sách dùng `CardThumb` 5:7, tên 2 dòng. Chữ trên trang chuyển hết sang tiếng Việt. |
| [components/common/PageNav.jsx](../react-app/src/components/common/PageNav.jsx) (mới) | Phân trang nút 40px. Điện thoại: "‹ Trang 3 / 42 ›", bấm vào chữ để mở hộp chuyển trang. Máy tính: các số trang quanh trang hiện tại, "…" mở hộp chuyển trang. |
| [components/manga/MangaRandomSection.jsx](../react-app/src/components/manga/MangaRandomSection.jsx) | **"Đọc tiếp" lên đầu.** **Ngẫu nhiên và Xem nhiều gộp một hàng có tab**, tab được nhớ (`manga.discoverTab`). Tắt tự chạy và chấm trang. |
| `RandomSlider`, `TopViewSlider`, `RecentSlider` | Prop mới: `showDots` (mặc định bật, nên Movie/Music không đổi) và `headerLeft` (đặt tab vào chỗ tiêu đề). Khi slider lỗi hoặc rỗng mà có tab thì vẫn giữ tab, để chuyển lại được. Dòng phụ của card là **tên thư mục cha** (tên bộ). Thời gian viết bằng tiếng Việt ("2 giờ trước"). Badge thời gian ở Recent chuyển sang màu trung tính. Root của slider có thêm class `embla--<loại>`. |
| [components/common/UniversalCard.jsx](../react-app/src/components/common/UniversalCard.jsx) | Prop mới `subtitle`, thay cho nhãn loại ("Folder"). |
| [utils/formatters.js](../react-app/src/utils/formatters.js) | Thêm `parentFolderName()` và `formatRelativeVi()`. Các slider không còn import `date-fns`, nên bundle bớt khoảng 300 module. |
| [styles/components/embla.css](../react-app/src/styles/components/embla.css) | **Bề rộng slide theo loại**: manga/nhạc 104/136/152px, phim 200/240/260px. **Sửa lỗi sticky:** `body`, `#root`, `main`, `.container` đổi `overflow-x: hidden` sang `clip` (trình duyệt cũ vẫn dùng `hidden`), vì `hidden` biến chúng thành vùng cuộn riêng làm `sticky` không chạy. Thêm `main { min-width: 0 }`, vì với `clip`, flex item không còn tự co và nội dung dài sẽ đẩy trang rộng ra. |

### Đã kiểm tra

Trên trang tạm có **Layout thật** (header, sidebar), store giả, 70 mục, lịch sử đọc giả. Kiểm tra ở 390px và 1280px, cả sáng lẫn tối:

- Thanh công cụ dính đúng `top: 64px` khi cuộn, cả điện thoại lẫn máy tính. Trang rộng đúng 390px. Breadcrumb dài tự cuộn tới thư mục cuối.
- Không còn ô thống kê, không còn chấm trang. Slide manga rộng 104px trên điện thoại.
- "Đọc tiếp" hiện tên bộ ở dòng phụ và "2 giờ trước", "1 ngày trước" ở góc ảnh.
- Tab Ngẫu nhiên / Xem nhiều chuyển được, được nhớ, và vẫn còn khi slider lỗi.
- Bấm "Trang sau" chuyển sang trang 2 và cuộn tiêu đề về 128px (ngay dưới thanh dính).
- Bảng ⋯ đổi số mục mỗi trang (24 → "Trang 1 / 3"), có lưu lại.
- Chế độ danh sách có phân trang. Lựa chọn lưới/danh sách được lưu theo thư mục.
- `vite build` qua.

**Chưa kiểm tra:** chưa chạy trong app thật với backend và dữ liệu thật.

**Lưu ý:** việc sửa `overflow-x` áp dụng cho toàn app. `MediaToolbar` (đang là `sticky top-0`) giờ dính thật, nên sẽ trượt xuống dưới header khi cuộn. Muốn nó hiện dưới header thì đổi thành `top-16` (chưa làm).

### Chưa làm (thuộc P5)

Phần đầu trang bộ truyện (bìa, số chương, nút "Đọc tiếp · Ch. 12"), phụ đề số chương/số trang, mục `__self__` thành nút "Đọc từ đầu". → Đã làm ở mục 10.

---

## 10. Đã làm: P5 — phụ đề có dữ liệu và đầu trang bộ truyện (2026-11-04)

### Thay đổi

| File | Thay đổi |
|---|---|
| [backend/utils/folder-loader.js](../backend/utils/folder-loader.js) | `loadFolderFromDB` trả thêm **`imageCount`, `chapterCount`** (đã có sẵn trong bảng `folders`, do `cache-scan` đếm lúc quét). `loadFolderFromDisk` lấy hai số này từ DB bằng **một** truy vấn (`loadFolderCountsFromDB`), không đọc thêm ổ đĩa; thư mục chưa quét thì không có số. |
| [components/manga/MangaCard.jsx](../react-app/src/components/manga/MangaCard.jsx) | Dòng phụ: "📁 24 chương" (có thư mục con), "186 trang" (chỉ có ảnh), "PDF". Không có dữ liệu thì để trống. Prop mới `statusLabel`: nhãn "Đang đọc" ở góc ảnh và viền xanh quanh card. |
| [components/movie/MovieCard.jsx](../react-app/src/components/movie/MovieCard.jsx) | **Thời lượng** (`duration`) ở góc dưới phải ảnh. Dòng phụ "MKV · 4.2 GB". Nút xoá khi rê chuột chuyển lên góc trên trái. "Folder" → "Thư mục". |
| [components/music/MusicCard.jsx](../react-app/src/components/music/MusicCard.jsx) | Dòng phụ bài hát: **"Ca sĩ · 4:12"** (`artist` từ bảng `songs`, `duration`). Không có ca sĩ thì hiện định dạng file. "Folder" → "Thư mục". |
| [pages/manga/MangaHome.jsx](../react-app/src/pages/manga/MangaHome.jsx) | **Đầu trang bộ truyện** khi ở trong một thư mục: bìa 5:7, tên đầy đủ (tối đa 3 dòng), "8 chương · 2 PDF · 5 ảnh · Đọc gần nhất 2 giờ trước".<br>Nút chính, chọn theo thứ tự: **"Đọc tiếp · <chương>"** (mục đọc gần nhất có đường dẫn nằm trong thư mục này, lấy từ lịch sử Recent), nếu không có thì "Đọc từ đầu" (mục đầu tiên), nếu không có thì "Đọc ngay".<br>Nút "Xem N ảnh" khi thư mục vừa có ảnh vừa có thư mục con; mục `__self__` không còn hiện thành card "Đọc ngay" trong lưới. Nút ❤ cho chính thư mục này.<br>Card hoặc hàng chứa vị trí đang đọc được đánh dấu "Đang đọc". Chế độ danh sách cũng hiện số chương/trang. Tiêu đề mục đổi thành "Danh sách · N mục" khi ở trong thư mục. |
| [hooks/useRecentManager.js](../react-app/src/hooks/useRecentManager.js) | Thêm `getRecentItems()` (đọc lịch sử, mới nhất trước). |

### Đã kiểm tra

- **Backend:** chạy `loadFolderFromDB` và `loadFolderFromDisk` với DB SQLite trong bộ nhớ và thư mục thử.
  - Số đếm trả đúng.
  - Tên có `%`/`_` vẫn lọc đúng.
  - Ở chế độ ổ đĩa, thư mục chưa có trong DB không có số.
- **Frontend:** trang tạm có Layout thật và store giả, ở 390px.
  - Đầu trang hiện "8 chương · 5 ảnh · Đọc gần nhất 2 giờ trước" và "Đọc tiếp · Chương 3 – Người thợ rèn mù". Mục đọc của bộ khác bị bỏ qua đúng.
  - Bấm nút thì mở `/manga/reader?path=…/Chương 3…`.
  - Card "Đọc ngay" không còn trong lưới; chương 3 có nhãn "Đang đọc".
  - Thư mục gốc hiện "24 chương", "186 trang", "PDF"; thư mục chưa quét để trống.
  - Phim hiện "1:52:10" ở góc ảnh và "MKV · 4.2 GB". Nhạc hiện "Ngọt Ngào Band · 4:12".
- `vite build` qua.

**Khi triển khai:**
- Khởi động lại backend để API trả hai trường mới.
- Danh sách thư mục manga được cache ở trình duyệt 15 phút (`mangaCache`), nên số chương/trang hiện sau khi cache hết hạn, hoặc sau khi xoá cache trong cài đặt.
- Số đếm chỉ có cho thư mục đã được quét bằng cache-scan.

**Chưa kiểm tra:** chạy với backend và DB thật.

---

## 11. Đã làm: P6 — một card, một khung trang, một bảng màu (2026-11-05)

### P6b — một bảng màu tối

- [tailwind.config.js](../react-app/tailwind.config.js): `gray` → **`colors.slate`**. Mọi `gray-*` trong app thành slate, trùng với `dark-*` mà Layout đang dùng, nên hết tình trạng nền tối hai màu (#0f172a và #111827).
- Mã màu xám viết cứng trong CSS (`styles.css`, `embla.css`, `random-slider.css`, `download-manager.css`…) được đổi sang mã slate tương ứng.
- Đo trong chế độ tối: nền Layout và nền thanh công cụ đều #0f172a, ô ảnh chờ #1e293b, chữ #f1f5f9.

### P6a + P6c — card dùng chung

| File | Vai trò |
|---|---|
| [config/contentTypes.js](../react-app/src/config/contentTypes.js) (mới) | Khai báo theo loại: tỉ lệ ảnh, căn ảnh, lưới, số mục mỗi trang mặc định, chữ gợi ý ô lọc, thư mục lên đầu. |
| [components/common/ItemCard.jsx](../react-app/src/components/common/ItemCard.jsx) (mới) | **Một card cho mọi loại**, 3 dạng: `grid`, `slider`, `list`. Theo đúng quy tắc mục 3: không nền trắng hay bóng; ảnh bo 8px, viền mờ, rê chuột thì viền xanh; **mép xếp chồng** cho thư mục/tập hợp; tối đa 2 badge (trên trái: trạng thái/hạng/thời gian; dưới phải: thời lượng/lượt xem); **❤ chỉ là dấu**; ▶ khi rê chuột với nội dung phát được; tên 2 dòng giữ chỗ; mọi thao tác nằm trong ⋯ / nhấn giữ / chuột phải. Bỏ hiệu ứng nhấc card và phóng ảnh. Mở được bằng bàn phím (Enter/Space). |
| `MangaCard`, `MovieCard`, `MusicCard`, `UniversalCard` | Thành **lớp bọc mỏng** của ItemCard: chỉ giữ cách mở item, dòng phụ và thao tác riêng của loại. Đã bỏ các nút luôn hiện trên ảnh: ❤ của Movie và slider, ➕ của Music, thùng rác của hàng Xem nhiều. Chúng chuyển vào bảng ⋯; hàng Xem nhiều có "Xoá lượt xem". |
| `RecentSlider`, `TopViewSlider` | Thời gian đọc và hạng #1–#3 (vàng/bạc/đồng) đi qua `badgeTopLeft` của card, không còn tự vẽ lớp phủ. |
| [components/common/CardSkeleton.jsx](../react-app/src/components/common/CardSkeleton.jsx) | Cùng cấu trúc với ItemCard. Chiều cao skeleton bằng card thật: 226/226, 166/166, 181/181px. |
| `styles/components/index.css` | Bỏ import `manga-card.css`, `movie-card.css`, `music-card.css` vì không còn dùng. **Ba file này vẫn còn, có thể xoá hẳn.** Lệnh xoá đã bị chặn trong phiên này nên chưa xoá. |

### P6c — khung trang dùng chung

| File | Vai trò |
|---|---|
| [hooks/useFolderBrowser.js](../react-app/src/hooks/useFolderBrowser.js) (mới) | Lưu **trang, số mục mỗi trang, sắp xếp trên URL** (`?page=&size=&sort=`), nhờ đó sửa luôn U10: Movie/Music về đúng trang sau khi quay lại. Lọc không phân biệt hoa thường và **dấu tiếng Việt** (cả Manga, trước đây Manga phân biệt dấu). Sắp xếp tự nhiên 1, 2, 10. Thư mục lên đầu với Movie/Music. Nhớ lưới/danh sách theo từng thư mục. Đổi từ khoá thì về trang 1. |
| [components/common/BrowseLayout.jsx](../react-app/src/components/common/BrowseLayout.jsx) (mới) | Thanh công cụ dính, breadcrumb, lọc, sắp xếp, số mục/trang, lưới/danh sách, bảng ⋯ trên điện thoại, tiêu đề "Tất cả · N mục", lưới, danh sách, skeleton, trống, **lỗi kèm nút "Thử lại"**, `PageNav`, hộp chuyển trang. |
| [pages/manga/MangaHome.jsx](../react-app/src/pages/manga/MangaHome.jsx) | Viết lại bằng BrowseLayout. Giữ: chọn thư mục gốc, tự mở trình đọc khi API trả `reader`, `?focus=`, xoá, yêu thích. Lỗi tải không còn thay cả trang. Đầu trang bộ truyện tách ra [MangaSeriesHeader.jsx](../react-app/src/components/manga/MangaSeriesHeader.jsx). |
| [pages/movie/MovieHome.jsx](../react-app/src/pages/movie/MovieHome.jsx), [pages/music/MusicHome.jsx](../react-app/src/pages/music/MusicHome.jsx) | Viết lại bằng BrowseLayout, nên **có cùng bố cục với Manga**: bỏ 4 ô thống kê và nút Filter; sắp xếp chọn trong thanh công cụ (Movie: Tên, Xem nhiều, Loại file; Music: Tên, Ca sĩ, Album, Nghe nhiều). |

### Các trang khác

- **Media:**
  - Ô chọn chỉ hiện khi rê chuột, khi ảnh đã được chọn, hoặc khi đang chọn nhiều.
  - Trong chế độ chọn nhiều, chạm ảnh là chọn/bỏ chọn thay vì mở. Trên cảm ứng: nhấn giữ một ảnh → "Chọn" để bắt đầu.
  - Thư mục ([MediaHome.jsx](../react-app/src/pages/media/MediaHome.jsx)) và album ([MediaAlbums.jsx](../react-app/src/components/media/MediaAlbums.jsx)) dùng ItemCard: ảnh vuông, "134 mục", xoá trong ⋯.
  - [MediaToolbar](../react-app/src/components/media/MediaToolbar.jsx) dính ở `top-16`, ngay dưới header.
- **Yêu thích, Playlist:**
  - MangaFavorites và MovieFavorites dùng MangaCard/MovieCard và `CARD_GRIDS`. Ngày đọc hoặc ngày thêm hiện ở dòng phụ (Manga) hoặc badge (Movie).
  - MusicPlaylists dùng ItemCard + lưới của nhạc.

### Đã kiểm tra

Trên trang tạm có Layout thật và store giả (đã xoá sau khi kiểm tra):

- **Manga 390px:** 3 cột, card 114px, nền card trong suốt, 7 bộ truyện có mép xếp chồng, dấu ❤ đúng, dòng phụ "12 chương"/"35 trang", thanh công cụ dính ở 64px. Không có lỗi console.
- **Movie 1280px:** 5 cột, thư mục lên đầu, thời lượng ở góc ảnh, "MKV · 1.86 GB". Sắp xếp "Xem nhiều" vẫn giữ thư mục lên đầu, rồi phim xem nhiều nhất.
- **Music:**
  - Dòng phụ "Ngọt Ngào Band · 3:21"; bài không có ca sĩ hiện thời lượng.
  - Thư mục chỉ có thao tác "Xoá" (không có "Thêm vào playlist").
- **Media:**
  - Ô chọn ẩn lúc đầu.
  - Chuột phải → "Chọn" vào chế độ chọn nhiều; ô chọn của các ảnh khác chuyển sang hiện.
  - Chạm ảnh khác thì chọn thêm (2 ảnh) chứ không mở ảnh.
  - Album hiện "134 mục" / "64 mục".
- **Chế độ tối:** chỉ còn một tông màu slate.
- **Build:** `vite build` qua.

### Chưa kiểm tra / cần biết

- Chưa chạy trong app thật với backend và dữ liệu thật. Trình phát, trình đọc và luồng xoá chỉ được giữ nguyên logic, chưa thử đầu cuối.
- **Hành vi đổi so với trước:**
  - Movie/Music giờ lưu trang trên URL.
  - Thư mục luôn lên đầu ở Movie.
  - Tìm kiếm Manga bỏ dấu.
  - Lỗi tải Manga hiện banner thay vì thay cả trang.
  - Thư mục nhạc trong slider vẫn **phát cả thư mục** như cũ; trong lưới thì vẫn **mở thư mục**.
- Ba file `manga-card.css`, `movie-card.css`, `music-card.css` không còn được import; có thể xoá.
