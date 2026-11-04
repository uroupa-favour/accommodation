const adminService = require('../services/adminService');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

const createHostel = async (req, res, next) => {
  try {
    const { name, gender, description } = req.body;
    const hostel = await adminService.createHostel(name, gender, description);
    res.status(201).json({
      success: true,
      message: 'Hostel created successfully.',
      data: hostel
    });
  } catch (err) {
    next(err);
  }
};

const getHostels = async (req, res, next) => {
  try {
    const hostels = await adminService.getAllHostels();
    res.status(200).json({
      success: true,
      data: hostels
    });
  } catch (err) {
    next(err);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { hostel_id, room_number, category, capacity } = req.body;
    const room = await adminService.createRoomWithSpaces(hostel_id, room_number, category, capacity);
    res.status(201).json({
      success: true,
      message: 'Room and spaces created successfully.',
      data: room
    });
  } catch (err) {
    next(err);
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await adminService.getAllRooms();
    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (err) {
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const bookings = await adminService.getAllBookings(status);
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const adminId = req.user.id;
    const result = await adminService.approveBooking(bookingId, adminId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const result = await adminService.rejectBooking(bookingId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const manualAllocate = async (req, res, next) => {
  try {
    const { student_id, space_id } = req.body;
    const adminId = req.user.id;
    const result = await adminService.manualAllocate(student_id, space_id, adminId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const manualDeallocate = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const result = await adminService.manualDeallocate(spaceId);
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
  getDashboardStats,
  createHostel,
  getHostels,
  createRoom,
  getRooms,
  getBookings,
  approveBooking,
  rejectBooking,
  manualAllocate,
  manualDeallocate
};
