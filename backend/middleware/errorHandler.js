function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error.",
  });
}

module.exports = { notFoundHandler, errorHandler };
