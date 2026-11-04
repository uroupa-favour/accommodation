const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid format.');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token.');
    }

    // Always fetch authoritative user record from DB (Never trust cached claims alone)
    const userResult = await db.query('SELECT id, matric_number, email, full_name, role, category, created_at FROM users WHERE id = $1', [decoded.id]);
    
    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('Authenticated user record no longer exists.');
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authenticateToken
};
