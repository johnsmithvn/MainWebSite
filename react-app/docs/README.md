# MainWebSite React App

🚀 **React version của MainWebSite** - Ứng dụng quản lý media local cho manga, phim và nhạc.

## ✨ Tính năng

### 📚 Manga
- Đọc manga với giao diện hiện đại
- Chế độ đọc vertical/horizontal
- Zoom, điều hướng trang
- Yêu thích và lịch sử đọc
- Tìm kiếm và lọc

### 🎬 Movie
- Xem phim với player tích hợp
- Quản lý thư mục phim
- Thumbnail tự động
- Yêu thích và gần đây
- Hỗ trợ nhiều định dạng video

### 🎵 Music
- Player nhạc với playlist
- Quản lý thư viện nhạc
- Metadata và thumbnail
- Yêu thích và lịch sử phát
- Shuffle và repeat

### 🎨 Giao diện
- Dark/Light mode
- Responsive design
- Animation mượt mà
- Modern UI với Tailwind CSS
- Touch-friendly trên mobile

## 🛠️ Công nghệ sử dụng

- **React 18** - Framework chính
- **Vite** - Build tool nhanh
- **React Router** - Routing
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling
- **Framer Motion** - Animation
- **React Hot Toast** - Notifications

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+
- Backend server đang chạy ở port 3000

### Bước 1: Clone và cài đặt
```bash
cd react-app
npm install
```

### Bước 2: Cấu hình
Đảm bảo backend server đang chạy:
```bash
# Trong thư mục gốc MainWebSite
npm run dev
```

### Bước 3: Chạy React app
```bash
# Development mode
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

## 🚀 Sử dụng

1. **Khởi động backend server** (port 3000)
2. **Chạy React app** (port 3001)
3. **Truy cập** http://localhost:3001
4. **Chọn source** từ trang chủ
5. **Đăng nhập** nếu source yêu cầu bảo mật
6. **Thưởng thức** manga, phim, nhạc!

## 📁 Cấu trúc dự án

```
src/
├── components/          # React components
│   ├── common/         # Shared components
│   ├── auth/           # Authentication
│   ├── manga/          # Manga components
│   ├── movie/          # Movie components
│   └── music/          # Music components
├── pages/              # Page components
│   ├── manga/          # Manga pages
│   ├── movie/          # Movie pages
│   └── music/          # Music pages
├── store/              # Zustand stores
├── utils/              # Utility functions
├── hooks/              # Custom hooks
├── constants/          # Constants
└── main.jsx            # App entry point
```

## 🔧 Cấu hình

### Environment
Vite sẽ tự động proxy API calls đến backend server.

### API Endpoints
- Backend: http://localhost:3000
- React App: http://localhost:3001
- API Proxy: `/api/*` → `http://localhost:3000/api/*`

### Dark Mode
Tự động lưu preference và sync với system theme.

## 🎯 So sánh với phiên bản gốc

| Tính năng | Vanilla JS | React Version |
|-----------|------------|---------------|
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintainability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **User Experience** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mobile Support** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Code Organization** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Modern Features** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🚧 Roadmap

### Phase 1 ✅
- [x] Project setup
- [x] Basic routing
- [x] Authentication
- [x] Home page
- [x] Common components

### Phase 2 🚧
- [ ] Manga reader
- [ ] Movie player
- [ ] Music player
- [ ] Search functionality
- [ ] Favorites system

### Phase 3 📋
- [ ] Advanced reader features
- [ ] Video streaming optimization
- [ ] Music playlist management
- [ ] Offline support
- [ ] PWA features

## 🐛 Bugs & Issues

Báo cáo bugs tại [GitHub Issues](https://github.com/your-repo/issues)

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Credits

- Original MainWebSite project
- React community
- Tailwind CSS team
- All open source contributors

---

**Happy Coding!** 🎉
