const { AppError } = require('../Utils/appError');
const { verifyToken } = require('../utils/jwt');

function authenticate(request, _response, next) {
  const header = request.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return next(new AppError(401, 'Authentication token is required'));
  }

  try {
    request.user = verifyToken(token);
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired authentication token'));
  }
}

function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
