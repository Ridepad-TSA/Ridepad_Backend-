const { AppError } = require('../Utils/appError');

function errorHandler(error, _request, response, _next) {
  console.error(error);

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ message: error.message });
  }

  return response.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };