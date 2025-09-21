const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { message, extra } = req.body;
  // Ở đây bạn có thể lưu vào DB, file, hoặc in ra console
  console.log("[CLIENT LOG]:", message, extra || "");
  res.json({ success: true });
});

module.exports = router;
