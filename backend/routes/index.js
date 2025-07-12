// 📁 backend/routes/index.js
// 🛣️ Centralized Route Manager

const express = require("express");
const mangaRoutes = require("./manga");
const movieRoutes = require("./movie");
const musicRoutes = require("./music");
const systemRoutes = require("./system");

const router = express.Router();

// Mount route modules
router.use("/manga", mangaRoutes);
router.use("/movie", movieRoutes);
router.use("/music", musicRoutes);
router.use("/", systemRoutes);

module.exports = router;
