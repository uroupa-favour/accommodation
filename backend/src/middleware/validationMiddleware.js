const { BadRequestError } = require('../utils/errors');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validateUUID = (uuid) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return re.test(String(uuid));
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !validateEmail(email)) {
    return next(new BadRequestError('A valid email address is required.'));
  }
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return next(new BadRequestError('Password is required.'));
  }
  next();
};

const validateBookingInput = (req, res, next) => {
  const { spaceId } = req.body;
  if (!spaceId || !validateUUID(spaceId)) {
    return next(new BadRequestError('Valid spaceId (UUID) is required for booking.'));
  }
  next();
};

const validateHostelInput = (req, res, next) => {
  const { name, gender } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new BadRequestError('Hostel name is required.'));
  }
  if (!gender || !['MALE', 'FEMALE'].includes(gender.toUpperCase())) {
    return next(new BadRequestError('Hostel gender must be either MALE or FEMALE.'));
  }
  next();
};

const validateRoomInput = (req, res, next) => {
  const { hostel_id, room_number, category, capacity } = req.body;
  if (!hostel_id || !validateUUID(hostel_id)) {
    return next(new BadRequestError('Valid hostel_id (UUID) is required.'));
  }
  if (!room_number || typeof room_number !== 'string' || room_number.trim() === '') {
    return next(new BadRequestError('Room number is required.'));
  }
  if (!category || !['PREDEGREE', 'UNDERGRADUATE'].includes(category.toUpperCase())) {
    return next(new BadRequestError('Room category must be either PREDEGREE or UNDERGRADUATE.'));
  }
  const capInt = parseInt(capacity, 10);
  if (isNaN(capInt) || capInt < 1 || capInt > 20) {
    return next(new BadRequestError('Room capacity must be a positive integer between 1 and 20.'));
  }
  next();
};

const validateAllocationInput = (req, res, next) => {
  const { student_id, space_id } = req.body;
  if (!student_id || !validateUUID(student_id)) {
    return next(new BadRequestError('Valid student_id (UUID) is required.'));
  }
  if (!space_id || !validateUUID(space_id)) {
    return next(new BadRequestError('Valid space_id (UUID) is required.'));
  }
  next();
};

module.exports = {
  validateEmail,
  validateUUID,
  validateLoginInput,
  validateBookingInput,
  validateHostelInput,
  validateRoomInput,
  validateAllocationInput
};
