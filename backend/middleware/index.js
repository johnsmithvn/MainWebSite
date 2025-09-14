// 📁 backend/middleware/index.js
// 🛡️ Middleware tổng quát - Proper Express.js middleware order

const express = require("express");
const compression = require("compression");
const { SECURITY } = require("../constants");
const corsMiddleware = require("./cors");
const authMiddleware = require("./auth");
const securityMiddleware = require("./security");
const { errorHandler } = require("./errorHandler");
const rateLimiter = require("./rateLimiter");

/**
 * 🔧 Setup core middleware (proper Express.js order)
 * Must be called BEFORE routes are defined
 */
function setupMiddleware(app) {
  // 1. CORS - Must be FIRST to handle preflight OPTIONS requests
  app.use(corsMiddleware);
  
  // 2. Body parsing - Parse JSON/form data from requests
  app.use(express.json({ limit: SECURITY.MAX_REQUEST_SIZE }));
  app.use(express.urlencoded({ extended: true, limit: SECURITY.MAX_REQUEST_SIZE }));
  
  // 3. Compression - Compress responses to reduce bandwidth
  app.use(compression());
  
  // 4. Rate limiting - Limit requests per IP/user (disabled in development)
  if (process.env.NODE_ENV === 'production') {
    console.log('🚦 Rate limiting enabled (production mode)');
    app.use(rateLimiter);
  } else {
    console.log('🔧 Rate limiting disabled (development mode)');
  }
  
  // 5. Authentication - Check IP/hostname whitelist
  app.use(authMiddleware);
  
  // 6. Security - Check auth tokens for secure endpoints
  app.use(securityMiddleware);
}

/**
 * 🚨 Setup error handling middleware
 * Must be called AFTER all routes are defined
 */
function setupErrorHandling(app) {
  // Error handler must be LAST middleware to catch all errors
  app.use(errorHandler);
}

module.exports = { 
  setupMiddleware, 
  setupErrorHandling 
};
