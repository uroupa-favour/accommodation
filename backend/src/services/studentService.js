const db = require('../config/db');
const { 
  ConflictError, 
  NotFoundError, 
  ForbiddenError, 
  BadRequestError 
} = require('../utils/errors');

/**
 * Fetch available rooms restricted strictly to the student's category
 */
const getAvailableRooms = async (studentCategory) => {
  if (!studentCategory) {
    throw new BadRequestError('Student category is missing.');
  }

  // PostgreSQL query to fetch rooms belonging ONLY to student category
  const sql = `
    SELECT 
      r.id AS room_id,
      r.room_number,
      r.category,
      r.capacity,
      COALESCE(r.price, 120000.00) AS price,
      h.id AS hostel_id,
      h.name AS hostel_name,
      h.gender AS hostel_gender,
      h.description AS hostel_description,
      COUNT(s.id) FILTER (WHERE s.status = 'AVAILABLE')::INTEGER AS available_spaces_count
    FROM rooms r
    JOIN hostels h ON r.hostel_id = h.id
    LEFT JOIN spaces s ON s.room_id = r.id
    WHERE r.category = $1
    GROUP BY r.id, r.room_number, r.category, r.capacity, r.price, h.id, h.name, h.gender, h.description
    HAVING COUNT(s.id) FILTER (WHERE s.status = 'AVAILABLE') > 0
    ORDER BY h.name, r.room_number;
  `;

  const roomsResult = await db.query(sql, [studentCategory]);

  // For each room, fetch its individual spaces
  const rooms = await Promise.all(roomsResult.rows.map(async (room) => {
    const spacesResult = await db.query(
      `SELECT id, space_number, status, version 
       FROM spaces 
       WHERE room_id = $1 AND status = 'AVAILABLE' 
       ORDER BY space_number`,
      [room.room_id]
    );

    return {
      id: room.room_id,
      room_number: room.room_number,
      category: room.category,
      capacity: room.capacity,
      price: room.price || (room.category === 'PREDEGREE' ? 120000 : 150000),
      hostel_id: room.hostel_id,
      hostel_name: room.hostel_name,
      hostel_gender: room.hostel_gender,
      hostel_description: room.hostel_description,
      available_count: room.available_spaces_count || spacesResult.rows.length,
      spaces: spacesResult.rows
    };
  }));

  return rooms;
};

/**
 * Execute transactional space reservation with payment verification using FOR UPDATE locking
 */
const createBooking = async (studentId, studentCategory, spaceId, paymentRef = null, amountPaid = null) => {
  const client = await db.getClient();

  try {
    // Step 1: Start Transaction
    await client.query('BEGIN');

    // Step 2: Check for existing active booking (PENDING or APPROVED)
    const activeBookingCheck = await client.query(
      `SELECT id, status FROM bookings 
       WHERE student_id = $1 AND status IN ('PENDING', 'APPROVED')`,
      [studentId]
    );

    if (activeBookingCheck.rows.length > 0) {
      throw new ConflictError(
        `You already have an active ${activeBookingCheck.rows[0].status.toLowerCase()} booking. You cannot make another booking.`
      );
    }

    // Step 3: Row-level Lock (FOR UPDATE) on the requested space
    const spaceLockResult = await client.query(
      `SELECT s.id, s.room_id, s.space_number, s.status, s.version, r.category AS room_category, r.room_number, COALESCE(r.price, 120000.00) AS price, h.name AS hostel_name
       FROM spaces s
       JOIN rooms r ON s.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE s.id = $1
       FOR UPDATE`,
      [spaceId]
    );

    if (spaceLockResult.rows.length === 0) {
      throw new NotFoundError('The selected accommodation space does not exist.');
    }

    const space = spaceLockResult.rows[0];

    // Step 4: Verify Space Availability
    if (space.status !== 'AVAILABLE') {
      throw new ConflictError('The selected space is no longer available. Please select another space.');
    }

    // Step 5: Verify Student Category Restriction
    if (space.room_category !== studentCategory) {
      throw new ForbiddenError(
        `Category Mismatch: Your category (${studentCategory}) does not match this room category (${space.room_category}).`
      );
    }

    const finalPrice = amountPaid || space.price || (studentCategory === 'PREDEGREE' ? 120000 : 150000);
    const finalRef = paymentRef || `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Step 6: Create Booking record with PAID payment status & PENDING admin review
    const bookingResult = await client.query(
      `INSERT INTO bookings (student_id, space_id, status, payment_status, amount_paid, payment_ref, paid_at)
       VALUES ($1, $2, 'PENDING', 'PAID', $3, $4, NOW())
       RETURNING id, student_id, space_id, status, payment_status, amount_paid, payment_ref, paid_at, created_at`,
      [studentId, spaceId, finalPrice, finalRef]
    );

    const booking = bookingResult.rows[0];

    // Step 7: Update Space status to RESERVED
    await client.query(
      `UPDATE spaces 
       SET status = 'RESERVED', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [spaceId]
    );

    // Step 8: Commit Transaction
    await client.query('COMMIT');

    return {
      ...booking,
      space_number: space.space_number,
      room_number: space.room_number,
      room_category: space.room_category,
      hostel_name: space.hostel_name
    };
  } catch (err) {
    // Rollback on any failure
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Retrieve booking history & current booking for logged in student
 */
const getMyBookings = async (studentId) => {
  const sql = `
    SELECT 
      b.id,
      b.student_id,
      b.space_id,
      b.status,
      COALESCE(b.payment_status, 'PAID') AS payment_status,
      COALESCE(b.amount_paid, 120000.00) AS amount_paid,
      b.payment_ref,
      b.paid_at,
      b.created_at,
      b.approved_at,
      u_app.full_name AS approved_by_name,
      s.space_number,
      r.room_number,
      r.category AS room_category,
      h.name AS hostel_name
    FROM bookings b
    JOIN spaces s ON b.space_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hostels h ON r.hostel_id = h.id
    LEFT JOIN users u_app ON b.approved_by = u_app.id
    WHERE b.student_id = $1
    ORDER BY b.created_at DESC;
  `;

  const result = await db.query(sql, [studentId]);
  return result.rows;
};

/**
 * Cancel a PENDING booking owned by the authenticated student
 */
const cancelBooking = async (bookingId, studentId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Step 1: Lock booking record for update
    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new NotFoundError('Booking record not found.');
    }

    const booking = bookingResult.rows[0];

    // Step 2: Verify ownership
    if (booking.student_id !== studentId) {
      throw new ForbiddenError('You are not authorized to cancel another student\'s booking.');
    }

    // Step 3: Verify PENDING status
    if (booking.status !== 'PENDING') {
      throw new ConflictError(`Cannot cancel booking with status '${booking.status}'. Only PENDING bookings can be cancelled.`);
    }

    // Step 4: Lock space for update
    const spaceId = booking.space_id;
    await client.query(`SELECT * FROM spaces WHERE id = $1 FOR UPDATE`, [spaceId]);

    // Step 5: Update booking status to CANCELLED
    await client.query(
      `UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`,
      [bookingId]
    );

    // Step 6: Release space back to AVAILABLE
    await client.query(
      `UPDATE spaces 
       SET status = 'AVAILABLE', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [spaceId]
    );

    await client.query('COMMIT');

    return {
      id: bookingId,
      status: 'CANCELLED',
      message: 'Booking successfully cancelled and space returned to AVAILABLE status.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

module.exports = {
  getAvailableRooms,
  createBooking,
  getMyBookings,
  cancelBooking
};
