# 🎵 ĐÁNH GIÁ UI/UX MUSIC PLAYER — v1 (Spotify) & v2 (Zing)

> **Ngày:** 2026-11-04 · **Commit nền:** `a511bcd` + các sửa đổi chưa commit trong [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md)
> **Phạm vi:** `MusicHome`, `MusicPlayer` (v1), `MusicPlayerV2` (v2), `PlayerHeader`, `PlayerFooter`, `PlaylistSidebar`, `FullPlayerModal`, `LyricsModal`, `PlaylistModal`, `MusicPlaylists`.
> **Cách kiểm tra:**
> 1. Đọc toàn bộ code các file trên.
> 2. Chạy thật React app (Vite) với một **backend giả** trả về 11 bài nhạc mẫu (có tên tiếng Việt, tên rất dài, album rác kiểu `mp3.zing.vn`, 2 bài nằm ở thư mục gốc, 2 playlist). Thử ở 3 khổ: desktop 1366×800, tablet 900×800, mobile 375×812 (giả lập Android).
>
> Ký hiệu: **▶ Đã chạy xác nhận** · **📖 Theo code** (chưa tái hiện được, hoặc cần thiết bị thật). Mức độ: 🔴 nghiêm trọng · 🟠 cao · 🟡 trung bình · 🟢 thấp.
>
> **Giới hạn:** không có điện thoại thật (iOS/Android). Khi test, pane trình duyệt bị ẩn nên animation bị treo, vì vậy mọi thứ phụ thuộc hiệu ứng đều chỉ đánh giá theo code. Kéo-thả trên cảm ứng, autoplay và lock-screen cần thử lại trên máy thật.

---

## 1. Kết luận nhanh

| Hạng mục | Đánh giá | Ghi chú ngắn |
|---|---|---|
| **v1 – Desktop** | 🙂 Khá (7/10) | Đẹp, đủ tính năng, giống Spotify. Lỗi nằm ở logic phát nhạc và một số chi tiết |
| **v1 – Mobile** | 😐 Trung bình (5/10) | Dùng được, nhưng cuộn lồng nhau, nút nhỏ, nhiều thao tác "ẩn", sidebar playlist không có nút đóng |
| **v2 – Zing** | 😟 Yếu (4/10) | **Không phát được bài ở thư mục gốc**, **làm hỏng thứ tự playlist khi đang Shuffle**, cột tên bài gần như không đọc được, thiếu ~6 tính năng so với v1 |
| **Logic phát nhạc** (cả 2) | 😟 Yếu | Rời trang là tắt nhạc, hết danh sách vẫn hiện "đang phát", Shuffle không khớp sau khi tải lại |
| **Kéo-thả** | 🙂 Desktop ổn / 😟 Mobile | Desktop có vạch báo vị trí và lưu lên server; mobile hầu như không dùng được, không có tay nắm kéo |
| **Thanh tua (seek) / âm lượng** | 😟 Yếu | Chỉ bấm được, không kéo được; cao 4px nên khó bấm trên điện thoại |
| **Trạng thái tải (skeleton)** | ❌ Chưa có | Trong lúc tải lại hiện chữ "chưa có danh sách phát", dễ hiểu nhầm |

> **Sau lượt sửa P0 (2026-11-04):** 2 lỗi 🔴 của v2, lỗi "hết danh sách vẫn hiện đang phát", lỗi Shuffle sau khi tải lại, thông báo trong player, ô tìm playlist và nút đóng sidebar mobile đã được sửa (mục 3, mục 6).
>
> **Sau lượt P1 (2026-11-04):** nhạc không còn tắt khi rời trang (trình phát toàn cục + mini-player), có Media Session, thanh tua/âm lượng kéo được, footer mobile hiện tên bài, danh sách một thanh cuộn trên mobile, có skeleton và trạng thái lỗi. Bảng điểm trên là lúc **trước khi sửa**; còn lại nhóm P2 (kéo-thả cảm ứng, gộp v1/v2, icon/ngôn từ, theme).

**Tóm lại:** v1 trên desktop là phần tốt nhất. v2 nên **gộp vào v1 dưới dạng theme** hoặc bỏ hẳn (mục 6). Việc lớn nhất cần làm là đưa `<audio>` ra cấp App để **nhạc không tắt khi chuyển trang** và có mini-player.

---

## 2. So sánh v1 và v2

| Tính năng | v1 (Spotify) | v2 (Zing) |
|---|:-:|:-:|
| Phát bài ở thư mục gốc | ✅ | ❌ (M1) |
| Full player (vuốt đổi bài, xem to) | ✅ | ❌ — bấm vào thông tin bài ở chân trang không có tác dụng |
| Xem / sửa lời bài hát | ✅ | ❌ |
| Tải xuống (hàng chờ) | ✅ | ❌ |
| Chọn nhiều bài → thêm/xoá playlist | ✅ | ❌ |
| Thêm bài đang phát vào playlist | ✅ | ❌ (có import `FiHeart` nhưng không dùng) |
| Xoá bài khỏi playlist | ✅ | ❌ |
| Hiện metadata (Title/Album/Artist/Genre, bấm để copy) | ✅ | ❌ |
| Ẩn album rác (`mp3.zing`, `Unknown Album`) | ✅ ở phần đầu trang (danh sách vẫn hiện) | ❌ hiện cả trong tiêu đề lớn |
| Sắp xếp danh sách theo tên | ✅ | ❌ — giữ thứ tự server, khác với MusicHome |
| Kéo-thả khi Shuffle | Không lưu (đúng) | **Lưu thứ tự xáo trộn vào playlist** (M2) |
| Nút "…" | — | Không làm gì |
| Nút "Phát tất cả" | — | Thực ra chỉ là Play/Pause, không phát lại từ bài 1 |
| Mobile | Bắt buộc dùng v1 ([App.jsx:44](../react-app/src/App.jsx#L44)) | Không dùng được |

v2 hiện chỉ là "giao diện khác". Tiêu đề file ghi *"logic same as MusicPlayer"*, nhưng thực tế logic đã lệch (M1, M2), vì v2 là bản copy của v1 rồi được sửa riêng.

---

## 3. Lỗi chức năng

> **Cập nhật 2026-11-04 (lượt sửa P0):** ✅ = đã sửa **và đã chạy lại với backend giả để xác nhận** (desktop 1366px và mobile 375px). Số dòng trong bảng là vị trí *trước khi sửa*. M3 và M14 sửa ở lượt P1; ◐ M11 sửa một phần (khi trình duyệt chặn tự phát thì dừng hẳn và báo "bấm ▶ để nghe", thay vì báo lỗi và để nút lệch — vẫn cần thử trên Chrome/Safari thật). Còn lại M12. Chi tiết ở mục 6.

| Mã | Mức | Vấn đề | Bằng chứng | Vị trí |
|---|---|---|---|---|
| **M1** ✅ | 🔴 | **v2 không phát được bài nằm ở thư mục gốc**: `!folderToLoad` coi chuỗi rỗng `''` (thư mục gốc) là "không có thư mục" → hiện toast "Không thể xác định thư mục chứa bài hát". Mở thư mục gốc từ slider cũng bị chặn ở dòng 296. v1 đã xử lý đúng chỗ này | ▶ v2 lỗi, v1 cùng bài phát bình thường | [MusicPlayerV2.jsx:296](../react-app/src/pages/music/MusicPlayerV2.jsx#L296), [:301](../react-app/src/pages/music/MusicPlayerV2.jsx#L301) |
| **M2** ✅ | 🔴 | **v2 ghi đè thứ tự playlist bằng thứ tự đang xáo trộn**: bật Shuffle rồi kéo-thả (kể cả thả lại đúng chỗ cũ) → gửi `PATCH /playlist/order` với danh sách đang xáo → thứ tự gốc của playlist **mất vĩnh viễn**. v1 có kiểm tra `shuffle`, v2 thì không | ▶ server đổi từ `Rainy, Lạc Trôi, Nơi Này, Root A` thành thứ tự xáo trộn | [MusicPlayerV2.jsx:271](../react-app/src/pages/music/MusicPlayerV2.jsx#L271) |
| **M3** ✅ | 🟠 | **Rời trang player là tắt nhạc**: thẻ `<audio>` nằm trong trang player, không có mini-player. Nút 🎵/🏠 trên header đều về `/music` gốc nên người dùng còn mất luôn thư mục đang xem | ▶ sau khi bấm 🎵: 0 thẻ audio, nhạc dừng | [MusicPlayer.jsx:1370](../react-app/src/pages/music/MusicPlayer.jsx#L1370), [PlayerHeader.jsx:173](../react-app/src/components/music/PlayerHeader.jsx#L173), [:294](../react-app/src/components/music/PlayerHeader.jsx#L294) |
| **M4** ✅ | 🟠 | **Hết danh sách vẫn hiện "đang phát"**: khi không bật Repeat, `nextTrack` trả về đúng bài hiện tại nên audio dừng mà `isPlaying` vẫn `true` → nút hiện ⏸, sóng nhạc trong full player vẫn chạy, phải bấm 2 lần mới phát lại được. Cùng nguyên nhân: playlist 1 bài + Repeat All sẽ **không lặp lại** (📖) | ▶ `audio.ended = true` nhưng nút chân trang vẫn là Pause | [store/index.js:969-987](../react-app/src/store/index.js#L969) |
| **M5** ✅ | 🟡 | **Shuffle không khớp sau khi tải lại**: `shuffle` được lưu vào localStorage còn danh sách thì không → sau reload nút Shuffle vẫn xanh nhưng danh sách theo thứ tự gốc; bấm tắt cũng không có tác dụng gì | ▶ | [store/index.js:1076](../react-app/src/store/index.js#L1076) |
| **M6** ✅ | 🟡 | **Toast `react-hot-toast` không hiện trong player**: `<Toaster>` chỉ được gắn trong `Layout`, còn player chạy ngoài Layout → "Đã lưu lời bài hát", "Đã copy!" không bao giờ hiện. MangaReader cũng bị y hệt | ▶ lưu lyrics thành công, DOM không có toast | [Layout.jsx:134](../react-app/src/components/common/Layout.jsx#L134), [LyricsModal.jsx:97](../react-app/src/components/music/LyricsModal.jsx#L97), [FullPlayerModal.jsx:192](../react-app/src/components/music/FullPlayerModal.jsx#L192) |
| **M7** ✅ | 🟡 | Full player: kéo ảnh bìa bằng chuột để đổi bài thì **lyrics cũng bật lên**, vì vẫn phát sinh sự kiện click sau khi kéo. Trên màn cảm ứng *cần kiểm tra* | ▶ (chuột) | [FullPlayerModal.jsx:290-303](../react-app/src/components/music/FullPlayerModal.jsx#L290) |
| **M8** ✅ | 🟡 | Ô "Tìm playlist" (sidebar v1 và panel v2) **không có tác dụng**: không gắn state, không lọc | ▶ gõ "Chạy" vẫn hiện đủ 2 playlist | [PlaylistSidebar.jsx:28](../react-app/src/components/music/PlaylistSidebar.jsx#L28), [MusicPlayerV2.jsx:734](../react-app/src/pages/music/MusicPlayerV2.jsx#L734) |
| **M9** ✅ | 🟡 | Sidebar playlist trên mobile **không có nút đóng**: nút nổi (z-50) bị chính panel (cũng z-50) che mất, phải chạm vào nền tối mới đóng được. Phần dưới panel bị chân trang (cao 100px) che | ▶ | [PlaylistSidebar.jsx:76](../react-app/src/components/music/PlaylistSidebar.jsx#L76) |
| **M10** ✅ | 🟡 | Sửa lời bài hát xong, mở lại từ ảnh bìa ở trang v1 vẫn thấy **lời cũ**: prop `{...currentTrack, ...trackMetadata}` để metadata cũ đè lên bản vừa lưu | 📖 | [MusicPlayer.jsx:1357](../react-app/src/pages/music/MusicPlayer.jsx#L1357) |
| **M11** ◐ | 🟡 | Mở player là tự phát (cả khi tải lại trang). Trình duyệt thật chặn autoplay khi chưa có thao tác người dùng → hiện toast lỗi và `isPlaying` lệch với thực tế | 📖 cần kiểm tra trên Chrome/Safari thật | [MusicPlayer.jsx:838-868](../react-app/src/pages/music/MusicPlayer.jsx#L838) |
| **M12** | 🟢 | Trang `/music/playlists` → "Tạo playlist" mở modal "Thêm vào playlist" với bài hát rỗng (`path: ''`), nên bấm vào một playlist có sẵn sẽ thêm một đường dẫn rỗng. Playlist mới tạo cũng không hiện trên trang cho tới khi tải lại | 📖 | [MusicPlaylists.jsx](../react-app/src/pages/music/MusicPlaylists.jsx) |
| **M13** ✅ | 🟡 | `PlaylistModal` được gắn **2 lần** (trong `App.jsx` và trong `Layout`) → trên MusicHome bấm ➕ mở 2 modal chồng nhau, cả 2 cùng tải danh sách playlist | 📖, sau khi sửa ▶ chỉ còn 1 modal | [Layout.jsx:161](../react-app/src/components/common/Layout.jsx#L161) (trước khi sửa) |
| **M14** ✅ | 🟡 | Store không lắng nghe sự kiện `pause`/`play` của thẻ audio → tạm dừng từ bên ngoài (nút media của hệ điều hành, tai nghe Bluetooth, điều khiển media mặc định của trình duyệt) làm nút vẫn hiện ⏸ | ▶ giả lập bằng `audio.pause()` | [MusicPlayer.jsx](../react-app/src/pages/music/MusicPlayer.jsx), phần audio events — gộp vào P1 (trình phát toàn cục + Media Session) |

**Đã sửa trong lượt đánh giá:** `PlaylistModal`, `MusicPlaylists` và `PlaylistDetail` gọi `showToast({ type, message })` bằng object (10 chỗ). Sau khi `<Toast />` được gắn toàn app ở lượt trước, việc thêm bài vào playlist sẽ đưa object vào JSX và làm **trắng toàn bộ app** (React không render được object, và app không có ErrorBoundary). `showToast` giờ nhận cả chuỗi lẫn object ([store/index.js](../react-app/src/store/index.js), phần `useUIStore`).

---

## 4. UX theo từng phần

### 4.1. Kéo-thả sắp xếp bài

**Tốt:** trên desktop có vạch xanh báo vị trí thả (trên/dưới), playlist được lưu lên server kèm toast "Đã lưu thứ tự playlist" (▶).

**Chưa tốt:**
- Dùng HTML5 Drag & Drop (`draggable`, `onDragStart`…). API này **không ổn định trên cảm ứng**: iOS và Android chỉ hỗ trợ một phần, nên trên điện thoại gần như không kéo được (📖, cần thử máy thật).
- **Không có tay nắm kéo** (⋮⋮): cả hàng đều kéo được → dễ kéo nhầm khi chỉ muốn bấm hoặc bôi đen chữ, và không ai biết là kéo được.
- Ở chế độ **thư mục**, kéo xong đổi thứ tự nhưng **không lưu và không báo** gì; tải lại là mất.
- Thả lại đúng chỗ cũ vẫn gọi API và hiện "Đã lưu".
- Không có cách thay thế kéo-thả (nút ↑/↓ hay phím tắt).

### 4.2. Thanh tua (seek) và âm lượng

- **Chỉ bấm được, không kéo được**: dùng `onClick` lấy `clientX`, không có `pointerdown/move` → không tua liên tục, trên điện thoại không kéo theo ngón tay.
- Cao **4px** ở chân trang và 6px ở full player (▶ đo được 4px). Khuyến nghị vùng chạm ≥ 44px → rất khó bấm trên điện thoại.
- Núm tròn ở full player chỉ hiện khi hover (`opacity-0 hover:opacity-100`) → trên cảm ứng không bao giờ thấy.
- Không có `role="slider"`, `aria-valuenow`, không điều khiển được bằng bàn phím.
- Âm lượng: trên iOS `audio.volume` là chỉ-đọc → thanh âm lượng trong full player **vô dụng trên iPhone** (📖).
- Vị trí: [PlayerFooter.jsx:216](../react-app/src/components/music/PlayerFooter.jsx#L216), [:230](../react-app/src/components/music/PlayerFooter.jsx#L230), [FullPlayerModal.jsx:458-464](../react-app/src/components/music/FullPlayerModal.jsx#L458), [:521](../react-app/src/components/music/FullPlayerModal.jsx#L521).

### 4.3. Trạng thái tải / skeleton

- Biến `loading` trong cả 2 player **không bao giờ được bật** ([MusicPlayer.jsx:83](../react-app/src/pages/music/MusicPlayer.jsx#L83)) → `LoadingOverlay` không bao giờ hiện.
- Trong lúc chờ API, danh sách hiện chữ *"Chưa có danh sách phát. Hãy chọn một bài để bắt đầu."* (v1) hoặc *"Không có bài hát phù hợp"* (v2) → người dùng tưởng là trống.
- Ô tìm kiếm trên header thoáng hiện "Không tìm thấy kết quả" trong 300ms chờ debounce, trước khi bắt đầu tìm.
- **Đề xuất:** dùng skeleton cho 6–8 hàng nhạc, có trạng thái lỗi riêng kèm nút "Thử lại".

### 4.4. Mobile (375×812)

Bố cục v1 trên mobile, từ trên xuống: header (🎵, ô tìm kiếm, 🏠) → nút 🎵 nổi đè lên góc ảnh bìa → ảnh bìa 192px → tên bài + 4 dòng metadata → số liệu → hàng nút → bảng bài hát → chân trang cố định 100px.

| Vấn đề | Chi tiết |
|---|---|
| Cuộn lồng nhau | Bảng bài có chiều cao cố định `calc(100vh - 420px)` và tự cuộn bên trong, trong khi cả trang cũng cuộn (trang cao 1052px so với màn 812px). Màn đầu chỉ thấy **khoảng 1,5 bài** ([MusicPlayer.jsx:1179](../react-app/src/pages/music/MusicPlayer.jsx#L1179)) |
| Chân trang không có tên bài | Trên mobile chân trang chỉ có nút điều khiển và thanh tua; cuộn xuống là không biết đang phát bài gì |
| Thao tác ẩn | Chạm **tên bài** → full player (chỉ khi ≤1024px); chạm **ảnh bìa** → lời bài hát; dòng "Vuốt trái/phải để đổi bài" chỉ hiện khi hover → người dùng cảm ứng không bao giờ thấy |
| Hai nút 🎵 giống nhau | Nút 🎵 trên header (về thư viện) và nút 🎵 nổi (mở playlist) đứng sát nhau, cùng icon, khác chức năng |
| Hover "dính" | Hiệu ứng hover của ảnh bìa trong full player hiện chồng lên sóng nhạc sau khi chạm (▶ trên giả lập, cần kiểm tra trên máy thật) |
| Không có safe-area | Chân trang không có `env(safe-area-inset-bottom)` → trên iPhone, thanh Home đè lên thanh tua |
| Không điều khiển từ màn khoá | Không dùng **Media Session API** → không có nút ở màn hình khoá/thông báo, tai nghe không bấm next/prev được. Với app nghe nhạc trên điện thoại, đây là thiếu sót lớn |
| Nút "Fullscreen" | Chỉ đổi kích thước ảnh, không vào toàn màn hình thật |
| MusicHome | 3 slider (Random, Most Played, Recently) chiếm **khoảng 1,5 màn hình** trước khi tới thư viện; tiêu đề "Recently Played" bị cắt còn "Rec…"; nút xoá chỉ hiện khi hover (vô hình trên cảm ứng); nút ➕ chỉ 24×24px |

### 4.5. Desktop

- **v1 (1366px):** bố cục cân đối, giống Spotify, tìm kiếm có gợi ý và cuộn vô hạn. Cột Title hơi hẹp so với cột Album/Folder. Danh sách vẫn hiện album rác (`mp3.zing.vn`, `Unknown Album`) dù phần đầu trang đã ẩn chúng.
- **v2 (1366px):** lưới 3 cột `360px | 1fr | 320px` ([MusicPlayerV2.jsx:569](../react-app/src/pages/music/MusicPlayerV2.jsx#L569)) bóp cột giữa → **cột tên bài chỉ còn 2–3 ký tự** ("Rai…", "Lạ…") (▶). Tiêu đề lớn hiện **tên album/thư mục** chứ không phải tên bài ([:597](../react-app/src/pages/music/MusicPlayerV2.jsx#L597)).
- **v2 (900px, tablet):** xếp thành 1 cột, ảnh bìa lệch trái, danh sách bài bị đẩy xuống dưới màn hình đầu, panel playlist nằm tận cuối trang.
- Cách mở full player phụ thuộc độ rộng màn hình mà không có gợi ý nào: >1024px phải bấm vào thông tin bài ở chân trang (bấm tên bài không làm gì); 769–1024px thì ngược lại, chỉ bấm vào tên bài mới mở được.

### 4.6. Nhất quán và ngôn từ

- **Icon trái nghĩa:** trong player ❤️ = "Thêm vào playlist" (app không có tính năng yêu thích nhạc) và ➕ = "Chọn nhiều bài"; nhưng trên card ở MusicHome ➕ lại = "Thêm vào playlist".
- **Pha trộn ngôn ngữ:** "Select tracks to add to playlist", "All", "**Clear CB**" (thuật ngữ khó hiểu), "Add", "Remove" nằm cạnh "Tạm dừng", "Phát tất cả", "lượt xem" (v2) / "Plays" (v1).
- **Theme lệch:** MusicHome và trang `/music/playlists` theo theme sáng/tối của app, còn player luôn tối; `PlaylistModal` nền trắng hiện trên player tối ([PlaylistModal.jsx:215](../react-app/src/components/music/PlaylistModal.jsx#L215)).
- Tên bài hiện cả đuôi `.mp3` dù comment ghi "không extension".
- Sidebar ghi trùng "PLAYLIST" và "PLAYLISTS".
- Thanh tua, âm lượng và các nút chân trang không có `aria-label`/`title` (Shuffle, Prev, Next, Repeat).

### 4.7. Hiệu năng và code

- Danh sách playlist được tải lại **mỗi lần đổi bài** (truyền `songPath`) ([MusicPlayer.jsx:922-937](../react-app/src/pages/music/MusicPlayer.jsx#L922)).
- Lượt nghe tăng thêm mỗi lần tạm dừng rồi phát lại (U7 trong [UI-CONSISTENCY-REPORT.md](UI-CONSISTENCY-REPORT.md) — chủ ý của tác giả theo commit `e5c9f9e`, giữ nguyên); "Recent" của music ghi sai trường (U5).
- Logic Play/Pause, Shuffle, Repeat, Mute được **chép 4 lần** (MusicPlayer, MusicPlayerV2, PlayerFooter, FullPlayerModal). v1 và v2 trùng khoảng 60% code (load playlist/folder, kéo-thả, audio events).
- `PlaylistDetail.jsx` không được gắn route nào → code chết.

---

## 5. Điểm làm tốt

- Giao diện v1 trên desktop đẹp, quen mắt, có nhịp điệu thị giác tốt.
- Tìm kiếm trên header: debounce, bỏ dấu, gợi ý có ảnh, cuộn vô hạn.
- Chọn nhiều bài để thêm/xoá playlist; tải xuống theo hàng chờ (bài đang phát hoặc cả danh sách).
- Full player có vuốt đổi bài, lyrics xem/sửa ngay trong app.
- Kéo-thả trên desktop có vạch chỉ vị trí và lưu thứ tự playlist lên server.
- Đã cố tách `PlayerHeader`/`PlayerFooter` dùng chung cho 2 theme — đây là hướng đúng để gộp v1 và v2.

---

## 6. Đề xuất (theo thứ tự ưu tiên)

### P0 — Sửa ngay (mỗi mục vài dòng) — ✅ đã làm 2026-11-04

| Mục | Đã sửa thế nào | Kết quả chạy lại |
|---|---|---|
| **M1** | `loadFolderSongs` của v2 kiểm tra `null/undefined` giống v1, coi `''` là thư mục gốc | Bài "Root Song A" phát được trên v2 |
| **M2** | v2 không lưu thứ tự khi đang Shuffle; cả v1 và v2 bỏ qua khi thả lại đúng chỗ cũ | Thả tại chỗ: 0 lần gọi API; kéo khi Shuffle: thứ tự trên server giữ nguyên; tắt Shuffle khôi phục đúng thứ tự |
| **M4** | `handleEnded` (v1, v2): bài cuối + không Repeat → `pauseTrack()`; Repeat All với 1 bài → tua về 0 rồi phát | Hết danh sách thì nút về ▶; bấm ▶ phát lại được |
| **M5** | Giữ việc lưu `shuffle`, nhưng khi tải thư mục/playlist mới mà Shuffle đang bật thì xáo danh sách (bài được chọn đứng đầu) và nhớ thứ tự gốc. Thêm `utils/shuffle.js` | Tải lại khi đang Shuffle: danh sách đã xáo; tắt Shuffle trả về thứ tự gốc |
| **M6** | Chuyển `<Toaster>` từ `Layout` lên `App.jsx`; trên `/music/player` đẩy toast lên trên chân trang 100px | Lưu lyrics hiện "Đã lưu lời bài hát thành công! 🎵" |
| **M7** | So vị trí X của con trỏ lúc nhấn và lúc click (lệch >10px thì là vuốt) thay cho `onDragEnd` — framer-motion có thể gọi `onDragEnd` sau sự kiện click | Vuốt chỉ đổi bài; bấm thường vẫn mở lyrics |
| **M8** | Ô "Tìm playlist" ở sidebar v1 và panel v2 lọc không dấu, có thông báo "Không tìm thấy playlist" | "yeu" → "Yêu thích", "chay bo" → "Chạy bộ buổi sáng" |
| **M9** | Thêm nút ✕ trong panel mobile; nền tối/panel nằm trên header và chân trang (z 55/60); nút mở đổi icon 🎵 → ☰ để không trùng với nút 🎵 trên header | Nút ✕ hiện và đóng được; chân trang không còn che panel |
| **M10** | `LyricsModal` cập nhật lời mới cho cả `currentTrack` (nếu vẫn là bài đó) và bài tương ứng trong `currentPlaylist`; trang v1 ưu tiên lyrics của store hơn metadata | Sau khi lưu rồi phát lại, mở lyrics vẫn thấy lời mới |
| **M13** | Bỏ `<PlaylistModal />` trong `Layout` (đã có ở `App.jsx`) | Bấm ➕ chỉ mở 1 modal; thêm bài hiện toast "Đã thêm vào playlist", app không crash |

### P1 — Trải nghiệm cốt lõi — ✅ đã làm 2026-11-04

| Hạng mục | Đã làm | Kết quả chạy lại (backend giả) |
|---|---|---|
| Trình phát toàn cục | `components/music/MusicPlayerProvider.jsx` (bọc toàn app trong `App.jsx`) giữ **một** thẻ `<audio>`, các sự kiện audio, xử lý hết danh sách, đếm lượt nghe + Recent, metadata bài hát, và render `FullPlayerModal` dùng chung. Store có thêm `queueSource`/`queueKey` (không lưu localStorage): phát đúng nguồn `M_*` khi đang xem mục khác, và khi quay lại trang player với cùng yêu cầu thì không phát lại từ đầu. Hooks nằm ở `musicPlayerContext.js` | Rời trang player nhạc vẫn chạy và tự chuyển bài; chỉ có 1 thẻ audio; mở lại trang player giữ đúng bài và vị trí |
| Mini-player | `MiniPlayer.jsx`: ảnh, tên, nghệ sĩ, ⏮ ⏯ ⏭, mở full player, ✕ tắt nhạc, vạch tiến độ. Ẩn ở `/music/player`, `/movie/player`, `/manga/reader`. `Layout` chừa khoảng trống ở đáy; `DownloadBadge` và toast được đẩy lên trên mini-player | Hiện ở trang thư viện (desktop và mobile, không cuộn ngang); bấm tên → trang player; ✕ → dừng, ẩn bar |
| Media Session (+M14) | Metadata (tên/nghệ sĩ/album/ảnh), `playbackState`, `setPositionState`, handler play/pause/prev/next/seekto/seek±10s. Store nghe sự kiện `play`/`pause` của audio (bỏ qua lúc đổi bài và lúc hết bài) | `mediaSession.metadata.title` = tên bài; `audio.pause()` từ bên ngoài → nút về ▶, `playbackState` = paused |
| Nút điều khiển | Hàm Play/Pause, Shuffle, Repeat, Mute, Next/Prev chỉ còn 1 bản trong Provider (trước đây chép 4 nơi). "Bài trước" sau 3 giây đầu thì tua về đầu bài | Lần 1 tua về 0, lần 2 mới sang bài trước |
| `SeekBar` | `components/music/SeekBar.jsx`: pointer events (chuột và cảm ứng), vùng chạm 24px, núm luôn hiện (to ra khi kéo), lớp đã tải, `role="slider"`, phím ←/→/Home/End, `touch-action: pan-y`. Dùng cho thanh tua và âm lượng ở footer và full player | Kéo 25%→75%: nhãn thời gian chạy theo, nhạc chỉ tua khi thả, đúng 6.00/8s; ← lùi 5 giây |
| Mobile | Danh sách bài chảy theo trang (`md:` mới có khung cao cố định); footer mobile có ảnh + tên + nghệ sĩ (chạm → full player) và ⏮ ⏯ ⏭; Shuffle/Repeat ở full player; `pb-[env(safe-area-inset-bottom)]`; ẩn âm lượng trên iOS; chạm tên bài ở trang mở full player ở mọi kích thước màn hình | Danh sách không còn cuộn lồng; chạm tên ở footer mở full player |
| Skeleton + lỗi | `TrackListSkeleton.jsx`; trang v1/v2 hiện skeleton khi tải, thông báo lỗi kèm nút "Thử lại"; ô tìm trên header hiện "Đang tìm…" trong lúc chờ debounce thay vì "Không tìm thấy" | Phản hồi chậm 2s → hiện skeleton, không còn chữ "Chưa có danh sách phát"; playlist không tồn tại → lỗi + "Thử lại" gọi lại API |
| Khác | Nút 🎵 trên header mở thư mục của bài đang phát; v2 có full player (bấm thông tin bài ở footer); Esc đóng full player; khi mở trình xem phim thì tạm dừng nhạc. Sửa thêm: kéo-thả trong thư mục cấp 1 (vd `Vpop`) không còn gửi `PATCH /playlist/order` với id `NaN`; tiêu đề không còn hiện "Playlist #Vpop" | — |

Chưa làm/ghi chú: chưa thử trên điện thoại thật (màn hình khoá, tai nghe, iOS); toast lỗi playlist vẫn hiện nguyên JSON từ server; `viewport-fit=cover` chưa bật nên `safe-area` hiện bằng 0 (không ảnh hưởng gì khi chưa bật).

Đề xuất ban đầu:
1. **Một trình phát nhạc toàn cục**: đưa `<audio>` và logic phát vào một `MusicPlayerProvider` ở `App.jsx`, kèm **mini-player** cố định ở đáy mọi trang (ảnh, tên, ⏯, ⏭, bấm vào để mở full player). Cách này giải quyết M3, và sau đó trang player chỉ còn là phần giao diện.
2. **Media Session API**: `navigator.mediaSession.metadata` cùng các handler `play/pause/previoustrack/nexttrack/seekto` → điều khiển được từ màn hình khoá, thông báo và tai nghe. Đồng thời cho store nghe sự kiện `play`/`pause` của thẻ audio, để trạng thái nút luôn khớp khi bị tạm dừng từ bên ngoài (M14).
3. **Component `SeekBar` dùng chung**: dùng pointer events (hoặc `<input type="range">` đã tạo kiểu), vùng chạm ≥ 24px với núm luôn hiện, có `role="slider"` và hỗ trợ phím ←/→.
4. **Mobile**: bỏ chiều cao cố định của bảng bài để chỉ còn một thanh cuộn của trang; chân trang hiện tên bài và bấm vào mở full player; thêm `padding-bottom: env(safe-area-inset-bottom)`; ẩn thanh âm lượng trên iOS.
5. **Skeleton**: thêm trạng thái tải/lỗi riêng cho danh sách bài và thanh tìm kiếm.

### P2 — Hoàn thiện
1. **Kéo-thả**: thêm tay nắm ⋮⋮ và chuyển sang pointer events hoặc thư viện `@dnd-kit` (hỗ trợ cảm ứng, nhấn giữ, bàn phím). Ở chế độ thư mục nên báo "thứ tự tạm thời" hoặc tắt kéo-thả.
2. **Gộp v1/v2**: giữ một trang player duy nhất và chọn theme Spotify/Zing (màu, bố cục phần đầu trang), dùng chung toàn bộ logic. Nếu không muốn đầu tư thì **bỏ v2** — hiện nó thiếu tính năng và có 2 lỗi nghiêm trọng.
3. **Icon và ngôn từ**: ❤️ chỉ dùng cho yêu thích, ➕ = thêm vào playlist, ☑ = chọn nhiều; thống nhất tiếng Việt; đổi "Clear CB" thành "Bỏ chọn".
4. **Theme**: `PlaylistModal` và trang Playlists theo tông tối của player, hoặc player theo theme của app.
5. MusicHome mobile: thu gọn 3 slider thành tab hoặc chỉ giữ 1, để thư viện xuất hiện sớm hơn.
