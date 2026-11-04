const db = require('../config/db');
const { 
  ConflictError, 
  NotFoundError, 
  ForbiddenError, 
  BadRequestError 
} = require('../utils/errors');

/**
 * Fetch Administrative Dashboard Statistics
 */
const getDashboardStats = async () => {
  const statsQuery = `
    SELECT
      (SELECT COUNT(*)::INTEGER FROM users WHERE role = 'STUDENT') AS total_students,
      (SELECT COUNT(*)::INTEGER FROM hostels) AS total_hostels,
      (SELECT COUNT(*)::INTEGER FROM rooms) AS total_rooms,
      (SELECT COUNT(*)::INTEGER FROM spaces) AS total_spaces,
      (SELECT COUNT(*)::INTEGER FROM spaces WHERE status = 'AVAILABLE') AS available_spaces,
      (SELECT COUNT(*)::INTEGER FROM spaces WHERE status = 'RESERVED') AS reserved_spaces,
      (SELECT COUNT(*)::INTEGER FROM spaces WHERE status = 'OCCUPIED') AS occupied_spaces,
      (SELECT COUNT(*)::INTEGER FROM bookings WHERE status = 'PENDING') AS pending_bookings,
      (SELECT COUNT(*)::INTEGER FROM bookings WHERE status = 'APPROVED') AS approved_bookings,
      (SELECT COUNT(*)::INTEGER FROM bookings WHERE status = 'REJECTED') AS rejected_bookings,
      (SELECT COUNT(*)::INTEGER FROM bookings WHERE status = 'CANCELLED') AS cancelled_bookings,
      (SELECT COALESCE(SUM(amount_paid), 0)::NUMERIC FROM bookings WHERE payment_status = 'PAID') AS total_revenue,
      (SELECT COUNT(*)::INTEGER FROM bookings WHERE payment_status = 'PAID') AS paid_bookings;
  `;

  const result = await db.query(statsQuery);
  if (result.rows.length === 0) {
    return await db.query('SELECT dashboard_stats').then(res => res.rows[0]);
  }
  return result.rows[0];
};

/**
 * Create a Hostel
 */
const createHostel = async (name, gender, description) => {
  const result = await db.query(
    `INSERT INTO hostels (name, gender, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, gender, description, created_at`,
    [name.trim(), gender.toUpperCase(), description ? description.trim() : null]
  );
  return result.rows[0];
};

/**
 * Create a Room and automatically generate its individual spaces
 */
const createRoomWithSpaces = async (hostelId, roomNumber, category, capacity) => {
  const client = await db.getClient();
  const capInt = parseInt(capacity, 10);

  try {
    await client.query('BEGIN');

    // Check hostel exists
    const hostelCheck = await client.query('SELECT id, name FROM hostels WHERE id = $1', [hostelId]);
    if (hostelCheck.rows.length === 0) {
      throw new NotFoundError('Selected hostel does not exist.');
    }

    // Check unique constraint for room_number in hostel
    const roomCheck = await client.query(
      'SELECT id FROM rooms WHERE hostel_id = $1 AND room_number = $2',
      [hostelId, roomNumber.trim()]
    );
    if (roomCheck.rows.length > 0) {
      throw new ConflictError(`Room '${roomNumber.trim()}' already exists in this hostel.`);
    }

    // Create Room
    const roomResult = await client.query(
      `INSERT INTO rooms (hostel_id, room_number, category, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, hostel_id, room_number, category, capacity, created_at`,
      [hostelId, roomNumber.trim(), category.toUpperCase(), capInt]
    );
    const room = roomResult.rows[0];

    // Automatically generate spaces (Space 1, Space 2, ... Space N)
    const generatedSpaces = [];
    for (let i = 1; i <= capInt; i++) {
      const spaceNum = `Space ${i}`;
      const spaceResult = await client.query(
        `INSERT INTO spaces (room_id, space_number, status)
         VALUES ($1, $2, 'AVAILABLE')
         RETURNING id, room_id, space_number, status, version`,
        [room.id, spaceNum]
      );
      generatedSpaces.push(spaceResult.rows[0]);
    }

    await client.query('COMMIT');

    return {
      ...room,
      hostel_name: hostelCheck.rows[0].name,
      spaces: generatedSpaces
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Get all rooms with space counts & availability breakdown
 */
const getAllRooms = async () => {
  const sql = `
    SELECT 
      r.id,
      r.hostel_id,
      h.name AS hostel_name,
      r.room_number,
      r.category,
      r.capacity,
      COUNT(s.id) FILTER (WHERE s.status = 'AVAILABLE')::INTEGER AS available_count,
      COUNT(s.id) FILTER (WHERE s.status = 'RESERVED')::INTEGER AS reserved_count,
      COUNT(s.id) FILTER (WHERE s.status = 'OCCUPIED')::INTEGER AS occupied_count
    FROM rooms r
    JOIN hostels h ON r.hostel_id = h.id
    LEFT JOIN spaces s ON s.room_id = r.id
    GROUP BY r.id, r.hostel_id, h.name, r.room_number, r.category, r.capacity
    ORDER BY h.name, r.room_number;
  `;

  const roomsResult = await db.query(sql);

  const rooms = await Promise.all(roomsResult.rows.map(async (room) => {
    const spacesResult = await db.query(
      `SELECT id, space_number, status, version 
       FROM spaces 
       WHERE room_id = $1 
       ORDER BY space_number`,
      [room.id]
    );

    return {
      ...room,
      spaces: spacesResult.rows
    };
  }));

  return rooms;
};

/**
 * Get all hostels
 */
const getAllHostels = async () => {
  const result = await db.query('SELECT * FROM hostels ORDER BY name');
  return result.rows;
};

/**
 * Get all bookings for administrative review
 */
const getAllBookings = async (statusFilter) => {
  let sql = `
    SELECT 
      b.id,
      b.status,
      COALESCE(b.payment_status, 'PAID') AS payment_status,
      COALESCE(b.amount_paid, 120000.00) AS amount_paid,
      b.payment_ref,
      b.paid_at,
      b.created_at,
      b.approved_at,
      u_app.full_name AS approved_by_name,
      u.id AS student_id,
      u.full_name AS student_name,
      u.email AS student_email,
      u.matric_number AS student_matric,
      u.category AS student_category,
      s.id AS space_id,
      s.space_number,
      r.room_number,
      r.category AS room_category,
      h.name AS hostel_name
    FROM bookings b
    JOIN users u ON b.student_id = u.id
    JOIN spaces s ON b.space_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hostels h ON r.hostel_id = h.id
    LEFT JOIN users u_app ON b.approved_by = u_app.id
  `;

  const params = [];
  if (statusFilter) {
    sql += ` WHERE b.status = $1`;
    params.push(statusFilter.toUpperCase());
  }

  sql += ` ORDER BY b.created_at DESC;`;

  const result = await db.query(sql, params);
  return result.rows;
};

/**
 * Approve a pending booking (Transactional)
 */
const approveBooking = async (bookingId, adminId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Lock booking row
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new NotFoundError('Booking record not found.');
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'PENDING') {
      throw new ConflictError(`Cannot approve booking with status '${booking.status}'. Only PENDING bookings can be approved.`);
    }

    // Lock space row
    const spaceResult = await client.query(
      'SELECT * FROM spaces WHERE id = $1 FOR UPDATE',
      [booking.space_id]
    );

    if (spaceResult.rows.length === 0) {
      throw new NotFoundError('Associated space record not found.');
    }

    const space = spaceResult.rows[0];

    if (space.status !== 'RESERVED') {
      throw new ConflictError(`Space status is '${space.status}'. Approval requires space to be in RESERVED state.`);
    }

    // Update booking to APPROVED
    await client.query(
      `UPDATE bookings 
       SET status = 'APPROVED', approved_at = NOW(), approved_by = $1 
       WHERE id = $2`,
      [adminId, bookingId]
    );

    // Update space to OCCUPIED
    await client.query(
      `UPDATE spaces 
       SET status = 'OCCUPIED', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [booking.space_id]
    );

    await client.query('COMMIT');

    return {
      id: bookingId,
      status: 'APPROVED',
      message: 'Booking successfully approved and space updated to OCCUPIED.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Reject a pending booking (Transactional)
 */
const rejectBooking = async (bookingId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Lock booking row
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new NotFoundError('Booking record not found.');
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'PENDING') {
      throw new ConflictError(`Cannot reject booking with status '${booking.status}'. Only PENDING bookings can be rejected.`);
    }

    // Lock space row
    await client.query('SELECT * FROM spaces WHERE id = $1 FOR UPDATE', [booking.space_id]);

    // Update booking to REJECTED
    await client.query(
      `UPDATE bookings SET status = 'REJECTED' WHERE id = $1`,
      [bookingId]
    );

    // Return space to AVAILABLE
    await client.query(
      `UPDATE spaces 
       SET status = 'AVAILABLE', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [booking.space_id]
    );

    await client.query('COMMIT');

    return {
      id: bookingId,
      status: 'REJECTED',
      message: 'Booking rejected and space returned to AVAILABLE status.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Manually allocate a space to a student (Transactional)
 */
const manualAllocate = async (studentId, spaceId, adminId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Verify student existence & category
    const studentResult = await client.query(
      'SELECT id, role, category, full_name FROM users WHERE id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new NotFoundError('Student user record not found.');
    }

    const student = studentResult.rows[0];
    if (student.role !== 'STUDENT') {
      throw new BadRequestError('Target user is not a student.');
    }

    // 2. Verify student has no active booking (PENDING or APPROVED)
    const activeCheck = await client.query(
      `SELECT id, status FROM bookings 
       WHERE student_id = $1 AND status IN ('PENDING', 'APPROVED')`,
      [studentId]
    );

    if (activeCheck.rows.length > 0) {
      throw new ConflictError(
        `Student already has an active ${activeCheck.rows[0].status.toLowerCase()} booking.`
      );
    }

    // 3. Lock space & get room category
    const spaceResult = await client.query(
      `SELECT s.id, s.space_number, s.status, r.category AS room_category, r.room_number, h.name AS hostel_name
       FROM spaces s
       JOIN rooms r ON s.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE s.id = $1
       FOR UPDATE`,
      [spaceId]
    );

    if (spaceResult.rows.length === 0) {
      throw new NotFoundError('Space record not found.');
    }

    const space = spaceResult.rows[0];

    // 4. Verify space is AVAILABLE
    if (space.status !== 'AVAILABLE') {
      throw new ConflictError(`Space is currently in '${space.status}' status and cannot be allocated.`);
    }

    // 5. Verify category match
    if (space.room_category !== student.category) {
      throw new ForbiddenError(
        `Category Mismatch: Student category is ${student.category}, but room category is ${space.room_category}.`
      );
    }

    // 6. Create APPROVED booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (student_id, space_id, status, approved_at, approved_by)
       VALUES ($1, $2, 'APPROVED', NOW(), $3)
       RETURNING id, student_id, space_id, status, approved_at`,
      [studentId, spaceId, adminId]
    );

    // 7. Update space to OCCUPIED
    await client.query(
      `UPDATE spaces 
       SET status = 'OCCUPIED', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [spaceId]
    );

    await client.query('COMMIT');

    return {
      allocation: bookingResult.rows[0],
      student_name: student.full_name,
      space_number: space.space_number,
      room_number: space.room_number,
      hostel_name: space.hostel_name,
      message: 'Space manually allocated successfully.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Manually deallocate a space (Transactional)
 */
const manualDeallocate = async (spaceId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Lock space
    const spaceResult = await client.query(
      'SELECT * FROM spaces WHERE id = $1 FOR UPDATE',
      [spaceId]
    );

    if (spaceResult.rows.length === 0) {
      throw new NotFoundError('Space record not found.');
    }

    // Find active booking for this space
    const bookingResult = await client.query(
      `SELECT * FROM bookings 
       WHERE space_id = $1 AND status IN ('PENDING', 'APPROVED') 
       FOR UPDATE`,
      [spaceId]
    );

    if (bookingResult.rows.length > 0) {
      const activeBooking = bookingResult.rows[0];
      await client.query(
        `UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`,
        [activeBooking.id]
      );
    }

    // Update space status to AVAILABLE
    await client.query(
      `UPDATE spaces 
       SET status = 'AVAILABLE', version = COALESCE(version, 0) + 1 
       WHERE id = $1`,
      [spaceId]
    );

    await client.query('COMMIT');

    return {
      space_id: spaceId,
      status: 'AVAILABLE',
      message: 'Space deallocated successfully and set to AVAILABLE.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

module.exports = {
  getDashboardStats,
  createHostel,
  createRoomWithSpaces,
  getAllRooms,
  getAllHostels,
  getAllBookings,
  approveBooking,
  rejectBooking,
  manualAllocate,
  manualDeallocate
};
