-- FULL-STACK ONLINE CAMPUS ACCOMMODATION MANAGEMENT SYSTEM
-- PostgreSQL Database Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if needed for clean re-run during development
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hostels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
  category VARCHAR(20) CHECK (category IN ('PREDEGREE', 'UNDERGRADUATE')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Hostels Table
CREATE TABLE hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('PREDEGREE', 'UNDERGRADUATE')),
  capacity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 120000.00,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hostel_id, room_number)
);

-- 4. Spaces (Individual beds) Table
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  space_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
  version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, space_number)
);

-- 5. Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  space_id UUID REFERENCES spaces(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID'
    CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 120000.00,
  payment_ref VARCHAR(100),
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- Business Rule Enforcement Partial Indexes
-- Rule 4: ONE ACTIVE BOOKING PER STUDENT (Only 1 PENDING or APPROVED booking per student)
CREATE UNIQUE INDEX idx_one_active_booking_per_student 
ON bookings (student_id) 
WHERE status IN ('PENDING', 'APPROVED');

-- Rule 1: ONE SPACE = ONE STUDENT ONLY (Only 1 active reservation/occupancy booking per space)
CREATE UNIQUE INDEX idx_one_active_booking_per_space 
ON bookings (space_id) 
WHERE status IN ('PENDING', 'APPROVED');

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_matric ON users(matric_number);
CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX idx_spaces_room_status ON spaces(room_id, status);
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_space_id ON bookings(space_id);
CREATE INDEX idx_bookings_status ON bookings(status);
