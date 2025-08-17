// 📁 backend/utils/urlUtils.js
// 🔧 URL utility functions

/**
 * 🔄 URL decode middleware factory
 * @param {string} pathPrefix - Path prefix for logging (e.g., "manga", "video", "audio")
 * @returns {Function} Express middleware function
 */
function createUrlDecodeMiddleware(pathPrefix = "url") {
  return (req, res, next) => {
    try {
      const decodedPath = req.url
        .split("/")
        .map((part) => {
          try {
            return decodeURIComponent(part);
          } catch {
            return part;
          }
        })
        .join("/");
      req.url = decodedPath;
    } catch (e) {
      console.error(`❌ Error decoding ${pathPrefix} URL:`, e);
      return res.status(400).send("Bad Request");
    }
    next();
  };
}

module.exports = {
  createUrlDecodeMiddleware
};
