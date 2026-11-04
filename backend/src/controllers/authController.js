const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { full_name, email, password, matric_number, category } = req.body;
    const data = await authService.registerStudent({ full_name, email, password, matric_number, category });
    res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  getMe
};
