const { AppError } = require('../Utils/appError');

function validationErrorMessage(error) {
  const fields = Object.keys(error.errors || {});
  return fields.length
    ? `Invalid value for: ${fields.join(', ')}`
    : 'Validation failed';
}

function duplicateKeyMessage(error) {
  const fields = Object.keys(error.keyPattern || error.keyValue || {});
  if (fields.length === 1) return `A record with this ${fields[0]} already exists`;
  return 'A record with the supplied unique value already exists';
}

function errorHandler(error, _request, response, _next) {
  console.error(error);

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ message: error.message });
  }

  if (error?.name === 'ValidationError') {
    return response.status(400).json({ message: validationErrorMessage(error) });
  }

  if (error?.name === 'CastError') {
    return response.status(400).json({ message: `Invalid ${error.path || 'value'}` });
  }

  if (error?.code === 11000) {
    return response.status(409).json({ message: duplicateKeyMessage(error) });
  }

  if (error?.type === 'entity.parse.failed' || (error instanceof SyntaxError && 'body' in error)) {
    return response.status(400).json({ message: 'Invalid JSON body' });
  }

  if (error?.name === 'MulterError') {
    const multerMessages = {
      LIMIT_FILE_SIZE: 'Uploaded file exceeds the 5 MB limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected upload field',
    };
    return response.status(400).json({
      message: multerMessages[error.code] || 'Invalid file upload',
    });
  }

  return response.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };
