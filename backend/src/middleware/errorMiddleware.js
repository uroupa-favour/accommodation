const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Handle specific PostgreSQL error codes
  if (err.code === '23505') { // Unique constraint violation
    statusCode = 409;
    if (err.constraint && err.constraint.includes('one_active_booking')) {
      message = 'Student or Space already has an active pending or approved booking.';
    } else {
      message = 'A duplicate record already exists.';
    }
  } else if (err.code === '23503') { // Foreign key constraint
    statusCode = 400;
    message = 'Referenced record does not exist.';
  } else if (err.code === '22P02') { // Invalid text representation (UUID)
    statusCode = 400;
    message = 'Invalid UUID format provided.';
  }

  // Log error internally in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorMiddleware;
