// 📁 backend/api/media/album-manager.js
// 📚 Album management (like Google Photos albums)

const express = require("express");
const { getMediaDB } = require("../../utils/db");

// GET /api/media/albums - Get all albums
const getAlbums = (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Thiếu key" });

    const db = getMediaDB(key);
    
    const albums = db.prepare(`
      SELECT 
        a.*,
        COUNT(m.id) as itemCount,
        -- Derived cover from the first media item (latest by date_taken) when coverImage is null
        (
          SELECT path FROM media_items mi 
          WHERE mi.albumId = a.id 
          ORDER BY mi.date_taken DESC, mi.createdAt DESC 
          LIMIT 1
        ) AS coverItemPath,
        (
          SELECT thumbnail FROM media_items mi 
          WHERE mi.albumId = a.id 
          ORDER BY mi.date_taken DESC, mi.createdAt DESC 
          LIMIT 1
        ) AS coverThumbnail
      FROM albums a
      LEFT JOIN media_items m ON m.albumId = a.id
      GROUP BY a.id
      ORDER BY a.updatedAt DESC
    `).all();

    res.json({
      success: true,
      albums
    });
  } catch (err) {
    console.error("❌ Get albums error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/media/albums - Create new album
const createAlbum = (req, res) => {
  try {
    const { key, name, description } = req.body;
    
    if (!key || !name) {
      return res.status(400).json({ error: "Thiếu key hoặc name" });
    }

    const db = getMediaDB(key);
    
    const result = db.prepare(
      `INSERT INTO albums (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)`
    ).run(name, description || "", Date.now(), Date.now());

    const album = db.prepare(`SELECT * FROM albums WHERE id = ?`).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: "Album created",
      album
    });
  } catch (err) {
    console.error("❌ Create album error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/media/albums/:id - Update album
const updateAlbum = (req, res) => {
  try {
    const { key, name, description, coverImage } = req.body;
    const { id } = req.params;
    
    if (!key || !id) {
      return res.status(400).json({ error: "Thiếu key hoặc id" });
    }

    const db = getMediaDB(key);
    
    db.prepare(
      `UPDATE albums SET name = ?, description = ?, coverImage = ?, updatedAt = ? WHERE id = ?`
    ).run(name, description, coverImage, Date.now(), id);

    const album = db.prepare(`SELECT * FROM albums WHERE id = ?`).get(id);

    res.json({
      success: true,
      message: "Album updated",
      album
    });
  } catch (err) {
    console.error("❌ Update album error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/media/albums/:id - Delete album
const deleteAlbum = (req, res) => {
  try {
    const { key } = req.body;
    const { id } = req.params;
    
    if (!key || !id) {
      return res.status(400).json({ error: "Thiếu key hoặc id" });
    }

    const db = getMediaDB(key);
    
    // Remove album association from media items
    db.prepare(`UPDATE media_items SET albumId = NULL WHERE albumId = ?`).run(id);
    
    // Delete album
    db.prepare(`DELETE FROM albums WHERE id = ?`).run(id);

    res.json({
      success: true,
      message: "Album deleted"
    });
  } catch (err) {
    console.error("❌ Delete album error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/media/albums/:id/items - Add items to album
const addItemsToAlbum = (req, res) => {
  try {
    const { key, itemIds } = req.body; // itemIds: [1, 2, 3]
    const { id } = req.params;
    
    if (!key || !id || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const db = getMediaDB(key);
    
    const stmt = db.prepare(`UPDATE media_items SET albumId = ?, updatedAt = ? WHERE id = ?`);
    const updateAlbum = db.prepare(`UPDATE albums SET updatedAt = ? WHERE id = ?`);
    
    db.transaction(() => {
      for (const itemId of itemIds) {
        stmt.run(id, Date.now(), itemId);
      }
      updateAlbum.run(Date.now(), id);
    })();

    res.json({
      success: true,
      message: `Added ${itemIds.length} items to album`
    });
  } catch (err) {
    console.error("❌ Add items to album error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/media/albums/:id/items - Remove items from album
const removeItemsFromAlbum = (req, res) => {
  try {
    const { key, itemIds } = req.body;
    const { id } = req.params;
    
    if (!key || !id || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const db = getMediaDB(key);
    
    const stmt = db.prepare(`UPDATE media_items SET albumId = NULL, updatedAt = ? WHERE id = ? AND albumId = ?`);
    const updateAlbum = db.prepare(`UPDATE albums SET updatedAt = ? WHERE id = ?`);
    
    db.transaction(() => {
      for (const itemId of itemIds) {
        stmt.run(Date.now(), itemId, id);
      }
      updateAlbum.run(Date.now(), id);
    })();

    res.json({
      success: true,
      message: `Removed ${itemIds.length} items from album`
    });
  } catch (err) {
    console.error("❌ Remove items from album error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addItemsToAlbum,
  removeItemsFromAlbum
};
