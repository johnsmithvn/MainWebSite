# 🎯 RandomSlider Component

Component slider ngẫu nhiên được tạo dựa trên logic từ frontend cũ với các tính năng hiện đại.

## ✨ Tính năng

- **🔄 Auto-refresh**: Tự động làm mới data với cache thông minh
- **📱 Responsive**: Tự động điều chỉnh số slide theo màn hình
- **⚡ Performance**: Lazy loading và image optimization
- **🎨 Theming**: Hỗ trợ dark/light mode
- **♿ Accessibility**: Keyboard navigation và screen reader support
- **🎥 Auto-play**: Tự động chuyển slide với pause khi hover
- **💾 Caching**: Local storage cache với expiration

## 🔧 API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'manga' \| 'movie' \| 'music'` | `'manga'` | Loại nội dung |
| `title` | `string` | `'Ngẫu nhiên'` | Tiêu đề hiển thị |
| `showViews` | `boolean` | `false` | Hiển thị số lượt xem |
| `autoplay` | `boolean` | `true` | Tự động chuyển slide |
| `slidesPerView` | `number \| 'auto'` | `'auto'` | Số slide hiển thị |
| `spaceBetween` | `number` | `16` | Khoảng cách giữa các slide |
| `showRefresh` | `boolean` | `true` | Hiển thị nút refresh |
| `showTimestamp` | `boolean` | `true` | Hiển thị thời gian cập nhật |
| `className` | `string` | `''` | CSS class tùy chỉnh |

### useRandomItems Hook

Hook quản lý data với cache và refresh logic:

```jsx
const {
  data,      // Array of items
  loading,   // Loading state
  error,     // Error state  
  refresh,   // Function to refresh data
  lastUpdated // Last update timestamp
} = useRandomItems(type, options);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable query |
| `staleTime` | `number` | `5 * 60 * 1000` | Cache stale time (5 min) |
| `cacheTime` | `number` | `10 * 60 * 1000` | Cache time (10 min) |
| `count` | `number` | `20` | Số lượng items |
| `force` | `boolean` | `false` | Force refresh |

## 📝 Sử dụng

### Basic Usage

```jsx
import RandomSlider from '@/components/common/RandomSlider';

function App() {
  return (
    <RandomSlider
      type="manga"
      title="📚 Manga ngẫu nhiên"
      showViews={false}
      autoplay={true}
    />
  );
}
```

### Advanced Usage

```jsx
function MangaPage() {
  return (
    <div>
      {/* Random banner */}
      <RandomSlider
        type="manga"
        title="📚 Manga ngẫu nhiên"
        showViews={false}
        autoplay={true}
        showRefresh={true}
        showTimestamp={true}
      />
      
      {/* Top view */}
      <RandomSlider
        type="manga"
        title="🔥 Xem nhiều nhất"
        showViews={true}
        autoplay={false}
        showRefresh={false}
      />
    </div>
  );
}
```

### Multi-type Usage

```jsx
function HomePage() {
  const { sourceKey } = useAuthStore();
  
  return (
    <div>
      {/* Manga slider */}
      {!sourceKey.startsWith('V_') && !sourceKey.startsWith('M_') && (
        <RandomSlider type="manga" title="📚 Manga" />
      )}
      
      {/* Movie slider */}
      {sourceKey.startsWith('V_') && (
        <RandomSlider type="movie" title="🎬 Phim" />
      )}
      
      {/* Music slider */}
      {sourceKey.startsWith('M_') && (
        <RandomSlider type="music" title="🎵 Nhạc" />
      )}
    </div>
  );
}
```

## 🎨 Styling

Component hỗ trợ CSS variables để customize:

```css
.random-slider {
  --slide-width: 200px;
  --slide-spacing: 16px;
  --border-radius: 0.5rem;
}

/* Dark mode */
.dark .random-slider {
  --bg-color: #1f2937;
  --text-color: #ffffff;
}
```

## 🔗 Dependencies

- `swiper`: Slider library
- `react-lazy-load-image-component`: Image lazy loading
- `react-hot-toast`: Toast notifications
- `@tanstack/react-query`: Data fetching and caching
- `framer-motion`: Animations
- `react-icons`: Icons

## 📂 File Structure

```
src/
├── components/
│   ├── common/
│   │   ├── RandomSlider.jsx          # Main component
│   │   └── RandomSlider.example.jsx  # Usage examples
│   └── manga/
│       ├── MangaCard.jsx             # Card component
│       └── MangaRandomSection.jsx    # Wrapper component
├── hooks/
│   └── useRandomItems.js             # Data fetching hook
└── styles/
    └── components/
        ├── random-slider.css         # Slider styles
        └── manga-card.css           # Card styles
```

## 🔄 Migration từ Frontend Cũ

Component này replicate logic từ `folderSlider.js` với các cải tiến:

1. **React Hooks** thay vì vanilla JS
2. **React Query** thay vì manual cache
3. **Swiper.js** thay vì native scroll
4. **TypeScript-ready** props
5. **Better performance** với lazy loading
6. **Modern animations** với Framer Motion

### Mapping Logic Cũ -> Mới

| Frontend Cũ | React Mới |
|--------------|-----------|
| `renderFolderSlider()` | `<RandomSlider />` |
| `loadRandomSection()` | `useRandomItems()` |
| `sessionStorage` cache | `localStorage` + React Query |
| CSS scroll snap | Swiper.js |
| Manual refresh | `refresh()` function |

## 🐛 Troubleshooting

### Cache không hoạt động
- Kiểm tra `localStorage` có bị disable không
- Xem console có error về quota không

### Slider không hiển thị
- Đảm bảo có data từ API
- Kiểm tra `sourceKey` và `rootFolder` đúng
- Xem network tab có call API không

### Performance chậm
- Giảm `count` trong options
- Tăng `staleTime` để cache lâu hơn
- Disable `autoplay` nếu không cần
