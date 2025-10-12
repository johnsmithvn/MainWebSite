# 🎨 Download Queue System - UI/UX Mockups

## 📱 Component Hierarchy

```text
App
├── Layout
│   ├── Header
│   │   └── DownloadBadge (Floating - Always Visible)
│   ├── Sidebar
│   │   └── Downloads Menu Item (with counter badge)
│   └── Main Content
│       ├── MangaReader
│       │   ├── ReaderHeader
│       │   │   ├── [Existing buttons]
│       │   │   ├── 📥 Add to Queue (New)
│       │   │   └── Mini Progress Bar (if downloading)
│       │   └── [Existing content]
│       └── DownloadManager (New Page - /downloads)
│           ├── Statistics Panel
│           ├── Queue Tabs
│           ├── Task List
│           │   ├── DownloadTaskCard x N
│           │   │   ├── Chapter Info
│           │   │   ├── Progress Bar
│           │   │   └── Action Buttons
│           │   └── Empty State
│           └── Settings Panel
└── Notifications
    ├── Toast (react-hot-toast)
    └── Browser Notification API
```

---

## 🖼️ Wireframes

### 1. Download Manager Page (`/downloads`)

#### Desktop View (1920x1080)

```text
╔════════════════════════════════════════════════════════════════════════╗
║ ← Back to Manga    📥 DOWNLOAD MANAGER                   [⚙ Settings] ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗  ╔════════════════╗    ║
║  ║ 📊 Total  ║  ║ 🔄 Active ║  ║ ✅ Done   ║  ║ ❌ Failed      ║    ║
║  ║    18     ║  ║     2     ║  ║    15     ║  ║      1         ║    ║
║  ║ chapters  ║  ║           ║  ║           ║  ║                ║    ║
║  ╚═══════════╝  ╚═══════════╝  ╚═══════════╝  ╚════════════════╝    ║
║                                                                        ║
║  Total Downloaded: 245.5 MB                    Auto Download: [ON ]  ║
║                                                                        ║
╠════════════════════════════════════════════════════════════════════════╣
║  [All] [Downloading] [Pending] [Completed] [Failed]    [Clear Done]  ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🔄 DOWNLOADING (2)                                                    ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ 📖 [ROOT_MANGAH] One Piece - Chapter 1055                        │ ║
║  │ ████████████████████░░░░░░░░░░░░░░ 65% (130 / 200 pages)        │ ║
║  │ 2.5 MB / 3.8 MB  •  Started 2 minutes ago                        │ ║
║  │ [❚❚ Pause] [✕ Cancel]                               [⋯ More]    │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ 📖 [ROOT_DOW] Naruto - Chapter 700                               │ ║
║  │ █████████████░░░░░░░░░░░░░░░░░░░░░░ 40% (80 / 200 pages)        │ ║
║  │ 1.2 MB / 3.0 MB  •  Started 1 minute ago                         │ ║
║  │ [❚❚ Pause] [✕ Cancel]                               [⋯ More]    │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  ⏸️ PENDING (1)                                                        ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ 📖 [V_ANIME] Bleach - Chapter 686                                │ ║
║  │ ⏳ Waiting in queue... (Position #3)                             │ ║
║  │ Estimated size: 2.8 MB  •  Added 3 minutes ago                   │ ║
║  │ [▶ Start Now] [✕ Cancel]                            [⋯ More]    │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  ✅ COMPLETED (15) ───────────────────────────────── [▼ Collapse]     ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ ✅ [ROOT_FANTASY] Attack on Titan - Chapter 139                  │ ║
║  │ 200 pages • 4.2 MB • Completed 10 minutes ago                    │ ║
║  │ [👁 Read] [🗑 Delete]                                [⋯ More]    │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║  ... (14 more items - collapsed)                                      ║
║                                                                        ║
║  ❌ FAILED (1)                                                         ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ ❌ [ROOT_TEST] Test Manga - Chapter 001                          │ ║
║  │ ⚠️ Error: Network timeout (Failed 3/3 retries)                   │ ║
║  │ Failed at page 45/150 • 1 hour ago                               │ ║
║  │ [🔄 Retry] [🗑 Remove]                              [⋯ More]    │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

#### Mobile View (375x667)

```text
╔════════════════════════════╗
║ ← 📥 Downloads    [⚙]     ║
╠════════════════════════════╣
║ ┌─────┬─────┬─────┬─────┐ ║
║ │ 📊  │ 🔄  │ ✅  │ ❌  │ ║
║ │ 18  │  2  │ 15  │  1  │ ║
║ └─────┴─────┴─────┴─────┘ ║
║ 245.5 MB • Auto: [ON]     ║
╠════════════════════════════╣
║ [All] [Active] [Done]     ║
╠════════════════════════════╣
║ 🔄 DOWNLOADING (2)         ║
║ ┌────────────────────────┐ ║
║ │ 📖 One Piece #1055     │ ║
║ │ ROOT_MANGAH            │ ║
║ │ ███████░░░░░░░ 65%     │ ║
║ │ 130/200 • 2.5/3.8 MB   │ ║
║ │ [❚❚] [✕]              │ ║
║ └────────────────────────┘ ║
║                            ║
║ ┌────────────────────────┐ ║
║ │ 📖 Naruto #700         │ ║
║ │ ROOT_DOW               │ ║
║ │ ████░░░░░░░░░ 40%      │ ║
║ │ 80/200 • 1.2/3.0 MB    │ ║
║ │ [❚❚] [✕]              │ ║
║ └────────────────────────┘ ║
║                            ║
║ ⏸️ PENDING (1)             ║
║ ┌────────────────────────┐ ║
║ │ 📖 Bleach #686         │ ║
║ │ V_ANIME                │ ║
║ │ ⏳ Queue #3 • 2.8 MB   │ ║
║ │ [▶] [✕]               │ ║
║ └────────────────────────┘ ║
║                            ║
║ ✅ COMPLETED (15) [▼]      ║
║ ... (collapsed)            ║
╚════════════════════════════╝
```

---

### 2. Floating Download Badge (Global)

#### Desktop (Bottom Right)

```text
                           ╔══════════╗
                           ║    📥    ║  ← Badge
                           ║          ║
                           ║    2     ║  ← Counter (Active downloads)
                           ╚══════════╝
                                ↑
                           Circular progress ring (SVG)
                           Shows total progress
```

**States:**

- **Idle** (No downloads): Hidden
- **Downloading**: Visible with progress ring
- **Completed**: Show for 3s then fade out

**Interactions:**

- Click → Navigate to `/downloads`
- Hover → Show tooltip "2 downloads in progress"

#### Mobile (Bottom Right, above footer)

```text
         ╔═══════╗
         ║  📥   ║
         ║   2   ║  ← Smaller badge
         ╚═══════╝
```

---

### 3. MangaReader Integration

#### Reader Header (Desktop)

```text
╔══════════════════════════════════════════════════════════════════════╗
║  ← Back  |  Chapter 1055  |  ⭐ Favorite  |  🖼️ Thumbnail  |  📥 ...  ║
╚══════════════════════════════════════════════════════════════════════╝
                                                                   ↑
                                                      New dropdown menu:
                                                      ┌─────────────────┐
                                                      │ 💾 Direct Download │
                                                      │ 📥 Add to Queue    │
                                                      └─────────────────┘
```

**When chapter is in queue:**

```text
╔══════════════════════════════════════════════════════════════════════╗
║  ← Back  |  Chapter 1055  |  [████████░░] 65% downloading  |  ⋯      ║
╚══════════════════════════════════════════════════════════════════════╝
                                      ↑
                              Mini progress indicator
                              Click → Go to /downloads
```

#### Reader Header (Mobile)

```text
╔═══════════════════════════════════╗
║ ← │ Chapter 1055       │ ⋯       ║
╚═══════════════════════════════════╝
         ↑                      ↑
    Back button            Options menu:
                           ┌────────────┐
                           │ 💾 Download │
                           │ 📥 To Queue │
                           │ ⭐ Favorite │
                           │ 🖼️ Thumbnail│
                           └────────────┘

When downloading:
╔═══════════════════════════════════╗
║ ← │ [████░░░] 65%      │ ⋯       ║
╚═══════════════════════════════════╝
```

---

### 4. Toast Notifications

#### Success - Added to Queue

```text
┌────────────────────────────────────┐
│ ✅ Đã thêm vào hàng chờ download   │
│                                    │
│ 📖 One Piece - Chapter 1055        │
│                                    │
│ [Xem tiến trình →]  [✕]           │
└────────────────────────────────────┘
```

#### Success - Download Completed

```text
┌────────────────────────────────────┐
│ ✅ Download hoàn tất!               │
│                                    │
│ 📖 Naruto - Chapter 700             │
│ 200 pages • 3.0 MB                 │
│                                    │
│ [Đọc ngay →]  [✕]                 │
└────────────────────────────────────┘
```

#### Error - Download Failed

```text
┌────────────────────────────────────┐
│ ❌ Download thất bại                │
│                                    │
│ 📖 Bleach - Chapter 686             │
│ ⚠️ Network timeout                 │
│                                    │
│ [Retry]  [View Details]  [✕]      │
└────────────────────────────────────┘
```

---

### 5. Settings Panel

```text
╔══════════════════════════════════════════════════════════╗
║                   ⚙️ Download Settings                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Download Behavior                                       ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ Auto-start downloads         [●──] ON              │ ║
║  │ WiFi only mode               [──○] OFF             │ ║
║  │ Show notifications           [●──] ON              │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  Performance                                             ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ Max concurrent downloads:  [◄] 2 [►]               │ ║
║  │ (Recommended: 1-3 for stability)                   │ ║
║  │                                                    │ ║
║  │ Max retry attempts:        [◄] 3 [►]               │ ║
║  │ (Number of retries before marking as failed)      │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  Storage Management                                      ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ Auto-delete completed after: [Never ▼]             │ ║
║  │ Options: Never, 1 day, 7 days, 30 days             │ ║
║  │                                                    │ ║
║  │ Current usage: 245.5 MB / 10 GB (2.4%)             │ ║
║  │ [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                 │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  Danger Zone                                             ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ [Clear all completed downloads]                    │ ║
║  │ [Clear download history]                           │ ║
║  │ [Reset to defaults]                                │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║                              [Cancel]  [Save Changes]   ║
╚══════════════════════════════════════════════════════════╝
```

---

## 🎨 Color Palette

### Status Colors

```css
/* Light Mode */
--download-pending: #6B7280;      /* Gray */
--download-active: #3B82F6;        /* Blue */
--download-completed: #10B981;     /* Green */
--download-failed: #EF4444;        /* Red */
--download-paused: #F59E0B;        /* Amber */
--download-cancelled: #6B7280;     /* Gray */

/* Dark Mode */
--download-pending-dark: #9CA3AF;
--download-active-dark: #60A5FA;
--download-completed-dark: #34D399;
--download-failed-dark: #F87171;
--download-paused-dark: #FBBF24;
--download-cancelled-dark: #9CA3AF;
```

### Progress Bar Gradients

```css
/* Active download */
.progress-active {
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
}

/* Completed */
.progress-completed {
  background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
}

/* Failed */
.progress-failed {
  background: linear-gradient(90deg, #EF4444 0%, #F87171 100%);
}
```

---

## 🔔 Notification Behavior

### In-App Toasts (react-hot-toast)

| Event                | Duration | Position      | Action              |
| -------------------- | -------- | ------------- | ------------------- |
| Added to Queue       | 5s       | bottom-center | Link to `/downloads`|
| Download Started     | 3s       | bottom-center | Dismiss             |
| Download Completed   | 10s      | bottom-right  | Link to Reader      |
| Download Failed      | ∞        | bottom-right  | Retry + Details     |
| Download Cancelled   | 3s       | bottom-center | Dismiss             |
| Queue Empty          | 3s       | bottom-center | Dismiss             |

### Browser Notifications

**Request permission on first download**

```javascript
// Example notification
{
  title: "✅ Download Complete",
  body: "One Piece - Chapter 1055 (200 pages)",
  icon: "/default/favicon.png",
  badge: "/default/favicon.png",
  tag: "download-complete-1055",
  requireInteraction: false,
  actions: [
    { action: "read", title: "Read Now" },
    { action: "dismiss", title: "Dismiss" }
  ]
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
.download-manager {
  /* Base: Mobile (320px+) */
  --grid-columns: 1;
  --stat-card-size: 100%;
  --task-card-padding: 12px;
  --font-size-title: 14px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .download-manager {
    --grid-columns: 2;
    --stat-card-size: 48%;
    --task-card-padding: 16px;
    --font-size-title: 16px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .download-manager {
    --grid-columns: 4;
    --stat-card-size: 23%;
    --task-card-padding: 20px;
    --font-size-title: 18px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .download-manager {
    --max-width: 1280px;
    --task-card-padding: 24px;
  }
}
```

---

## ♿ Accessibility

### ARIA Labels

```jsx
// Download button
<button
  aria-label="Add chapter to download queue"
  aria-describedby="download-tooltip"
>
  📥 Add to Queue
</button>

// Progress bar
<div
  role="progressbar"
  aria-valuenow={65}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Download progress: 65% (130 of 200 pages)"
>
  ...
</div>

// Task status
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Download completed: One Piece Chapter 1055
</div>
```

### Keyboard Navigation

| Key            | Action                          |
| -------------- | ------------------------------- |
| `Tab`          | Navigate between tasks          |
| `Space`        | Pause/Resume selected task      |
| `Delete`       | Cancel selected task            |
| `Enter`        | Open task details               |
| `Esc`          | Close modals/panels             |
| `Ctrl+A`       | Select all tasks                |
| `Ctrl+Shift+C` | Clear completed downloads       |

---

## 🎭 Animation Specs

### Micro-interactions

```css
/* Progress bar animation */
.progress-bar {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Badge entrance */
.download-badge {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Task card hover */
.task-card {
  transition: all 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Loading spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📊 Performance Considerations

### Rendering Optimization

1. **Virtualization** for large task lists (>50 items)
   - Use `react-window` or `@tanstack/react-virtual`
   - Only render visible tasks

2. **Debounce progress updates**
   - Update UI max 2 times/second per task
   - Batch multiple task updates

3. **Lazy load images**
   - Task cover thumbnails load on scroll
   - Use intersection observer

4. **Memoization**
   - Memoize task cards with `React.memo`
   - Memoize statistics calculations

---

## 🔐 Security & Privacy

### Data Isolation

- ✅ Each source (ROOT_MANGAH, V_ANIME, etc.) stored separately
- ✅ No cross-contamination of cache data
- ✅ Clear separation in IndexedDB

### User Control

- ✅ User can pause/cancel any download
- ✅ User can clear specific downloads
- ✅ User can export download history
- ✅ User can disable notifications

---

**🎯 Design Goal**: Tạo UI trực quan, dễ sử dụng, với feedback rõ ràng cho mọi hành động. Ưu tiên performance và accessibility.
