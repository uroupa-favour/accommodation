const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || (
  process.env.DB_HOST ? `postgresql://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}` : null
);

let pool = null;

if (connectionString && connectionString !== 'memory') {
  const isCloudHost = connectionString.includes('render.com') ||
                      connectionString.includes('supabase') ||
                      connectionString.includes('neon.tech') ||
                      connectionString.includes('sslmode=require') ||
                      connectionString.includes('ssl=true') ||
                      process.env.NODE_ENV === 'production' ||
                      process.env.DB_SSL === 'true';

  pool = new Pool({
    connectionString,
    ssl: isCloudHost ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

// In-Memory PostgreSQL Engine Fallback for offline local development & immediate testing
class InMemoryDB {
  constructor() {
    this.users = [];
    this.hostels = [];
    this.rooms = [];
    this.spaces = [];
    this.bookings = [];
    this.inTransaction = false;
    this.locks = new Set();
    this.initDefaultSeed();
  }

  initDefaultSeed() {
    // Default seeded data matching seed.sql for zero-config fallback testing
    const bcrypt = require('bcryptjs');
    const adminPass = bcrypt.hashSync('admin123', 10);
    const studentPass = bcrypt.hashSync('student123', 10);

    this.users = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        matric_number: null,
        email: 'admin@campus.edu',
        password: adminPass,
        full_name: 'Campus Chief Administrator',
        role: 'ADMIN',
        category: null,
        created_at: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000001',
        matric_number: 'PRE/2026/001',
        email: 'predegree@campus.edu',
        password: studentPass,
        full_name: 'David Adeleke (Pre-Degree)',
        role: 'STUDENT',
        category: 'PREDEGREE',
        created_at: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        matric_number: 'UG/2026/001',
        email: 'undergrad@campus.edu',
        password: studentPass,
        full_name: 'Ngozi Okonjo (Undergraduate)',
        role: 'STUDENT',
        category: 'UNDERGRADUATE',
        created_at: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        matric_number: 'UG/2026/002',
        email: 'undergrad2@campus.edu',
        password: studentPass,
        full_name: 'Emeka Nwosu (Undergraduate)',
        role: 'STUDENT',
        category: 'UNDERGRADUATE',
        created_at: new Date()
      }
    ];

    this.hostels = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        name: 'Basic Studies Hall (Male)',
        gender: 'MALE',
        description: 'Dedicated accommodation facility for basic and pre-degree male students.',
        created_at: new Date()
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        name: 'Alpha Male Hostel',
        gender: 'MALE',
        description: 'Modern undergraduate residence for male students with study lounges.',
        created_at: new Date()
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        name: 'Beta Female Hostel',
        gender: 'FEMALE',
        description: 'Premium undergraduate residence for female students with security access.',
        created_at: new Date()
      }
    ];

    this.rooms = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        hostel_id: '20000000-0000-0000-0000-000000000001',
        room_number: 'Room A101',
        category: 'PREDEGREE',
        capacity: 4,
        price: 120000.00,
        created_at: new Date()
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        hostel_id: '20000000-0000-0000-0000-000000000002',
        room_number: 'Room B201',
        category: 'UNDERGRADUATE',
        capacity: 2,
        price: 150000.00,
        created_at: new Date()
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        hostel_id: '20000000-0000-0000-0000-000000000002',
        room_number: 'Room B202',
        category: 'UNDERGRADUATE',
        capacity: 4,
        price: 140000.00,
        created_at: new Date()
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        hostel_id: '20000000-0000-0000-0000-000000000003',
        room_number: 'Room C301',
        category: 'UNDERGRADUATE',
        capacity: 2,
        price: 160000.00,
        created_at: new Date()
      }
    ];

    this.spaces = [
      { id: 'b0000000-0000-0000-0000-000000000101', room_id: '30000000-0000-0000-0000-000000000001', space_number: 'Space 1', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000102', room_id: '30000000-0000-0000-0000-000000000001', space_number: 'Space 2', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000103', room_id: '30000000-0000-0000-0000-000000000001', space_number: 'Space 3', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000104', room_id: '30000000-0000-0000-0000-000000000001', space_number: 'Space 4', status: 'AVAILABLE', version: 0, created_at: new Date() },
      
      { id: 'b0000000-0000-0000-0000-000000000201', room_id: '30000000-0000-0000-0000-000000000002', space_number: 'Space 1', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000202', room_id: '30000000-0000-0000-0000-000000000002', space_number: 'Space 2', status: 'AVAILABLE', version: 0, created_at: new Date() },

      { id: 'b0000000-0000-0000-0000-000000000203', room_id: '30000000-0000-0000-0000-000000000003', space_number: 'Space 1', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000204', room_id: '30000000-0000-0000-0000-000000000003', space_number: 'Space 2', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000205', room_id: '30000000-0000-0000-0000-000000000003', space_number: 'Space 3', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000206', room_id: '30000000-0000-0000-0000-000000000003', space_number: 'Space 4', status: 'AVAILABLE', version: 0, created_at: new Date() },

      { id: 'b0000000-0000-0000-0000-000000000301', room_id: '30000000-0000-0000-0000-000000000004', space_number: 'Space 1', status: 'AVAILABLE', version: 0, created_at: new Date() },
      { id: 'b0000000-0000-0000-0000-000000000302', room_id: '30000000-0000-0000-0000-000000000004', space_number: 'Space 2', status: 'AVAILABLE', version: 0, created_at: new Date() }
    ];

    this.bookings = [];
  }
}

const memoryDB = new InMemoryDB();

// Database Query Runner abstraction
const query = async (text, params = []) => {
  if (pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('PostgreSQL connection error, utilizing in-memory state engine fallback:', err.message);
    }
  }
  return executeInMemory(text, params);
};

// Database Client Transaction abstraction
const getClient = async () => {
  if (pool) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      console.warn('PostgreSQL pool connection failed, using transaction client fallback.');
    }
  }

  // Fallback memory transaction client
  return {
    query: async (text, params) => executeInMemory(text, params),
    release: () => {}
  };
};

// Internal engine to execute SQL statements on in-memory store
function executeInMemory(text, params = []) {
  const sql = text.trim();
  const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');

  if (lowerSql === 'begin') {
    return { rows: [] };
  }
  if (lowerSql === 'commit') {
    return { rows: [] };
  }
  if (lowerSql === 'rollback') {
    return { rows: [] };
  }

  // Parse WHERE clause to prevent matching column names in SELECT projection
  const whereClause = lowerSql.includes('where') ? lowerSql.split('where')[1] : '';

  // SELECT user BY id
  if (lowerSql.includes('from users') && whereClause.includes('id =')) {
    const id = params[0];
    const user = memoryDB.users.find(u => u.id === id);
    return { rows: user ? [{ ...user }] : [] };
  }

  // SELECT users BY email
  if (lowerSql.includes('from users') && whereClause.includes('email')) {
    const email = params[0];
    const user = memoryDB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return { rows: user ? [{ ...user }] : [] };
  }

  // SELECT user BY matric_number
  if (lowerSql.includes('from users') && whereClause.includes('matric_number')) {
    const matric = params[0];
    const user = memoryDB.users.find(u => u.matric_number && u.matric_number.toLowerCase() === (matric || '').toLowerCase());
    return { rows: user ? [{ ...user }] : [] };
  }

  // SELECT active booking for student
  if (lowerSql.includes('from bookings') && lowerSql.includes('student_id =') && lowerSql.includes('status in')) {
    const studentId = params[0];
    const activeBooking = memoryDB.bookings.find(b => b.student_id === studentId && (b.status === 'PENDING' || b.status === 'APPROVED'));
    return { rows: activeBooking ? [{ ...activeBooking }] : [] };
  }

  // SELECT FOR UPDATE space with room details
  if (lowerSql.includes('from spaces') && lowerSql.includes('id =') && lowerSql.includes('for update')) {
    const spaceId = params[0];
    const space = memoryDB.spaces.find(s => s.id === spaceId);
    if (!space) return { rows: [] };
    const room = memoryDB.rooms.find(r => r.id === space.room_id);
    const hostel = memoryDB.hostels.find(h => h.id === room.hostel_id);

    return {
      rows: [{
        ...space,
        room_category: room.category,
        room_number: room.room_number,
        hostel_name: hostel ? hostel.name : ''
      }]
    };
  }

  // SELECT spaces BY room_id
  if (lowerSql.includes('from spaces') && whereClause.includes('room_id')) {
    const roomId = params[0];
    let spaces = memoryDB.spaces.filter(s => s.room_id === roomId);
    if (whereClause.includes('status =')) {
      const statusValue = params[1] || 'AVAILABLE';
      spaces = spaces.filter(s => s.status === statusValue);
    }
    return { rows: spaces };
  }

  // SELECT space BY id
  if (lowerSql.includes('from spaces') && whereClause.includes('id =')) {
    const spaceId = params[0];
    const space = memoryDB.spaces.find(s => s.id === spaceId);
    return { rows: space ? [{ ...space }] : [] };
  }

  // SELECT rooms for student category
  if (lowerSql.includes('from rooms') && lowerSql.includes('category =')) {
    const category = params[0];
    const rooms = memoryDB.rooms.filter(r => r.category === category).map(r => {
      const hostel = memoryDB.hostels.find(h => h.id === r.hostel_id);
      const roomSpaces = memoryDB.spaces.filter(s => s.room_id === r.id);
      const availableSpaces = roomSpaces.filter(s => s.status === 'AVAILABLE');
      return {
        id: r.id,
        room_id: r.id,
        hostel_id: r.hostel_id,
        room_number: r.room_number,
        category: r.category,
        capacity: r.capacity,
        price: r.price || (r.category === 'PREDEGREE' ? 120000 : 150000),
        hostel_name: hostel ? hostel.name : '',
        hostel_gender: hostel ? hostel.gender : '',
        hostel_description: hostel ? hostel.description : '',
        available_spaces_count: availableSpaces.length,
        available_count: availableSpaces.length,
        spaces: roomSpaces
      };
    });
    return { rows: rooms };
  }

  // SELECT all rooms for admin
  if (lowerSql.includes('from rooms') && !lowerSql.includes('category =')) {
    const rooms = memoryDB.rooms.map(r => {
      const hostel = memoryDB.hostels.find(h => h.id === r.hostel_id);
      const roomSpaces = memoryDB.spaces.filter(s => s.room_id === r.id);
      const available = roomSpaces.filter(s => s.status === 'AVAILABLE').length;
      const reserved = roomSpaces.filter(s => s.status === 'RESERVED').length;
      const occupied = roomSpaces.filter(s => s.status === 'OCCUPIED').length;

      return {
        id: r.id,
        hostel_id: r.hostel_id,
        hostel_name: hostel ? hostel.name : '',
        room_number: r.room_number,
        category: r.category,
        capacity: r.capacity,
        available_count: available,
        reserved_count: reserved,
        occupied_count: occupied,
        spaces: roomSpaces
      };
    });
    return { rows: rooms };
  }

  // INSERT booking
  if (lowerSql.includes('insert into bookings')) {
    const crypto = require('crypto');
    const newBooking = {
      id: crypto.randomUUID(),
      student_id: params[0],
      space_id: params[1],
      status: 'PENDING',
      payment_status: 'PAID',
      amount_paid: params[2] || 120000.00,
      payment_ref: params[3] || `PAY-${Date.now().toString(36).toUpperCase()}`,
      paid_at: new Date(),
      created_at: new Date(),
      approved_at: null,
      approved_by: null
    };
    memoryDB.bookings.push(newBooking);
    return { rows: [newBooking] };
  }

  // UPDATE space status
  if (lowerSql.includes('update spaces set status =')) {
    let newStatus = 'AVAILABLE';
    if (lowerSql.includes("'reserved'")) newStatus = 'RESERVED';
    else if (lowerSql.includes("'occupied'")) newStatus = 'OCCUPIED';
    else if (lowerSql.includes("'available'")) newStatus = 'AVAILABLE';
    else if (params.length > 1) newStatus = params[0];

    const spaceId = params[params.length - 1];
    const space = memoryDB.spaces.find(s => s.id === spaceId);
    if (space) {
      space.status = newStatus;
      space.version = (space.version || 0) + 1;
    }
    return { rows: space ? [space] : [] };
  }

  // SELECT bookings for student
  if (lowerSql.includes('from bookings') && whereClause.includes('student_id =')) {
    const studentId = params[0];
    const userBookings = memoryDB.bookings
      .filter(b => b.student_id === studentId)
      .map(b => {
        const space = memoryDB.spaces.find(s => s.id === b.space_id);
        const room = space ? memoryDB.rooms.find(r => r.id === space.room_id) : null;
        const hostel = room ? memoryDB.hostels.find(h => h.id === room.hostel_id) : null;
        const approver = b.approved_by ? memoryDB.users.find(u => u.id === b.approved_by) : null;

        return {
          id: b.id,
          student_id: b.student_id,
          space_id: b.space_id,
          status: b.status,
          payment_status: b.payment_status || 'PAID',
          amount_paid: b.amount_paid || 120000,
          payment_ref: b.payment_ref || null,
          paid_at: b.paid_at || null,
          created_at: b.created_at,
          approved_at: b.approved_at,
          approved_by_name: approver ? approver.full_name : null,
          space_number: space ? space.space_number : '',
          room_number: room ? room.room_number : '',
          room_category: room ? room.category : '',
          hostel_name: hostel ? hostel.name : ''
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { rows: userBookings };
  }

  // SELECT booking BY id FOR UPDATE or standard
  if (lowerSql.includes('from bookings') && whereClause.includes('id =')) {
    const bookingId = params[0];
    const booking = memoryDB.bookings.find(b => b.id === bookingId);
    return { rows: booking ? [{ ...booking }] : [] };
  }

  // UPDATE booking status
  if (lowerSql.includes('update bookings set status =')) {
    let newStatus = 'PENDING';
    if (lowerSql.includes("'approved'")) newStatus = 'APPROVED';
    else if (lowerSql.includes("'rejected'")) newStatus = 'REJECTED';
    else if (lowerSql.includes("'cancelled'")) newStatus = 'CANCELLED';
    else if (params.length > 0) newStatus = params[0];

    const bookingId = params[params.length - 1];
    const booking = memoryDB.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = newStatus;
      if (lowerSql.includes('approved_by')) {
        booking.approved_at = new Date();
        booking.approved_by = params[0];
      }
    }
    return { rows: booking ? [booking] : [] };
  }

  // SELECT all bookings for admin
  if (lowerSql.includes('from bookings') && !whereClause.includes('id =') && !whereClause.includes('student_id =')) {
    const allBookings = memoryDB.bookings.map(b => {
      const student = memoryDB.users.find(u => u.id === b.student_id);
      const space = memoryDB.spaces.find(s => s.id === b.space_id);
      const room = space ? memoryDB.rooms.find(r => r.id === space.room_id) : null;
      const hostel = room ? memoryDB.hostels.find(h => h.id === room.hostel_id) : null;
      const approver = b.approved_by ? memoryDB.users.find(u => u.id === b.approved_by) : null;

      return {
        id: b.id,
        status: b.status,
        payment_status: b.payment_status || 'PAID',
        amount_paid: b.amount_paid || 120000,
        payment_ref: b.payment_ref || null,
        paid_at: b.paid_at || null,
        created_at: b.created_at,
        approved_at: b.approved_at,
        approved_by_name: approver ? approver.full_name : null,
        student_id: student ? student.id : '',
        student_name: student ? student.full_name : 'Unknown Student',
        student_email: student ? student.email : '',
        student_matric: student ? student.matric_number : '',
        student_category: student ? student.category : '',
        space_id: space ? space.id : '',
        space_number: space ? space.space_number : '',
        room_number: room ? room.room_number : '',
        room_category: room ? room.category : '',
        hostel_name: hostel ? hostel.name : ''
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { rows: allBookings };
  }

  // SELECT admin dashboard statistics
  if (lowerSql.includes('dashboard_stats') || lowerSql.includes('total_students')) {
    const paidBookings = memoryDB.bookings.filter(b => b.payment_status === 'PAID');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0);
    return {
      rows: [{
        total_students: memoryDB.users.filter(u => u.role === 'STUDENT').length,
        total_hostels: memoryDB.hostels.length,
        total_rooms: memoryDB.rooms.length,
        total_spaces: memoryDB.spaces.length,
        available_spaces: memoryDB.spaces.filter(s => s.status === 'AVAILABLE').length,
        reserved_spaces: memoryDB.spaces.filter(s => s.status === 'RESERVED').length,
        occupied_spaces: memoryDB.spaces.filter(s => s.status === 'OCCUPIED').length,
        pending_bookings: memoryDB.bookings.filter(b => b.status === 'PENDING').length,
        approved_bookings: memoryDB.bookings.filter(b => b.status === 'APPROVED').length,
        rejected_bookings: memoryDB.bookings.filter(b => b.status === 'REJECTED').length,
        cancelled_bookings: memoryDB.bookings.filter(b => b.status === 'CANCELLED').length,
        total_revenue: totalRevenue,
        paid_bookings: paidBookings.length
      }]
    };
  }

  // INSERT INTO hostels
  if (lowerSql.includes('insert into hostels')) {
    const crypto = require('crypto');
    const newHostel = {
      id: crypto.randomUUID(),
      name: params[0],
      gender: params[1],
      description: params[2] || '',
      created_at: new Date()
    };
    memoryDB.hostels.push(newHostel);
    return { rows: [newHostel] };
  }

  // INSERT INTO rooms
  if (lowerSql.includes('insert into rooms')) {
    const crypto = require('crypto');
    const newRoom = {
      id: crypto.randomUUID(),
      hostel_id: params[0],
      room_number: params[1],
      category: params[2],
      capacity: parseInt(params[3], 10),
      created_at: new Date()
    };
    memoryDB.rooms.push(newRoom);
    return { rows: [newRoom] };
  }

  // INSERT INTO spaces
  if (lowerSql.includes('insert into spaces')) {
    const crypto = require('crypto');
    const newSpace = {
      id: crypto.randomUUID(),
      room_id: params[0],
      space_number: params[1],
      status: 'AVAILABLE',
      version: 0,
      created_at: new Date()
    };
    memoryDB.spaces.push(newSpace);
    return { rows: [newSpace] };
  }

  // SELECT hostels list
  if (lowerSql.includes('from hostels')) {
    return { rows: [...memoryDB.hostels] };
  }

  // SELECT active booking for space
  if (lowerSql.includes('from bookings') && lowerSql.includes('space_id =') && lowerSql.includes('status in')) {
    const spaceId = params[0];
    const booking = memoryDB.bookings.find(b => b.space_id === spaceId && (b.status === 'PENDING' || b.status === 'APPROVED'));
    return { rows: booking ? [{ ...booking }] : [] };
  }

  return { rows: [] };
}

module.exports = {
  query,
  getClient,
  pool
};
