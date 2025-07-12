// 📁 backend/middleware/errorHandler.js
// 🚨 Global Error Handler

const { API_RESPONSE } = require("../constants");

/**
 * 🚨 Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`❌ Error in ${req.method} ${req.path}:`, err);
  
  // Default error response
  let status = 500;
  let message = "Internal Server Error";
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = "Validation Error";
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = "Unauthorized";
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = "Not Found";
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = "File or directory not found";
  } else if (err.code === 'EACCES') {
    status = 403;
    message = "Access denied";
  }
  
  // Send error response
  res.status(status).json(API_RESPONSE.ERROR(message, status));
}

/**
 * 🚨 Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 🚨 Create custom error
 */
function createError(message, statusCode = 500, name = 'Error') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  return error;
}

module.exports = { 
  errorHandler, 
  asyncHandler, 
  createError 
};
