const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { 
  validateHostelInput, 
  validateRoomInput, 
  validateAllocationInput 
} = require('../middleware/validationMiddleware');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/hostels', adminController.getHostels);
router.post('/hostels', validateHostelInput, adminController.createHostel);
router.get('/rooms', adminController.getRooms);
router.post('/rooms', validateRoomInput, adminController.createRoom);
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/approve', adminController.approveBooking);
router.post('/bookings/:id/approve', adminController.approveBooking);
router.put('/bookings/:id/reject', adminController.rejectBooking);
router.post('/bookings/:id/reject', adminController.rejectBooking);
router.post('/allocate', validateAllocationInput, adminController.manualAllocate);
router.put('/spaces/:spaceId/deallocate', adminController.manualDeallocate);
router.post('/spaces/:spaceId/deallocate', adminController.manualDeallocate);

module.exports = router;
