const DB_NAME = 'offline-manga';
const STORE = 'chapters';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(type, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, type);
    const store = tx.objectStore(STORE);
    let request;
    try {
      request = callback(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export function getChapters() {
  return withStore('readonly', (store) => store.getAll());
}

export function getChapter(id) {
  return withStore('readonly', (store) => store.get(id));
}

export function saveChapter(chapter) {
  return withStore('readwrite', (store) => store.put(chapter));
}

export function deleteChapter(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

// Kiểm tra xem chapter đã được download hay chưa
export async function isChapterDownloaded(id) {
  try {
    const chapter = await getChapter(id);
    return !!chapter;
  } catch (err) {
    console.error('Error checking chapter download status:', err);
    return false;
  }
}

// Download chapter với progress callback
export async function downloadChapter(meta, onProgress = null) {
  const { id, pageUrls } = meta;
  const cache = await caches.open('chapter-images');
  let bytes = 0;
  const totalPages = pageUrls.length;
  
  // Báo cáo tiến trình bắt đầu
  if (onProgress) {
    onProgress({ current: 0, total: totalPages, status: 'starting' });
  }
  
  for (let i = 0; i < pageUrls.length; i++) {
    const url = pageUrls[i];
    
    try {
      // Báo cáo tiến trình downloading từng trang
      if (onProgress) {
        onProgress({ 
          current: i, 
          total: totalPages, 
          status: 'downloading',
          currentUrl: url
        });
      }
      
      // Sử dụng cors mode thay vì no-cors để có thể đọc response body
      const resp = await fetch(url, { mode: 'cors' });
      
      if (!resp.ok) {
        throw new Error(`Failed to fetch ${url}: ${resp.status}`);
      }
      
      await cache.put(url, resp.clone());
      
      try {
        const blob = await resp.blob();
        bytes += blob.size;
      } catch (err) {
        console.error(`Failed to calculate blob size for ${url}:`, err);
      }
    } catch (err) {
      console.error(`Error downloading page ${i + 1}:`, err);
      // Tiếp tục với trang tiếp theo thay vì dừng hoàn toàn
      if (onProgress) {
        onProgress({ 
          current: i, 
          total: totalPages, 
          status: 'error',
          error: err.message
        });
      }
    }
  }
  
  // Lưu metadata vào IndexedDB
  await saveChapter({
    ...meta,
    bytes,
    totalPages: pageUrls.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  // Báo cáo hoàn thành
  if (onProgress) {
    onProgress({ 
      current: totalPages, 
      total: totalPages, 
      status: 'completed',
      totalBytes: bytes
    });
  }
  
  return { success: true, bytes, totalPages };
}
