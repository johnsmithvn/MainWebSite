import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { getChapters, deleteChapter } from '../utils/offlineLibrary';

export default function OfflineLibrary() {
  const [chapters, setChapters] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    const items = await getChapters();
    setChapters(items);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    const chapter = chapters.find((c) => c.id === id);
    if (chapter) {
      const cache = await caches.open('chapter-images');
      for (const url of chapter.pageUrls) {
        await cache.delete(url);
      }
    }
    await deleteChapter(id);
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Offline Library</h1>
      {chapters.length === 0 && <p>No chapters downloaded.</p>}
      <ul className="space-y-4">
        {chapters.map((ch) => (
          <li key={ch.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">{ch.mangaTitle || 'Unknown'} - {ch.chapterTitle || ch.id}</p>
              <p className="text-sm text-gray-500">{ch.totalPages} pages</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleDelete(ch.id)}>Delete</Button>
              <Button onClick={() => navigate(`/manga/reader/${encodeURIComponent(ch.id)}?offline=1`)}>Read</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
