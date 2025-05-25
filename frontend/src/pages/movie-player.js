// 📄 movie-player.js
const urlParams = new URLSearchParams(window.location.search);
const file = urlParams.get("file");
const sourceKey = localStorage.getItem("sourceKey");
const src = `/api/video?key=${sourceKey}&file=${encodeURIComponent(file)}`;
document.getElementById("video-player").src = src;
// ✅ Gửi API tăng view cho video
if (file && sourceKey) {
  fetch("/api/increase-view/movie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: sourceKey, path: file }),
  }).catch((err) => {
    console.error("❌ Failed to increase view:", err);
  });
}
