const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors || {}).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record',
      errors: [JSON.stringify(err.keyValue || {})],
    });
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
}

module.exports = errorHandler;
