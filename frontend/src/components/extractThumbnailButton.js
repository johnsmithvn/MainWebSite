import { getSourceKey } from "/src/core/storage.js";
import { showConfirm, showToast, withLoading } from "/src/core/ui.js";

/**
 * Setup handler for the "extract-thumbnail-btn" button.
 * Options:
 *  - confirmText: text shown in confirmation dialog
 *  - noSourceMessage: toast message when source key is missing
 *  - onExtract: async function(sourceKey, currentPath) performing the extraction
 *  - getCurrentPath: function returning current folder path
 */
export function setupExtractThumbnailButton({
  confirmText,
  noSourceMessage = "❌ Không xác định được nguồn!",
  onExtract,
  getCurrentPath,
}) {
  const extractBtn = document.getElementById("extract-thumbnail-btn");
  if (!extractBtn || typeof onExtract !== "function") return;

  extractBtn.onclick = withLoading(async () => {
    const ok = await showConfirm(confirmText);
    if (!ok) return;

    const sourceKey = getSourceKey();
    if (!sourceKey) {
      showToast(noSourceMessage);
      return;
    }

    const path = typeof getCurrentPath === "function" ? getCurrentPath() : "";

    try {
      await onExtract(sourceKey, path);
    } catch (err) {
      showToast("❌ Lỗi extract thumbnail!");
      console.error(err);
    }
  });
}


