const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { UnauthorizedError, NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');

const login = async (email, password) => {
  const result = await db.query(
    'SELECT id, matric_number, email, password, full_name, role, category FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  const token = generateToken(user);

  // Exclude password from returned user object
  const { password: _, ...userProfile } = user;

  return {
    user: userProfile,
    token
  };
};

const registerStudent = async ({ full_name, email, password, matric_number, category }) => {
  // Check duplicate email
  const emailCheck = await db.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  if (emailCheck.rows.length > 0) {
    throw new ConflictError('A user with this email address already exists.');
  }

  // Check duplicate matric number if provided
  if (matric_number) {
    const matricCheck = await db.query(
      'SELECT id FROM users WHERE LOWER(matric_number) = LOWER($1)',
      [matric_number]
    );
    if (matricCheck.rows.length > 0) {
      throw new ConflictError('A student with this matriculation number already exists.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const formattedCategory = (category || 'UNDERGRADUATE').toUpperCase();

  const insertResult = await db.query(
    `INSERT INTO users (full_name, email, password, matric_number, role, category)
     VALUES ($1, $2, $3, $4, 'STUDENT', $5)
     RETURNING id, matric_number, email, full_name, role, category, created_at`,
    [full_name.trim(), email.trim().toLowerCase(), hashedPassword, matric_number ? matric_number.trim().toUpperCase() : null, formattedCategory]
  );

  const newUser = insertResult.rows[0];
  const token = generateToken(newUser);

  return {
    user: newUser,
    token
  };
};

const getUserProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, matric_number, email, full_name, role, category, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User profile not found.');
  }

  return result.rows[0];
};

module.exports = {
  login,
  registerStudent,
  getUserProfile
};
