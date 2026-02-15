// 📁 backend/routes/media.js
// 🎨 Media Gallery Routes (Google Photos-like)

const express = require("express");
const router = express.Router();

// Import API handlers
const scanMedia = require("../api/media/scan-media");
const mediaFolder = require("../api/media/media-folder");
const mediaFolders = require("../api/media/media-folders");
const favoriteMedia = require("../api/media/favorite-media");
const resetMediaDb = require("../api/media/reset-media-db");
const setThumbnail = require("../api/media/set-thumbnail");
const mediaCache = require("../api/media/media-cache");
const albumManager = require("../api/media/album-manager");
const mediaStats = require("../api/media/media-stats");
const deleteItem = require("../api/media/delete-item");

// Media scan & folder routes
router.post("/scan-media", scanMedia);
router.get("/media-folder", mediaFolder);
router.get("/media-folders", mediaFolders); // NEW: Folder navigation
router.post("/favorite-media", favoriteMedia);
router.post("/reset-media-db", resetMediaDb);
router.post("/set-thumbnail", setThumbnail);
router.get("/cache/:filename", mediaCache); // /:filename param needed
router.delete("/delete-item", deleteItem); // Delete media item or folder

// Album management routes
router.get("/albums", (req, res) => albumManager.getAlbums(req, res));
router.post("/albums", (req, res) => albumManager.createAlbum(req, res));
router.put("/albums/:id", (req, res) => albumManager.updateAlbum(req, res));
router.delete("/albums/:id", (req, res) => albumManager.deleteAlbum(req, res));
router.post("/albums/:id/items", (req, res) => albumManager.addItemsToAlbum(req, res));
router.delete("/albums/:id/items", (req, res) => albumManager.removeItemsFromAlbum(req, res));

// Stats & timeline
router.get("/stats", mediaStats);

module.exports = router;
