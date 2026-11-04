const { ForbiddenError } = require('../utils/errors');

const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return next(new ForbiddenError('Access restricted to authenticated students only.'));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Access restricted to authenticated system administrators only.'));
  }
  next();
};

module.exports = {
  requireStudent,
  requireAdmin
};
