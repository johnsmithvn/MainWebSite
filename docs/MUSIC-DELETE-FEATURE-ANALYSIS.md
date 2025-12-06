# 🗑️ Phân Tích: Music Delete Feature - DB Structure & Data Flow

## 📊 Cấu Trúc Database Music

### **Schema (backend/utils/db.js - getMusicDB):**

```sql
-- 📁 folders: Cache folders + audio files
CREATE TABLE folders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  thumbnail TEXT,
  type TEXT DEFAULT 'folder',    -- 'folder' | 'audio' | 'file'
  size INTEGER,
  modified INTEGER,              -- lastModified timestamp
  duration INTEGER,              -- Audio duration (seconds)
  scanned INTEGER DEFAULT 0,     -- Mark & Sweep GC flag
  isFavorite INTEGER DEFAULT 0,
  viewCount INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- 🎵 songs: Metadata (artist, album, lyrics...)
CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,     -- Foreign key to folders.path
  artist TEXT,
  album TEXT,
  title TEXT,
  genre TEXT,
  lyrics TEXT
);

-- 🎶 playlists
CREATE TABLE playlists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- 🔗 playlist_items: Many-to-Many (playlists ↔ songs)
CREATE TABLE playlist_items (
  playlistId INTEGER NOT NULL,
  songPath TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  PRIMARY KEY (playlistId, songPath)
);
```

---

## 🔄 Data Flow: Render Music Grid

### **1. Frontend Store (react-app/src/store/index.js - useMusicStore):**

```javascript
export const useMusicStore = create(
  persist(
    (set, get) => ({
      musicList: [],          // Current folder items
      currentPath: '',        // Current folder path
      loading: false,
      error: null,
      searchTerm: '',
      
      // Fetch folders from backend
      fetchMusicFolders: async (path = '') => {
        set({ loading: true, error: null });
        const { sourceKey } = useAuthStore.getState();
        
        try {
          // API call
          const response = await apiService.music.getFolders({ 
            key: sourceKey, 
            path: path 
          });
          
          const folders = response.data?.folders || [];
          
          // Update state
          set({ 
            musicList: folders,  // ⭐ Render from here
            currentPath: path,
            loading: false 
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
      
      clearMusicCache: () => set({ 
        musicList: [], 
        currentPath: '',
        error: null 
      }),
    })
  )
);
```

### **2. Backend API (backend/api/music/music-folder.js):**

```javascript
// GET /api/music/folder?key=M_MUSIC&path=Albums/Rock
router.get('/folder', async (req, res) => {
  const { key, path = '' } = req.query;
  const db = getMusicDB(key);
  const rootPath = getRootPath(key);
  
  // Query folders + audio files from DB
  const items = db.prepare(`
    SELECT * FROM folders 
    WHERE path LIKE ? 
    ORDER BY type DESC, name ASC
  `).all(`${path}/%`);
  
  res.json({ folders: items });
});
```

### **3. Component Render (react-app/src/pages/music/MusicHome.jsx):**

```jsx
const MusicHome = () => {
  const { musicList, fetchMusicFolders } = useMusicStore();
  
  useEffect(() => {
    const urlPath = searchParams.get('path') || '';
    fetchMusicFolders(urlPath);
  }, [searchParams]);
  
  return (
    <div className="grid">
      {musicList.map(item => (
        <MusicCard 
          key={item.path} 
          item={item}      // ⭐ Render individual cards
        />
      ))}
    </div>
  );
};
```

---

## ⚠️ Vấn Đề: Outdated DB Cache

### **Scenario:**
```
1. User moves/deletes folder on disk:
   /Music/Albums/Rock/Metallica  →  DELETED

2. DB still has records:
   folders.path = "Albums/Rock/Metallica"
   folders.path = "Albums/Rock/Metallica/Master.mp3"

3. Frontend renders outdated items from DB
   → User sees deleted folders/files

4. Solution: Allow manual deletion from DB
```

---

## ✅ Giải Pháp: Delete API + UI

### **Yêu Cầu:**
1. ✅ Xóa item (file hoặc folder) từ DB
2. ✅ Xóa tất cả path con nếu là folder
3. ✅ Xóa metadata liên quan (songs, playlist_items)
4. ✅ UI: Icon xóa ở list/grid view (dưới card)

---

## 🛠️ Implementation Plan

### **1. Backend API: DELETE endpoint**

**File:** `backend/api/music/delete-item.js`

```javascript
// DELETE /api/music/delete-item
// Body: { key: 'M_MUSIC', path: 'Albums/Rock' }

router.delete('/delete-item', async (req, res) => {
  const { key, path } = req.body;
  
  if (!key || !path) {
    return res.status(400).json({ error: 'Missing key or path' });
  }
  
  try {
    const db = getMusicDB(key);
    
    // 1. Check if item exists
    const item = db.prepare('SELECT * FROM folders WHERE path = ?').get(path);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const isFolder = item.type === 'folder';
    
    // 2. Delete strategy based on type
    if (isFolder) {
      // ✅ Delete folder + all children
      // Pattern: path = 'Albums/Rock'
      // Matches: 'Albums/Rock', 'Albums/Rock/Metallica', 'Albums/Rock/Metallica/Master.mp3'
      
      // Delete songs metadata for all children
      db.prepare(`
        DELETE FROM songs 
        WHERE path IN (
          SELECT path FROM folders 
          WHERE path = ? OR path LIKE ?
        )
      `).run(path, `${path}/%`);
      
      // Delete playlist references
      db.prepare(`
        DELETE FROM playlist_items 
        WHERE songPath IN (
          SELECT path FROM folders 
          WHERE path = ? OR path LIKE ?
        )
      `).run(path, `${path}/%`);
      
      // Delete folders
      const deleteResult = db.prepare(`
        DELETE FROM folders 
        WHERE path = ? OR path LIKE ?
      `).run(path, `${path}/%`);
      
      res.json({ 
        success: true, 
        deleted: deleteResult.changes,
        type: 'folder',
        message: `Đã xóa folder "${item.name}" và ${deleteResult.changes - 1} items con`
      });
    } else {
      // ✅ Delete single audio file
      
      // Delete song metadata
      db.prepare('DELETE FROM songs WHERE path = ?').run(path);
      
      // Delete playlist references
      db.prepare('DELETE FROM playlist_items WHERE songPath = ?').run(path);
      
      // Delete folder entry
      db.prepare('DELETE FROM folders WHERE path = ?').run(path);
      
      res.json({ 
        success: true, 
        deleted: 1,
        type: 'audio',
        message: `Đã xóa "${item.name}"`
      });
    }
  } catch (err) {
    console.error('❌ Delete item error:', err);
    res.status(500).json({ error: 'Lỗi khi xóa item: ' + err.message });
  }
});

module.exports = router;
```

**Register route:**
```javascript
// backend/routes/music.js
router.use("/", require("../api/music/delete-item"));
```

---

### **2. Frontend: Delete Function**

**File:** `react-app/src/store/index.js` (useMusicStore)

```javascript
export const useMusicStore = create(
  persist(
    (set, get) => ({
      // ... existing state ...
      
      // ✅ NEW: Delete item from DB
      deleteItem: async (path) => {
        const { sourceKey } = useAuthStore.getState();
        const { showToast } = useUIStore.getState();
        
        try {
          const response = await fetch('/api/music/delete-item', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: sourceKey, path })
          });
          
          if (!response.ok) {
            throw new Error(await response.text());
          }
          
          const result = await response.json();
          
          // Update local state: remove from musicList
          set((state) => ({
            musicList: state.musicList.filter(item => {
              // Remove exact match
              if (item.path === path) return false;
              
              // If deleted item is folder, remove children
              if (result.type === 'folder' && item.path.startsWith(`${path}/`)) {
                return false;
              }
              
              return true;
            })
          }));
          
          showToast(result.message, 'success');
          return result;
        } catch (err) {
          showToast('Không thể xóa: ' + err.message, 'error');
          throw err;
        }
      },
    })
  )
);
```

---

### **3. UI Component: Delete Button**

**File:** `react-app/src/components/music/MusicCard.jsx`

```jsx
import { FiTrash2 } from 'react-icons/fi';
import { useMusicStore, useUIStore } from '@/store';

const MusicCard = ({ item, variant = 'default' }) => {
  const { deleteItem } = useMusicStore();
  const { showToast } = useUIStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    // Confirm dialog
    const confirmMessage = item.type === 'folder' 
      ? `Xóa folder "${item.name}" và tất cả nội dung bên trong?`
      : `Xóa "${item.name}"?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await deleteItem(item.path);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };
  
  // List view variant
  if (variant === 'list') {
    return (
      <div className="flex items-center justify-between">
        {/* ... existing content ... */}
        
        {/* ✅ Delete button at bottom-right */}
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 
                     dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title={`Xóa ${item.type === 'folder' ? 'folder' : 'file'} khỏi DB`}
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  // Grid view variant
  return (
    <div className="relative group">
      {/* ... existing card content ... */}
      
      {/* ✅ Delete button (appears on hover) */}
      <button
        onClick={handleDelete}
        className="absolute bottom-2 right-2 p-2 bg-red-500 text-white 
                   rounded-lg opacity-0 group-hover:opacity-100 
                   hover:bg-red-600 transition-all duration-200 z-10"
        title={`Xóa ${item.type === 'folder' ? 'folder' : 'file'} khỏi DB`}
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
```

---

## 🎨 UI Design

### **Grid View:**
```
┌─────────────────────────┐
│   [Thumbnail Image]     │
│                         │
│   Folder Name      [♡]  │
│   100 songs             │
│                    [🗑️] │ ← Delete button (bottom-right)
└─────────────────────────┘
```

### **List View:**
```
┌────────────────────────────────────────────────┐
│ [Thumb] Folder Name    │ 100 songs  │ [♡][🗑️] │
└────────────────────────────────────────────────┘
```

---

## 🔒 Security Considerations

### **1. Validation:**
```javascript
// Backend: Validate path to prevent injection
const sanitizePath = (path) => {
  return path.replace(/[^\w\s\-\/\.]/gi, '');
};
```

### **2. Authorization:**
```javascript
// Only allow delete if user has access to source key
const { sourceKey } = useAuthStore.getState();
if (!sourceKey) {
  throw new Error('Unauthorized');
}
```

### **3. Confirmation:**
```javascript
// Frontend: Always confirm before delete
if (!window.confirm('Xóa folder này?')) return;
```

---

## 📝 Testing Checklist

- [ ] ✅ Delete single audio file
- [ ] ✅ Delete folder with children
- [ ] ✅ Verify songs metadata deleted
- [ ] ✅ Verify playlist_items deleted
- [ ] ✅ UI updates immediately after delete
- [ ] ✅ Toast notification shows success/error
- [ ] ✅ Grid view delete button appears on hover
- [ ] ✅ List view delete button always visible
- [ ] ✅ Prevent accidental clicks (stopPropagation)
- [ ] ✅ Test with nested folders (3+ levels)

---

## 🚀 Migration Steps

1. ✅ Create backend API: `backend/api/music/delete-item.js`
2. ✅ Register route in `backend/routes/music.js`
3. ✅ Add store function: `useMusicStore.deleteItem()`
4. ✅ Update UI: `MusicCard.jsx` with delete button
5. ✅ Test in both grid and list views
6. ✅ Update CHANGELOG.md

---

## 📊 Performance Notes

### **Batch Delete (Future Enhancement):**
```javascript
// Delete multiple items at once
deleteItems: async (paths) => {
  const response = await fetch('/api/music/delete-items', {
    method: 'DELETE',
    body: JSON.stringify({ key: sourceKey, paths })
  });
}
```

### **Soft Delete (Alternative):**
```sql
-- Add deleted flag instead of hard delete
ALTER TABLE folders ADD COLUMN deleted INTEGER DEFAULT 0;

-- Query: Exclude deleted items
SELECT * FROM folders WHERE deleted = 0;
```

---

## 🎯 Summary

**Solution:** Thêm nút xóa ở mỗi card (grid/list) để xóa outdated items khỏi DB.

**Backend:**
- API: `DELETE /api/music/delete-item`
- Logic: Xóa folder + children + metadata (songs, playlist_items)

**Frontend:**
- Store: `useMusicStore.deleteItem(path)`
- UI: Icon 🗑️ ở bottom-right (grid) hoặc right side (list)
- Confirm trước khi xóa

**Benefits:**
- ✅ Dọn dẹp DB outdated records
- ✅ Không cần full rescan
- ✅ UX tốt (instant feedback)
- ✅ Safe (confirmation dialog)
