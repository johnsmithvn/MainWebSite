// 📁 backend/routes/manga.js
// 🎌 Manga-specific routes

const express = require("express");
const router = express.Router();

// Import existing manga APIs
router.use("/", require("../api/manga/folder-cache"));
router.use("/", require("../api/manga/reset-cache"));
router.use("/", require("../api/manga/scan"));
router.use("/", require("../api/manga/favorite"));
router.use("/", require("../api/manga/root-thumbnail"));

module.exports = router;
