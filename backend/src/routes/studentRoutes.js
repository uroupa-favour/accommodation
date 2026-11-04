const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireStudent } = require('../middleware/roleMiddleware');
const { validateBookingInput } = require('../middleware/validationMiddleware');

// All student routes require authentication and student role
router.use(authenticateToken);
router.use(requireStudent);

router.get('/rooms', studentController.getRooms);
router.post('/bookings', validateBookingInput, studentController.createBooking);
router.get('/bookings', studentController.getMyBookings);
router.put('/bookings/:id/cancel', studentController.cancelBooking);
router.post('/bookings/:id/cancel', studentController.cancelBooking); // Fallback method

module.exports = router;
