// 📁 backend/utils/responseHelpers.js
// 📤 Response helper functions (không thay đổi logic cũ)

/**
 * 📤 Success response helper
 */
function sendSuccess(res, data, message = "Success") {
  return res.json({
    success: true,
    message,
    data
  });
}

/**
 * 📤 Error response helper
 */
function sendError(res, message = "Error", statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: message
  });
}

/**
 * 📤 Validation error helper
 */
function sendValidationError(res, message = "Validation Error") {
  return sendError(res, message, 400);
}

/**
 * 📤 Not found error helper
 */
function sendNotFound(res, message = "Not Found") {
  return sendError(res, message, 404);
}

/**
 * 📤 Server error helper
 */
function sendServerError(res, message = "Internal Server Error") {
  return sendError(res, message, 500);
}

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendServerError
};
