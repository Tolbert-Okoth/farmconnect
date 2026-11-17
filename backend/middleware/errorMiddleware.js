const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode) statusCode = err.statusCode;
  if (err.code === 'LIMIT_FILE_SIZE') statusCode = 400;
  res.status(statusCode);
  res.json({
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
    // Stack traces only in explicit development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
