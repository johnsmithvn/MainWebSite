import { openDB } from 'idb';

const DB_NAME = 'offline-manga';
const STORE = 'chapters';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function getChapters() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getChapter(id) {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function saveChapter(chapter) {
  const db = await getDB();
  await db.put(STORE, chapter);
}

export async function deleteChapter(id) {
  const db = await getDB();
  await db.delete(STORE, id);
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
  await saveChapter({ ...meta, bytes, totalPages: pageUrls.length, createdAt: Date.now(), updatedAt: Date.now() });
}
