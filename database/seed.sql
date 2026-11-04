-- FULL-STACK ONLINE CAMPUS ACCOMMODATION MANAGEMENT SYSTEM
-- Seed Data SQL Script

-- Clear existing data
TRUNCATE TABLE bookings, spaces, rooms, hostels, users RESTART IDENTITY CASCADE;

-- Insert Users (Password for admin: admin123 | Password for students: student123)
-- Admin User
INSERT INTO users (id, matric_number, email, password, full_name, role, category)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'admin@campus.edu',
  '$2a$10$M8/3FHggjy2eVBOjFdSZ.ekT9DQtFseoFE05/8I40RL/mfCS/3Dpu',
  'Campus Chief Administrator',
  'ADMIN',
  NULL
);

-- Pre-degree Student
INSERT INTO users (id, matric_number, email, password, full_name, role, category)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'PRE/2026/001',
  'predegree@campus.edu',
  '$2a$10$DQw7KBrlxl22sduN.s2U.ufIrJJG85DebctPtu13EfUu4/91qrFJi',
  'David Adeleke (Pre-Degree)',
  'STUDENT',
  'PREDEGREE'
);

-- Undergraduate Student 1
INSERT INTO users (id, matric_number, email, password, full_name, role, category)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'UG/2026/001',
  'undergrad@campus.edu',
  '$2a$10$DQw7KBrlxl22sduN.s2U.ufIrJJG85DebctPtu13EfUu4/91qrFJi',
  'Ngozi Okonjo (Undergraduate)',
  'STUDENT',
  'UNDERGRADUATE'
);

-- Undergraduate Student 2
INSERT INTO users (id, matric_number, email, password, full_name, role, category)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'UG/2026/002',
  'undergrad2@campus.edu',
  '$2a$10$DQw7KBrlxl22sduN.s2U.ufIrJJG85DebctPtu13EfUu4/91qrFJi',
  'Emeka Nwosu (Undergraduate)',
  'STUDENT',
  'UNDERGRADUATE'
);

-- Insert Hostels
INSERT INTO hostels (id, name, gender, description) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'Basic Studies Hall (Male)',
  'MALE',
  'Dedicated accommodation facility for basic and pre-degree male students.'
),
(
  '20000000-0000-0000-0000-000000000002',
  'Alpha Male Hostel',
  'MALE',
  'Modern undergraduate residence for male students with study lounges.'
),
(
  '20000000-0000-0000-0000-000000000003',
  'Beta Female Hostel',
  'FEMALE',
  'Premium undergraduate residence for female students with security access.'
);

-- Insert Rooms
-- PREDEGREE Room
INSERT INTO rooms (id, hostel_id, room_number, category, capacity, price) VALUES
(
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Room A101',
  'PREDEGREE',
  4,
  120000.00
);

-- UNDERGRADUATE Rooms
INSERT INTO rooms (id, hostel_id, room_number, category, capacity, price) VALUES
(
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'Room B201',
  'UNDERGRADUATE',
  2,
  150000.00
),
(
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'Room B202',
  'UNDERGRADUATE',
  4,
  140000.00
),
(
  '30000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000003',
  'Room C301',
  'UNDERGRADUATE',
  2,
  160000.00
);

-- Insert Spaces for Room A101 (Pre-degree, 4 beds)
INSERT INTO spaces (id, room_id, space_number, status) VALUES
('b0000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000001', 'Space 1', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000001', 'Space 2', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000001', 'Space 3', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000001', 'Space 4', 'AVAILABLE');

-- Insert Spaces for Room B201 (Undergraduate, 2 beds)
INSERT INTO spaces (id, room_id, space_number, status) VALUES
('b0000000-0000-0000-0000-000000000201', '30000000-0000-0000-0000-000000000002', 'Space 1', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000202', '30000000-0000-0000-0000-000000000002', 'Space 2', 'AVAILABLE');

-- Insert Spaces for Room B202 (Undergraduate, 4 beds)
INSERT INTO spaces (id, room_id, space_number, status) VALUES
('b0000000-0000-0000-0000-000000000203', '30000000-0000-0000-0000-000000000003', 'Space 1', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000204', '30000000-0000-0000-0000-000000000003', 'Space 2', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000205', '30000000-0000-0000-0000-000000000003', 'Space 3', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000206', '30000000-0000-0000-0000-000000000003', 'Space 4', 'AVAILABLE');

-- Insert Spaces for Room C301 (Undergraduate, 2 beds)
INSERT INTO spaces (id, room_id, space_number, status) VALUES
('b0000000-0000-0000-0000-000000000301', '30000000-0000-0000-0000-000000000004', 'Space 1', 'AVAILABLE'),
('b0000000-0000-0000-0000-000000000302', '30000000-0000-0000-0000-000000000004', 'Space 2', 'AVAILABLE');
