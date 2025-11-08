// 📁 backend/api/manga/pdf.js
// 📄 API serve PDF files cho manga reader

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getRootPath } = require("../../utils/config");

/**
 * 🎯 API: Serve PDF file
 * GET /api/manga/pdf?key=...&root=...&path=...
 */
router.get("/pdf", async (req, res) => {
  const { key, root, path: pdfPath } = req.query;

  // Validate input
  if (!key || !root || !pdfPath) {
    return res.status(400).json({ error: "Missing key, root, or path" });
  }

  try {
    const rootPath = getRootPath(key);
    if (!rootPath) {
      return res.status(400).json({ error: "Invalid root" });
    }

    const fullPath = path.join(rootPath, root, pdfPath);

    // Security check: ensure path is within root directory
    if (!fullPath.startsWith(path.join(rootPath, root))) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists and is a PDF
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "PDF file not found" });
    }

    const ext = path.extname(fullPath).toLowerCase();
    if (ext !== ".pdf") {
      return res.status(400).json({ error: "Not a PDF file" });
    }

    // Get file stats for proper headers
    const stats = fs.statSync(fullPath);

    // Set appropriate headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": stats.size,
      "Content-Disposition": `inline; filename="${encodeURIComponent(path.basename(fullPath))}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    });

    // Stream the PDF file
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("❌ Error streaming PDF:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming PDF" });
      }
    });
  } catch (err) {
    console.error("❌ Error serving PDF:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
