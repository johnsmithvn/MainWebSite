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

export async function downloadChapter(meta) {
  const { id, pageUrls } = meta;
  const cache = await caches.open('chapter-images');
  let bytes = 0;
  for (const url of pageUrls) {
    const resp = await fetch(url, { mode: 'no-cors' });
    await cache.put(url, resp.clone());
    try {
      const blob = await resp.blob();
      bytes += blob.size;
    } catch {}
  }
  await saveChapter({
    ...meta,
    bytes,
    totalPages: pageUrls.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
