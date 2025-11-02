/**
 * Health Check API Endpoint
 * Provides server health status without authentication requirements
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Simple health check endpoint for client connectivity testing
 * 
 * @returns {Object} Health status and basic system info
 */
router.get('/', (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'MainWebSite Backend',
      version: '1.0.0'
    };

    // Set cache headers to prevent caching of health checks
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
});

/**
 * HEAD /api/health
 * Lightweight health check for basic connectivity testing
 * Used by frontend for server accessibility checks
 */
router.head('/', (req, res) => {
  try {
    // Set cache headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).end();
  } catch (error) {
    console.error('Health check (HEAD) failed:', error);
    res.status(500).end();
  }
});

module.exports = router;