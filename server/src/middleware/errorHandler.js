export default function errorHandler(config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    let status = err.status || err.statusCode || 500;
    let code = err.code && typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
    let message = err.message;
    if (err.type === 'entity.too.large') { status = 413; code = 'BODY_TOO_LARGE'; message = 'Request body is too large.'; }
    else if (err.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body.'; }
    else if (err.name === 'CastError' || err.name === 'ValidationError') { status = 400; code = 'INVALID_INPUT'; message = 'Invalid input.'; }
    else if (err.code === 11000) { status = 409; code = 'DUPLICATE'; message = 'Resource already exists.'; }
    else if (['MongoNetworkError', 'MongooseServerSelectionError', 'MongoServerSelectionError'].includes(err.name)) {
      status = 503; code = 'DB_UNAVAILABLE'; message = 'Database is unavailable.';
    }
    if (status >= 500) {
      console.error(`[error] ${req.method} ${req.path} -> ${status} ${err.name}: ${err.message}`);
      if (config.isProduction || status === 500) message = status === 503 ? message : 'Internal server error.';
    }
    const body = { error: { code, message } };
    if (!config.isProduction && status >= 500 && err.stack) body.error.stack = err.stack;
    res.status(status).json(body);
  };
}
