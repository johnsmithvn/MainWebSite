# 🃏 ĐỀ XUẤT THIẾT KẾ LẠI CARD & TRANG MANGA

> **Ngày:** 2026-11-04 · **Nhánh:** `fix/security-path-traversal` · **Trạng thái:** đề xuất, **chưa sửa code**
> **Bản xem trực quan:** [Artifact "Thiết kế lại card và trang Manga"](https://claude.ai/artifact/6bbCVEuUNvGW8qvkajbtcE) (mở được trên điện thoại). Bản gốc nằm trong repo ở [CARD-REDESIGN-PREVIEW.html](CARD-REDESIGN-PREVIEW.html): mở thẳng bằng trình duyệt, không cần build.
> **Liên quan:** [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md). Đề xuất này đi theo **Bước 3** ở đó (gộp `ItemCard` và khung chung) và không lặp lại các lỗi U1–U11. [MUSIC-UX-REVIEW.md](MUSIC-UX-REVIEW.md) lo phần player.
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
| **P1** | Tên 2 dòng 13–14px, giữ chỗ 2 dòng, tooltip; bỏ nút trong suốt, thêm ⋯ và nhấn giữ; ảnh dự phòng; định dạng dung lượng | Nhỏ | `components/manga/MangaCard.jsx`, `styles/components/manga-card.css`, `components/movie/MovieCard.jsx`, `components/music/MusicCard.jsx`, `components/media/MediaGrid.jsx`, `components/common/UniversalCard.jsx`. Mới: `components/common/Thumb.jsx`, `components/common/CardActions.jsx` |
| **P2** | Bỏ padding chồng và khung trắng; lưới `auto-fill` theo loại; khe dọc lớn hơn | Nhỏ | `constants/uiStyles.js` (thêm `GRID`, sửa `ASPECT_RATIOS.manga`), `pages/manga/MangaHome.jsx`, `pages/movie/MovieHome.jsx`, `pages/music/MusicHome.jsx`, `pages/media/MediaHome.jsx`, `components/media/MediaGrid.jsx` |
| **P3** | Skeleton cho lưới và slider; ảnh hiện dần | Nhỏ | Mới: `components/common/CardSkeleton.jsx`. Sửa 4 trang Home và `RandomSlider.jsx`, `TopViewSlider.jsx`, `RecentSlider.jsx` |
| **P4** | Bố cục trang Manga: thanh công cụ dính, bỏ thống kê, Đọc tiếp lên đầu, tab Ngẫu nhiên/Xem nhiều, phân trang gọn | Vừa | `pages/manga/MangaHome.jsx`, `components/manga/MangaRandomSection.jsx`, `components/common/RandomSlider.jsx`, `TopViewSlider.jsx`, `RecentSlider.jsx`, `styles/components/embla.css` (bề rộng slide theo loại) |
| **P5** | Phụ đề có dữ liệu; phần đầu trang bộ truyện với "Đọc tiếp" | Vừa | `backend/utils/folder-loader.js` (thêm `imageCount, chapterCount` vào SELECT của `loadFolderFromDB`; nhánh đọc ổ đĩa có thể bỏ qua), các card, `pages/manga/MangaHome.jsx` |
| **P6** | Gộp 4 card thành `components/common/ItemCard.jsx` + adapter theo loại; một bảng màu tối | Lớn | Như Bước 3 của [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md#bước-3--gộp-khung-chung-refactor), cộng `tailwind.config.js`, `components/common/Layout.jsx`, `pages/manga/MangaFavorites.jsx` (đang tự vẽ card riêng) |

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
