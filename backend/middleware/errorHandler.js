export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      status: err.status || 500
    }
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}
