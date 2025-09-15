// 📁 backend/utils/stringUtils.js
// 🧰 String utility functions

/**
 * 🔧 Parse comma-separated string into array
 * Thay thế cho code lặp lại: .split(",").map(s => s.trim()).filter(Boolean)
 * 
 * @param {string} str - Comma-separated string
 * @param {string} delimiter - Delimiter to split by (default: comma)
 * @returns {string[]} - Array of trimmed, non-empty strings
 * 
 * @example
 * parseCommaSeparatedList("a, b , c,  ,d") // ["a", "b", "c", "d"]
 * parseCommaSeparatedList("") // []
 * parseCommaSeparatedList("single") // ["single"]
 */
function parseCommaSeparatedList(str, delimiter = ",") {
  if (!str || typeof str !== 'string') {
    return [];
  }
  
  return str
    .split(delimiter)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * 🔧 Parse environment variable as comma-separated list
 * Wrapper cho parseCommaSeparatedList với fallback cho undefined env vars
 * 
 * @param {string|undefined} envVar - Environment variable value
 * @param {string} delimiter - Delimiter to split by (default: comma)
 * @returns {string[]} - Array of trimmed, non-empty strings
 * 
 * @example
 * parseEnvList(process.env.ALLOWED_IPS) // ["127.0.0.1", "192.168.1.1"]
 * parseEnvList(undefined) // []
 */
function parseEnvList(envVar, delimiter = ",") {
  return parseCommaSeparatedList(envVar || "", delimiter);
}

/**
 * 🔧 Join array back to comma-separated string
 * Utility để convert ngược lại thành string
 * 
 * @param {string[]} arr - Array of strings
 * @param {string} delimiter - Delimiter to join with (default: comma + space)
 * @returns {string} - Joined string
 * 
 * @example
 * joinCommaSeparatedList(["a", "b", "c"]) // "a, b, c"
 */
function joinCommaSeparatedList(arr, delimiter = ", ") {
  if (!Array.isArray(arr)) {
    return "";
  }
  
  return arr
    .filter(Boolean)
    .join(delimiter);
}

module.exports = {
  parseCommaSeparatedList,
  parseEnvList,
  joinCommaSeparatedList
};
