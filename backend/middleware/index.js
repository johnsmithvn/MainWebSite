// 📁 backend/middleware/index.js
// 🛡️ Middleware tổng quát

const express = require("express");
const compression = require("compression");
const { SECURITY } = require("../constants");
const authMiddleware = require("./auth");
const securityMiddleware = require("./security");
const errorHandler = require("./errorHandler");
const rateLimiter = require("./rateLimiter");

/**
 * 🔧 Setup all middleware
 */
function setupMiddleware(app) {
  // Body parsing
  app.use(express.json({ limit: SECURITY.MAX_REQUEST_SIZE }));
  app.use(express.urlencoded({ extended: true, limit: SECURITY.MAX_REQUEST_SIZE }));
  
  // Compression
  app.use(compression());
  
  // Rate limiting
  app.use(rateLimiter);
  
  // Security
  app.use(authMiddleware);
  app.use(securityMiddleware);
  
  // Error handling (must be last)
  app.use(errorHandler);
}

module.exports = { setupMiddleware };
