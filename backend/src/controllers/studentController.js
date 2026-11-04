const studentService = require('../services/studentService');

const getRooms = async (req, res, next) => {
  try {
    const category = req.user.category;
    const rooms = await studentService.getAvailableRooms(category);
    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const studentCategory = req.user.category;
    const { spaceId, paymentRef, amountPaid } = req.body;

    const booking = await studentService.createBooking(studentId, studentCategory, spaceId, paymentRef, amountPaid);
    res.status(201).json({
      success: true,
      message: 'Accommodation fee payment verified and bed space reservation request submitted successfully.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const bookings = await studentService.getMyBookings(studentId);
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id: bookingId } = req.params;

    const result = await studentService.cancelBooking(bookingId, studentId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  createBooking,
  getMyBookings,
  cancelBooking
};
