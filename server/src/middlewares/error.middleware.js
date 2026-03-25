export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? "Internal server error";

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

