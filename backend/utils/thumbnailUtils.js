// 📁 backend/utils/thumbnailUtils.js
// 🖼️ Thumbnail utility functions

const fs = require("fs");
const path = require("path");
const { FILE_EXTENSIONS } = require("../constants");

/**
 * 🔍 Find thumbnail file in directory
 */
function findThumbnail(thumbnailDir, baseName) {
  if (!fs.existsSync(thumbnailDir)) return null;
  
  const extensions = FILE_EXTENSIONS.IMAGE;
  
  for (const ext of extensions) {
    const thumbPath = path.join(thumbnailDir, `${baseName}${ext}`);
    if (fs.existsSync(thumbPath)) {
      return path.posix.join(".thumbnail", `${baseName}${ext}`);
    }
  }
  
  return null;
}

/**
 * 🔍 Find first image in directory recursively
 */
function findFirstImageRecursively(rootName, rootPath, folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    // First, look for images in current directory
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (FILE_EXTENSIONS.IMAGE.includes(ext)) {
          const relativePath = path.relative(rootPath, path.join(folderPath, entry.name));
          return `/manga/${rootName}/${relativePath.replace(/\\/g, "/")}`;
        }
      }
    }
    
    // Then, look in subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== ".thumbnail") {
        const subPath = path.join(folderPath, entry.name);
        const result = findFirstImageRecursively(rootName, rootPath, subPath);
        if (result) return result;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️ Error finding image in ${folderPath}:`, error.message);
    return null;
  }
}

/**
 * 🔍 Check if directory has images recursively
 */
function hasImageRecursively(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    // Check for images in current directory
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (FILE_EXTENSIONS.IMAGE.includes(ext)) {
          return true;
        }
      }
    }
    
    // Check subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== ".thumbnail") {
        const subPath = path.join(folderPath, entry.name);
        if (hasImageRecursively(subPath)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

module.exports = {
  findThumbnail,
  findFirstImageRecursively,
  hasImageRecursively
};
