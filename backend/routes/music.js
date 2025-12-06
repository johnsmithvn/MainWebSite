// 📁 backend/routes/music.js
// 🎵 Music-specific routes

const express = require("express");
const router = express.Router();

// Import existing music APIs
router.use("/", require("../api/music/scan-music"));
router.use("/", require("../api/music/music-folder"));
router.use("/", require("../api/music/audio"));
router.use("/", require("../api/music/audio-cache"));
router.use("/", require("../api/music/download"));
router.use("/", require("../api/music/playlist"));
router.use("/", require("../api/music/music-meta"));
router.use("/", require("../api/music/update-lyrics"));
router.use("/", require("../api/music/reset-music-db"));
router.use("/", require("../api/music/extract-thumbnail"));
router.use("/", require("../api/music/set-thumbnail"));
router.use("/", require("../api/music/delete-item"));

module.exports = router;
