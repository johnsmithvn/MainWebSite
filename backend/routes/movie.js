// 📁 backend/routes/movie.js
// 🎬 Movie-specific routes

const express = require("express");
const router = express.Router();

// Import existing movie APIs
router.use("/", require("../api/movie/movie-folder"));
router.use("/", require("../api/movie/video"));
router.use("/", require("../api/movie/movie-folder-empty"));
router.use("/", require("../api/movie/scan-movie"));
router.use("/", require("../api/movie/reset-movie-db"));
router.use("/", require("../api/movie/video-cache"));
router.use("/", require("../api/movie/favorite-movie"));
router.use("/", require("../api/movie/extract-movie-thumbnail"));
router.use("/", require("../api/movie/set-thumbnail"));

module.exports = router;
