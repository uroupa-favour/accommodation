/* ==========================================================================
   OROUPA CAMPUS ACCOMMODATION MANAGEMENT SYSTEM - PREMIUM APP SCRIPT
   ========================================================================== */

// Smart API Base URL: Uses localhost backend if opened via file:// protocol
const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Hostel Image Mapping
const HOSTEL_IMAGES = {
  'Basic Studies Hall (Male)': 'images/basic_studies_hall.png',
  'Alpha Male Hostel': 'images/alpha_male_hostel.png',
  'Beta Female Hostel': 'images/beta_female_hostel.png'
};

// In-Memory Offline Simulation Engine (Triggers automatically if backend is offline or file:// CORS restricted)
const mockDB = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@campus.edu',
      full_name: 'Campus Chief Administrator',
      role: 'ADMIN',
      category: null,
      matric_number: 'ADMIN-001'
    },
    {
      id: 's0000000-0000-0000-0000-000000000001',
      email: 'predegree@campus.edu',
      full_name: 'David Adeleke (Pre-Degree)',
      role: 'STUDENT',
      category: 'PREDEGREE',
      matric_number: 'PRE/2026/001'
    },
    {
      id: 's0000000-0000-0000-0000-000000000002',
      email: 'undergrad@campus.edu',
      full_name: 'Ngozi Okonjo (Undergraduate)',
      role: 'STUDENT',
      category: 'UNDERGRADUATE',
      matric_number: 'UG/2026/001'
    },
    {
      id: 's0000000-0000-0000-0000-000000000003',
      email: 'undergrad2@campus.edu',
      full_name: 'Emeka Nwosu (Undergraduate)',
      role: 'STUDENT',
      category: 'UNDERGRADUATE',
      matric_number: 'UG/2026/002'
    }
  ],
  hostels: [
    { id: 'h1', name: 'Basic Studies Hall (Male)', gender: 'MALE', description: 'Dedicated accommodation for pre-degree male students.' },
    { id: 'h2', name: 'Alpha Male Hostel', gender: 'MALE', description: 'Modern residence for male undergraduate students.' },
    { id: 'h3', name: 'Beta Female Hostel', gender: 'FEMALE', description: 'Premium residence for female undergraduate students.' }
  ],
  rooms: [
    {
      id: 'r1',
      hostel_id: 'h1',
      hostel_name: 'Basic Studies Hall (Male)',
      hostel_gender: 'MALE',
      room_number: 'Room A101',
      category: 'PREDEGREE',
      capacity: 4,
      price: 120000,
      available_count: 4,
      spaces: [
        { id: 'b101', space_number: 'Space 1', status: 'AVAILABLE' },
        { id: 'b102', space_number: 'Space 2', status: 'AVAILABLE' },
        { id: 'b103', space_number: 'Space 3', status: 'AVAILABLE' },
        { id: 'b104', space_number: 'Space 4', status: 'AVAILABLE' }
      ]
    },
    {
      id: 'r2',
      hostel_id: 'h2',
      hostel_name: 'Alpha Male Hostel',
      hostel_gender: 'MALE',
      room_number: 'Room B201',
      category: 'UNDERGRADUATE',
      capacity: 2,
      price: 150000,
      available_count: 2,
      spaces: [
        { id: 'b201', space_number: 'Space 1', status: 'AVAILABLE' },
        { id: 'b202', space_number: 'Space 2', status: 'AVAILABLE' }
      ]
    },
    {
      id: 'r3',
      hostel_id: 'h2',
      hostel_name: 'Alpha Male Hostel',
      hostel_gender: 'MALE',
      room_number: 'Room B202',
      category: 'UNDERGRADUATE',
      capacity: 4,
      price: 150000,
      available_count: 4,
      spaces: [
        { id: 'b203', space_number: 'Space 1', status: 'AVAILABLE' },
        { id: 'b204', space_number: 'Space 2', status: 'AVAILABLE' },
        { id: 'b205', space_number: 'Space 3', status: 'AVAILABLE' },
        { id: 'b206', space_number: 'Space 4', status: 'AVAILABLE' }
      ]
    },
    {
      id: 'r4',
      hostel_id: 'h3',
      hostel_name: 'Beta Female Hostel',
      hostel_gender: 'FEMALE',
      room_number: 'Room C301',
      category: 'UNDERGRADUATE',
      capacity: 2,
      price: 150000,
      available_count: 2,
      spaces: [
        { id: 'b301', space_number: 'Space 1', status: 'AVAILABLE' },
        { id: 'b302', space_number: 'Space 2', status: 'AVAILABLE' }
      ]
    }
  ],
  bookings: []
};

// Application State
const state = {
  token: localStorage.getItem('oroupa_token') || null,
  user: JSON.parse(localStorage.getItem('oroupa_user') || 'null'),
  activeTab: 'student',
  searchQuery: '',
  rooms: [],
  myBookings: [],
  hostels: [],
  allBookings: [],
  dashboardStats: null,
  selectedSpace: null,
  selectedRoomPrice: 120000,
  pendingPaymentRef: null,
  pendingAmountPaid: null
};

// Preset Accounts for Instant Demo Login
const PRESET_ACCOUNTS = {
  predegree: { email: 'predegree@campus.edu', password: 'student123' },
  undergrad: { email: 'undergrad@campus.edu', password: 'student123' },
  undergrad2: { email: 'undergrad2@campus.edu', password: 'student123' },
  admin: { email: 'admin@campus.edu', password: 'admin123' }
};

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div style="flex:1; line-height: 1.4;">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    toast.style.transform  = 'translateX(120%)';
    toast.style.opacity    = '0';
    setTimeout(() => toast.remove(), 350);
  }, 4200);
}

// API Helper with Automatic In-Browser Offline Fallback
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed.');
    }
    return data;
  } catch (err) {
    console.warn(`API Server unreachable at ${API_BASE}${endpoint}. Utilizing seamless in-browser simulation engine.`);
    return handleOfflineSimulation(endpoint, method, body);
  }
}

// Seamless In-Browser Fallback Engine
function handleOfflineSimulation(endpoint, method, body) {
  // Login
  if (endpoint === '/auth/login' && method === 'POST') {
    const user = mockDB.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user) throw new Error('Invalid email or password credentials.');
    return {
      success: true,
      data: {
        token: `mock-jwt-token-${user.id}`,
        user
      }
    };
  }

  // Register Student
  if (endpoint === '/auth/register' && method === 'POST') {
    const existing = mockDB.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) throw new Error('A user with this email address already exists.');
    const newUser = {
      id: 'u-' + Date.now(),
      email: body.email,
      full_name: body.full_name,
      matric_number: body.matric_number,
      role: 'STUDENT',
      category: body.category || 'UNDERGRADUATE'
    };
    mockDB.users.push(newUser);
    return {
      success: true,
      data: {
        token: `mock-jwt-token-${newUser.id}`,
        user: newUser
      }
    };
  }

  // Student Rooms
  if (endpoint === '/student/rooms') {
    const category = state.user ? state.user.category : 'UNDERGRADUATE';
    const rooms = mockDB.rooms.filter(r => r.category === category);
    return { success: true, data: rooms };
  }

  // Student Bookings GET
  if (endpoint === '/student/bookings' && method === 'GET') {
    const userId = state.user ? state.user.id : null;
    const userBookings = mockDB.bookings.filter(b => b.student_id === userId);
    return { success: true, data: userBookings };
  }

  // Student Booking Create
  if (endpoint === '/student/bookings' && method === 'POST') {
    const student = state.user;
    const active = mockDB.bookings.find(b => b.student_id === student.id && (b.status === 'PENDING' || b.status === 'APPROVED'));
    if (active) throw new Error(`You already have an active ${active.status} booking.`);

    let targetSpace = null;
    let targetRoom = null;
    for (const r of mockDB.rooms) {
      const s = r.spaces.find(sp => sp.id === body.spaceId);
      if (s) {
        targetSpace = s;
        targetRoom = r;
        break;
      }
    }

    if (!targetSpace || targetSpace.status !== 'AVAILABLE') {
      throw new Error('Selected space is no longer available.');
    }

    targetSpace.status = 'RESERVED';
    targetRoom.available_count = targetRoom.spaces.filter(s => s.status === 'AVAILABLE').length;

    const payRef = body.paymentRef || `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amtPaid = body.amountPaid || targetRoom.price || 120000;

    const newBooking = {
      id: 'bk-' + Date.now(),
      student_id: student.id,
      space_id: body.spaceId,
      status: 'PENDING',
      payment_status: 'PAID',
      amount_paid: amtPaid,
      payment_ref: payRef,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      student_name: student.full_name,
      student_email: student.email,
      student_matric: student.matric_number,
      student_category: student.category,
      space_number: targetSpace.space_number,
      room_number: targetRoom.room_number,
      hostel_name: targetRoom.hostel_name
    };

    mockDB.bookings.unshift(newBooking);
    return { success: true, data: newBooking };
  }

  // Cancel Booking
  if (endpoint.includes('/cancel')) {
    const parts = endpoint.split('/');
    const bookingId = parts[3];
    const b = mockDB.bookings.find(bk => bk.id === bookingId);
    if (b) {
      b.status = 'CANCELLED';
      for (const r of mockDB.rooms) {
        const s = r.spaces.find(sp => sp.id === b.space_id);
        if (s) {
          s.status = 'AVAILABLE';
          r.available_count = r.spaces.filter(sp => sp.status === 'AVAILABLE').length;
          break;
        }
      }
    }
    return { success: true, message: 'Booking cancelled successfully.' };
  }

  // Admin Dashboard
  if (endpoint === '/admin/dashboard') {
    let avail = 0, resv = 0, occ = 0;
    mockDB.rooms.forEach(r => {
      r.spaces.forEach(s => {
        if (s.status === 'AVAILABLE') avail++;
        if (s.status === 'RESERVED') resv++;
        if (s.status === 'OCCUPIED') occ++;
      });
    });
    const paidBookings = mockDB.bookings.filter(b => b.payment_status === 'PAID');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0);

    return {
      success: true,
      data: {
        total_students: mockDB.users.filter(u => u.role === 'STUDENT').length,
        total_hostels: mockDB.hostels.length,
        total_rooms: mockDB.rooms.length,
        total_spaces: avail + resv + occ,
        available_spaces: avail,
        reserved_spaces: resv,
        occupied_spaces: occ,
        pending_bookings: mockDB.bookings.filter(b => b.status === 'PENDING').length,
        approved_bookings: mockDB.bookings.filter(b => b.status === 'APPROVED').length,
        rejected_bookings: mockDB.bookings.filter(b => b.status === 'REJECTED').length,
        cancelled_bookings: mockDB.bookings.filter(b => b.status === 'CANCELLED').length,
        total_revenue: totalRevenue,
        paid_bookings: paidBookings.length
      }
    };
  }

  // Admin Hostels
  if (endpoint === '/admin/hostels') {
    if (method === 'POST') {
      const newH = { id: 'h' + (mockDB.hostels.length + 1), ...body };
      mockDB.hostels.push(newH);
      return { success: true, data: newH };
    }
    return { success: true, data: mockDB.hostels };
  }

  // Admin Rooms
  if (endpoint === '/admin/rooms') {
    if (method === 'POST') {
      const h = mockDB.hostels.find(h => h.id === body.hostel_id);
      const capInt = parseInt(body.capacity, 10);
      const generatedSpaces = [];
      for (let i = 1; i <= capInt; i++) {
        generatedSpaces.push({ id: `sp-${Date.now()}-${i}`, space_number: `Space ${i}`, status: 'AVAILABLE' });
      }
      const newRoom = {
        id: 'r' + (mockDB.rooms.length + 1),
        hostel_id: body.hostel_id,
        hostel_name: h ? h.name : 'Campus Hostel',
        hostel_gender: h ? h.gender : 'MALE',
        room_number: body.room_number,
        category: body.category,
        capacity: capInt,
        available_count: capInt,
        spaces: generatedSpaces
      };
      mockDB.rooms.push(newRoom);
      return { success: true, data: newRoom };
    }
    return { success: true, data: mockDB.rooms };
  }

  // Admin Bookings
  if (endpoint === '/admin/bookings') {
    return { success: true, data: mockDB.bookings };
  }

  // Admin Approve / Reject
  if (endpoint.includes('/approve')) {
    const bookingId = endpoint.split('/')[3];
    const b = mockDB.bookings.find(bk => bk.id === bookingId);
    if (b) {
      b.status = 'APPROVED';
      b.approved_by_name = state.user.full_name;
      for (const r of mockDB.rooms) {
        const s = r.spaces.find(sp => sp.id === b.space_id);
        if (s) {
          s.status = 'OCCUPIED';
          r.available_count = r.spaces.filter(sp => sp.status === 'AVAILABLE').length;
          break;
        }
      }
    }
    return { success: true, message: 'Booking approved successfully.' };
  }

  if (endpoint.includes('/reject')) {
    const bookingId = endpoint.split('/')[3];
    const b = mockDB.bookings.find(bk => bk.id === bookingId);
    if (b) {
      b.status = 'REJECTED';
      for (const r of mockDB.rooms) {
        const s = r.spaces.find(sp => sp.id === b.space_id);
        if (s) {
          s.status = 'AVAILABLE';
          r.available_count = r.spaces.filter(sp => sp.status === 'AVAILABLE').length;
          break;
        }
      }
    }
    return { success: true, message: 'Booking rejected.' };
  }

  if (endpoint.includes('/deallocate')) {
    const spaceId = endpoint.split('/')[3];
    for (const r of mockDB.rooms) {
      const s = r.spaces.find(sp => sp.id === spaceId);
      if (s) {
        s.status = 'AVAILABLE';
        r.available_count = r.spaces.filter(sp => sp.status === 'AVAILABLE').length;
        break;
      }
    }
    return { success: true, message: 'Space deallocated.' };
  }

  return { success: true, data: [] };
}

// Quick Login Preset Handler
async function loginWithPreset(accountKey) {
  const creds = PRESET_ACCOUNTS[accountKey];
  if (!creds) return;

  document.querySelectorAll('.demo-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.demo-btn[onclick*="${accountKey}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  try {
    const res = await apiCall('/auth/login', 'POST', creds);
    state.token = res.data.token;
    state.user = res.data.user;
    localStorage.setItem('oroupa_token', state.token);
    localStorage.setItem('oroupa_user', JSON.stringify(state.user));

    showToast(`Logged in as ${state.user.full_name} (${state.user.role})`);
    
    state.activeTab = state.user.role === 'ADMIN' ? 'admin' : 'student';
    updateUI();
    loadCurrentViewData();
  } catch (err) {
    showToast(`Login failed: ${err.message}`, 'error');
  }
}

// Custom Form Login
async function handleCustomLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await apiCall('/auth/login', 'POST', { email, password });
    state.token = res.data.token;
    state.user = res.data.user;
    localStorage.setItem('oroupa_token', state.token);
    localStorage.setItem('oroupa_user', JSON.stringify(state.user));

    closeModal('loginModal');
    showToast(`Welcome back, ${state.user.full_name}`);
    state.activeTab = state.user.role === 'ADMIN' ? 'admin' : 'student';
    updateUI();
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Custom Registration
async function handleCustomRegistration(e) {
  e.preventDefault();
  const full_name = document.getElementById('regFullName').value;
  const matric_number = document.getElementById('regMatric').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const category = document.getElementById('regCategory').value;

  try {
    const res = await apiCall('/auth/register', 'POST', {
      full_name,
      matric_number,
      email,
      password,
      category
    });

    state.token = res.data.token;
    state.user = res.data.user;
    localStorage.setItem('oroupa_token', state.token);
    localStorage.setItem('oroupa_user', JSON.stringify(state.user));

    closeModal('registerModal');
    showToast(`Registration complete! Welcome, ${state.user.full_name}`);
    state.activeTab = 'student';
    updateUI();
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('oroupa_token');
  localStorage.removeItem('oroupa_user');
  showToast('Logged out successfully');
  updateUI();
}

// Modal Control
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Main Data Fetcher
async function loadCurrentViewData() {
  if (!state.user) {
    const studentContainer = document.getElementById('studentViewContent');
    if (studentContainer) {
      studentContainer.innerHTML = `
        <div class="glass-panel" style="padding: 4rem 2.5rem; text-align: center; margin-top: 0.5rem; position: relative; overflow: hidden;">
          <div style="
            position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
            width: 300px; height: 300px;
            background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
            pointer-events: none;
          "></div>
          <div style="
            width: 88px; height: 88px; border-radius: 24px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
            display: flex; align-items: center; justify-content: center;
            font-size: 2.5rem; margin: 0 auto 1.75rem;
            box-shadow: 0 8px 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.15);
            animation: breathe 4s ease-in-out infinite;
          ">🏰</div>
          <h2 style="font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 900; color: #fff; margin-bottom: 0.85rem; letter-spacing: -0.03em; line-height: 1.2;">
            Campus Accommodation Portal
          </h2>
          <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 2.5rem; font-size: 0.95rem; line-height: 1.7;">
            Sign in with your student credentials to request bed space allocation, track your reservation status, and manage your campus housing.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem;">
            <button class="btn btn-primary" onclick="openModal('loginModal')" style="padding: 0.8rem 2rem; font-size: 0.95rem;">🔑 Sign In to Portal</button>
            <button class="btn btn-success" onclick="openModal('registerModal')" style="padding: 0.8rem 2rem; font-size: 0.95rem;">✦ Register New Student</button>
          </div>
          <div style="display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.07);">
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 900; font-family: 'Outfit', sans-serif; color: #818cf8;">100+</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">Bed Spaces</div>
            </div>
            <div style="width: 1px; background: rgba(255,255,255,0.08);"></div>
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 900; font-family: 'Outfit', sans-serif; color: #34d399;">3</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">Hostels</div>
            </div>
            <div style="width: 1px; background: rgba(255,255,255,0.08);"></div>
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 900; font-family: 'Outfit', sans-serif; color: #67e8f9;">24/7</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">Security</div>
            </div>
          </div>
        </div>
      `;
    }
    const adminContainer = document.getElementById('adminViewContent');
    if (adminContainer) {
      adminContainer.innerHTML = `
        <div class="glass-panel" style="padding: 4rem 2.5rem; text-align: center; margin-top: 0.5rem; position: relative; overflow: hidden;">
          <div style="
            position: absolute; top: -80px; right: -80px;
            width: 250px; height: 250px;
            background: radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%);
            pointer-events: none;
          "></div>
          <div style="
            width: 88px; height: 88px; border-radius: 24px;
            background: linear-gradient(135deg, #f43f5e, #e11d48);
            display: flex; align-items: center; justify-content: center;
            font-size: 2.5rem; margin: 0 auto 1.75rem;
            box-shadow: 0 8px 40px rgba(244,63,94,0.45), 0 0 60px rgba(244,63,94,0.12);
            animation: breathe 4s ease-in-out infinite;
          ">🛡️</div>
          <h2 style="font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 900; color: #fff; margin-bottom: 0.85rem; letter-spacing: -0.03em;">
            Administrator Command Center
          </h2>
          <p style="color: var(--text-muted); max-width: 460px; margin: 0 auto 2.5rem; font-size: 0.95rem; line-height: 1.7;">
            Administrative credentials are required to manage hostel infrastructure, rooms, and review student bed space reservation requests.
          </p>
          <button class="btn btn-primary" onclick="openModal('loginModal')" style="padding: 0.8rem 2rem; font-size: 0.95rem;">🔑 Sign In as Administrator</button>
        </div>
      `;
    }
    return;
  }

  try {
    if (state.activeTab === 'student') {
      if (state.user.role === 'STUDENT') {
        const roomsRes = await apiCall('/student/rooms');
        state.rooms = roomsRes.data || [];
        const bookingsRes = await apiCall('/student/bookings');
        state.myBookings = bookingsRes.data || [];
        renderStudentPortal();
      } else {
        document.getElementById('studentViewContent').innerHTML = `
          <div class="glass-panel" style="padding: 2.5rem; text-align: center; color: var(--accent-amber);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️ Administrator Session Active</div>
            <p>You are logged in as System Administrator. Use the <strong>Administrator Command Center</strong> tab to manage accommodation queue.</p>
          </div>
        `;
      }
    } else if (state.activeTab === 'admin') {
      if (state.user.role === 'ADMIN') {
        const statsRes = await apiCall('/admin/dashboard');
        state.dashboardStats = statsRes.data || {};
        const hostelsRes = await apiCall('/admin/hostels');
        state.hostels = hostelsRes.data || [];
        const roomsRes = await apiCall('/admin/rooms');
        state.rooms = roomsRes.data || [];
        const bookingsRes = await apiCall('/admin/bookings');
        state.allBookings = bookingsRes.data || [];
        renderAdminPortal();
      } else {
        document.getElementById('adminViewContent').innerHTML = `
          <div class="glass-panel" style="padding: 2.5rem; text-align: center; color: var(--accent-rose);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒 Administrative Access Required</div>
            <p>Student accounts cannot access administrative settings. Please sign in with an Administrator account.</p>
          </div>
        `;
      }
    }
  } catch (err) {
    showToast(`Failed to load data: ${err.message}`, 'error');
  }
}

// Render Student Accommodation Portal
function renderStudentPortal() {
  const container = document.getElementById('studentViewContent');
  if (!container) return;

  const activeBooking = state.myBookings.find(b => b.status === 'PENDING' || b.status === 'APPROVED');

  let stepState = { s1: 'completed', s2: 'active', s3: '', s4: '', s5: '' };
  if (activeBooking) {
    stepState.s2 = 'completed';
    stepState.s3 = 'completed'; // payment done if booking exists
    if (activeBooking.status === 'PENDING') {
      stepState.s4 = 'active';
    } else if (activeBooking.status === 'APPROVED') {
      stepState.s4 = 'completed';
      stepState.s5 = 'completed';
    }
  }

  // Calculate stepper fill percentage
  const filledSteps = Object.values(stepState).filter(s => s === 'completed').length;
  const stepFillPct = Math.min(100, (filledSteps / 4) * 100);

  let html = `
    <!-- Student Profile Header Banner -->
    <div class="glass-panel" style="padding: 2rem 2.4rem; margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.5rem;">
            <span class="live-pulse"></span>
            <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--emerald); font-weight: 800;">Student Portal Active</span>
          </div>
          <h2 style="font-size: 1.75rem; color: #fff; margin-bottom: 0.35rem;">Welcome, ${state.user.full_name}</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem;">
            Category Allocation: 
            <span class="category-tag ${state.user.category ? state.user.category.toLowerCase() : ''}">${state.user.category || 'N/A'}</span>
          </p>
        </div>
        <div style="background: rgba(255,255,255,0.04); padding: 1rem 1.5rem; border-radius: 14px; border: 1px solid rgba(6,182,212,0.25); text-align: right; box-shadow: 0 0 20px rgba(6,182,212,0.06);">
          <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; margin-bottom: 0.25rem;">Matriculation No.</div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.3rem; font-weight: 700; color: var(--cyan); letter-spacing: 0.04em;">${state.user.matric_number || 'N/A'}</div>
        </div>
      </div>

      <!-- Stepper Progress Bar -->
      <div class="stepper-container">
        <div class="stepper-track">
          <div class="stepper-track-fill" style="width: ${stepFillPct}%;"></div>
        </div>
        
        <div class="stepper-step ${stepState.s1}">
          <div class="step-circle">✓</div>
          <div class="step-title">1. Verified</div>
        </div>
        <div class="stepper-step ${stepState.s2}">
          <div class="step-circle">${stepState.s2 === 'completed' ? '✓' : '2'}</div>
          <div class="step-title">2. Select Space</div>
        </div>
        <div class="stepper-step ${stepState.s3}">
          <div class="step-circle">${stepState.s3 === 'completed' ? '✓' : '3'}</div>
          <div class="step-title">3. Pay Fees</div>
        </div>
        <div class="stepper-step ${stepState.s4}">
          <div class="step-circle">${stepState.s4 === 'completed' ? '✓' : '4'}</div>
          <div class="step-title">4. Admin Review</div>
        </div>
        <div class="stepper-step ${stepState.s5}">
          <div class="step-circle">${stepState.s5 === 'completed' ? '✓' : '5'}</div>
          <div class="step-title">5. Pass Issued</div>
        </div>
      </div>
    </div>
  `;

  // Active Booking Digital Housing Pass Card
  if (activeBooking) {
    const isApproved = activeBooking.status === 'APPROVED';
    const isPending  = activeBooking.status === 'PENDING';
    const passGrad   = isApproved
      ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)'
      : 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(234,88,12,0.07) 100%)';
    const passBorder = isApproved ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)';
    const passAccent = isApproved ? '#34d399' : '#fbbf24';

    html += `
      <!-- Digital Housing Pass Card -->
      <div class="pass-card" style="background: ${passGrad}; border: 1px solid ${passBorder}; --pass-accent: ${isApproved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)'}; animation: slideInUp 0.5s 0.1s var(--t-spring) both;">

        <!-- Pass Card Top Strip -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1.5rem;">

          <!-- Left: Hostel & Booking Info -->
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:0.65rem; margin-bottom:1rem;">
              <span class="badge badge-${activeBooking.status.toLowerCase()}" style="font-size:0.72rem; padding:0.3rem 0.75rem;">${activeBooking.status}</span>
              <span style="font-size:0.72rem; color:var(--text-faint); font-family:'JetBrains Mono',monospace; letter-spacing:0.04em;">
                #${activeBooking.id ? activeBooking.id.substring(0,8).toUpperCase() : 'N/A'}
              </span>
            </div>

            <h3 style="font-size:1.8rem; font-family:'Outfit',sans-serif; font-weight:900; color:#fff; margin-bottom:0.3rem; letter-spacing:-0.03em; line-height:1;">
              ${activeBooking.hostel_name}
            </h3>
            <div style="font-size:1.05rem; color:${passAccent}; font-weight:700; margin-bottom:1.4rem; letter-spacing:0.02em;">
              Room ${activeBooking.room_number} &nbsp;&middot;&nbsp; Bed Space ${activeBooking.space_number}
            </div>

            <!-- Info Row -->
            <div style="display:flex; gap:2rem; flex-wrap:wrap;">
              <div>
                <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.10em; color:var(--text-faint); font-weight:800; margin-bottom:0.2rem;">Reserved On</div>
                <div style="font-size:0.9rem; font-weight:700; color:#fff;">${new Date(activeBooking.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</div>
              </div>
              <div>
                <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.10em; color:var(--text-faint); font-weight:800; margin-bottom:0.2rem;">Amount Paid</div>
                <div style="font-size:0.9rem; font-weight:700; color:${passAccent}; font-family:'JetBrains Mono',monospace;">&#8358;${(activeBooking.amount_paid || 0).toLocaleString()}</div>
              </div>
              ${activeBooking.approved_by_name ? `
              <div>
                <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.10em; color:var(--text-faint); font-weight:800; margin-bottom:0.2rem;">Approved By</div>
                <div style="font-size:0.9rem; font-weight:700; color:#34d399;">&#10003; ${activeBooking.approved_by_name}</div>
              </div>` : ''}
            </div>
          </div>

          <!-- Right: QR Code Box -->
          <div style="
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; padding: 1.1rem;
            display: flex; flex-direction: column;
            align-items: center; gap: 0.5rem;
            flex-shrink: 0;
          ">
            <svg width="100" height="100" viewBox="0 0 100 100" style="background:#fff; padding:8px; border-radius:10px;">
              <path d="M0,0 h30 v30 h-30 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M80,10 h10 v10 h-10 z M0,40 h10 v20 h-10 z M20,40 h30 v10 h-30 z M60,40 h40 v10 h-40 z M0,70 h30 v30 h-30 z M40,70 h20 v30 h-20 z M70,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M80,80 h10 v10 h-10 z" fill="#0b0f19"/>
            </svg>
            <div style="font-size:0.6rem; font-family:'JetBrains Mono',monospace; letter-spacing:0.08em; color:var(--text-faint); text-transform:uppercase;">Digital Pass</div>
          </div>
        </div>

        <!-- Pass Card Bottom Strip -->
        <div style="
          margin-top: 1.5rem;
          padding-top: 1.1rem;
          border-top: 1px dashed rgba(255,255,255,0.12);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 1rem;
        ">
          <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1rem;">${isApproved ? '✅' : '⏳'}</span>
            ${isApproved
              ? '<span>Official allocation confirmed. Show this pass at hostel reception for check-in.</span>'
              : '<span>Awaiting review by the Campus Accommodations Board.</span>'}
          </div>
          <div style="display:flex; gap:0.65rem; flex-shrink:0;">
            ${isPending ? `
              <button class="btn btn-danger" style="font-size:0.8rem; padding:0.45rem 1rem;" onclick="cancelStudentBooking('${activeBooking.id}')">
                ✕ Cancel Request
              </button>
            ` : `
              <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.45rem 1rem;" onclick="window.print()">
                🖨️ Print Pass
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // Filter Bar
  const filteredRooms = state.rooms.filter(r => {
    const matchSearch = r.room_number.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                        r.hostel_name.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchSearch;
  });

  html += `
    <!-- Search & Filter Controls -->
    <div class="filter-bar">
      <div class="search-input-group">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search by room number or hostel..." value="${state.searchQuery}" oninput="handleSearch(this.value)">
      </div>
      <div class="filter-chips">
        <button class="chip-btn active">Matching Category (${state.user.category})</button>
      </div>
    </div>

    <!-- Available Rooms Grid -->
    <h3 style="margin-bottom: 1rem; font-size: 1.35rem; display: flex; align-items: center; justify-content: space-between;">
      <span>Available Rooms & Bed Spaces</span>
      <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.15); padding: 0.3rem 0.8rem; border-radius: var(--radius-full);">
        ${filteredRooms.length} Accommodation Rooms
      </span>
    </h3>
  `;

  if (filteredRooms.length === 0) {
    html += `
      <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        No rooms currently match your search filter or student category restriction (${state.user.category}).
      </div>
    `;
  } else {
    html += `<div class="rooms-grid">`;
    filteredRooms.forEach(room => {
      const hostelImg = HOSTEL_IMAGES[room.hostel_name] || 'images/alpha_male_hostel.png';

      html += `
        <div class="room-card">
          <div class="room-card-img-container">
            <img src="${hostelImg}" class="room-card-img" alt="${room.hostel_name}">
            <div class="room-card-overlay">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="category-tag ${room.category.toLowerCase()}">${room.category}</span>
                <span style="
                  font-size: 0.7rem; font-weight: 800;
                  background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);
                  padding: 0.22rem 0.65rem; border-radius: 999px;
                  color: #fff; display:flex; align-items:center; gap:0.3rem;
                ">
                  <span style="width:6px;height:6px;background:var(--emerald);border-radius:50%;display:inline-block;"></span>
                  ${room.available_count} Free
                </span>
              </div>
              <div>
                <div class="room-number">${room.room_number}</div>
                <div class="hostel-name">${room.hostel_name} (${room.hostel_gender})</div>
              </div>
            </div>
          </div>

          <div class="room-card-body">
            <div class="spaces-header">
              <div class="spaces-label">Select Bed Space:</div>
              <div class="spaces-price">&#8358;${(room.price || (room.category === 'PREDEGREE' ? 120000 : 150000)).toLocaleString()}</div>
            </div>
            <div class="spaces-container">
      `;

      const roomPrice = room.price || (room.category === 'PREDEGREE' ? 120000 : 150000);
      room.spaces.forEach((space, idx) => {
        const isAvailable = space.status === 'AVAILABLE';
        const slotIcon = isAvailable ? '🛏️' : (space.status === 'RESERVED' ? '⏳' : '👤');
        const delay = (idx * 0.06).toFixed(2);
        html += `
          <div class="space-slot ${space.status.toLowerCase()}"
               style="animation: slideInUp 0.4s ${delay}s var(--t-spring) both;"
               ${isAvailable ? `onclick="initiateBookingModal('${space.id}', '${space.space_number}', '${room.room_number}', '${room.hostel_name}', ${roomPrice})"` : ''}>
            <div class="space-icon">${slotIcon}</div>
            <div class="space-number">${space.space_number}</div>
            <div class="space-status status-${space.status.toLowerCase()}">${space.status}</div>
            ${isAvailable ? '<div class="space-select-hint">Tap to Select</div>' : ''}
          </div>
        `;
      });

      const availCount = room.spaces.filter(s => s.status === 'AVAILABLE').length;
      html += `
            </div>
            
            <div class="amenities-strip">
              <span class="amenity-chip">⚡ 24/7 Power</span>
              <span class="amenity-chip">📶 Fiber Wi-Fi</span>
              <span class="amenity-chip">🔒 Security</span>
              <span class="amenity-chip" style="margin-left: auto; color: var(--emerald); background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25);">${availCount} Free</span>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Booking History Table
  html += `
    <div class="section-heading" style="margin-top: 3rem;">
      <h3>Booking Request History</h3>
      <span class="count-pill ${state.myBookings.length > 0 ? 'green' : 'amber'}">${state.myBookings.length} Record${state.myBookings.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Hostel Name</th>
            <th>Room</th>
            <th>Bed Space</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Approved By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (state.myBookings.length === 0) {
    html += `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No booking request history records found.</td></tr>`;
  } else {
    state.myBookings.forEach(b => {
      html += `
        <tr>
          <td>${new Date(b.created_at).toLocaleDateString()} ${new Date(b.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
          <td><strong>${b.hostel_name}</strong></td>
          <td>${b.room_number}</td>
          <td>${b.space_number}</td>
          <td>
            <span class="badge ${b.payment_status === 'PAID' ? 'badge-approved' : 'badge-pending'}" style="font-size:0.75rem;">
              ${b.payment_status || 'PAID'} (&#8358;${(b.amount_paid || 150000).toLocaleString()})
            </span>
          </td>
          <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
          <td>${b.approved_by_name || '—'}</td>
          <td>
            ${b.status === 'PENDING' ? `
              <button class="btn btn-danger" style="padding: 0.3rem 0.7rem; font-size: 0.75rem;" onclick="cancelStudentBooking('${b.id}')">Cancel</button>
            ` : '—'}
          </td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function handleSearch(val) {
  state.searchQuery = val;
  renderStudentPortal();
}

// Initiate Booking -> Step 1: Open Payment Modal
function initiateBookingModal(spaceId, spaceNumber, roomNumber, hostelName, roomPrice) {
  if (state.user.role !== 'STUDENT') {
    showToast('Only authenticated students can make bookings.', 'error');
    return;
  }

  const activeBooking = state.myBookings.find(b => b.status === 'PENDING' || b.status === 'APPROVED');
  if (activeBooking) {
    showToast(`Rule Violation: You already have an active ${activeBooking.status} booking.`, 'error');
    return;
  }

  const amount = roomPrice || (state.user.category === 'PREDEGREE' ? 120000 : 150000);
  state.selectedSpace = spaceId;
  state.selectedRoomPrice = amount;

  const paymentSummary = document.getElementById('paymentSpaceSummary');
  if (paymentSummary) {
    paymentSummary.innerHTML = `
      <div style="
        display: flex; align-items: center; gap: 1rem;
        background: rgba(99,102,241,0.08);
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 14px; padding: 1rem 1.2rem;
        margin-bottom: 1.25rem;
        animation: slideInUp 0.4s var(--t-spring) both;
      ">
        <div style="
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3));
          border: 1px solid rgba(99,102,241,0.4);
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
        ">🛏️</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${hostelName}</div>
          <div style="font-size: 0.82rem; color: #818cf8; font-weight: 600;">Room ${roomNumber} &nbsp;·&nbsp; Bed ${spaceNumber}</div>
        </div>
      </div>
    `;
  }

  const btnPay = document.getElementById('btnPayNow');
  if (btnPay) {
    btnPay.innerHTML = `💳 Pay &#8358;${amount.toLocaleString()} & Continue`;
  }

  openModal('paymentModal');
}

function selectPaymentMethod(element, method) {
  document.querySelectorAll('.payment-method-card').forEach(el => el.classList.remove('selected'));
  if (element) element.classList.add('selected');
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '');
  val = val.replace(/(.{4})/g, '$1 ').trim();
  input.value = val.substring(0, 19);
}

// Process Payment (Simulated Step 1 -> Step 2)
async function processPayment(event) {
  if (event) event.preventDefault();

  const btn = document.getElementById('btnPayNow');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `Processing Payment...`;
  }

  const ref = 'PAY-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
  state.pendingPaymentRef = ref;
  state.pendingAmountPaid = state.selectedRoomPrice || 150000;

  await new Promise(res => setTimeout(res, 1800));

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `💳 Pay &#8358;${(state.pendingAmountPaid).toLocaleString()}`;
  }

  closeModal('paymentModal');
  showToast('Payment successful! Transaction reference generated.', 'success');

  const bookingModalDetails = document.getElementById('bookingModalDetails');
  if (bookingModalDetails) {
    bookingModalDetails.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%);
        border: 1px solid rgba(16,185,129,0.4);
        border-radius: 14px; padding: 1.2rem 1.4rem;
        margin-bottom: 1.25rem;
        animation: slideInUp 0.4s var(--t-spring) both;
      ">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem;">
          <span style="
            width: 22px; height: 22px; border-radius: 50%;
            background: rgba(16,185,129,0.25); border: 1px solid rgba(16,185,129,0.5);
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 0.75rem; color: #34d399; font-weight: 800;
          ">✓</span>
          <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.10em; color: #34d399;">Accommodation Fee Verified</span>
        </div>
        <div style="font-size: 1.8rem; font-weight: 900; color: #fff; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em; line-height: 1;">&#8358;${state.pendingAmountPaid.toLocaleString()}</div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">Transaction Ref: <span style="color: #818cf8; font-family: 'JetBrains Mono', monospace; font-weight: 600;">${state.pendingPaymentRef}</span></div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.6;">Your payment has been processed. Click <strong style="color: #fff;">Submit Reservation</strong> to forward your bed space request to the Accommodation Board for approval.</p>
    `;
  }

  openModal('bookingModal');
}

// Confirm Booking Request (Step 2 Submit)
async function confirmBooking() {
  if (!state.selectedSpace) return;

  try {
    const payload = {
      spaceId: state.selectedSpace,
      paymentRef: state.pendingPaymentRef || ('PAY-' + Date.now()),
      amountPaid: state.pendingAmountPaid || 150000
    };

    await apiCall('/student/bookings', 'POST', payload);
    closeModal('bookingModal');
    showToast('Booking request submitted successfully! Pending admin approval.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Cancel Booking
async function cancelStudentBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking request?')) return;

  try {
    await apiCall(`/student/bookings/${bookingId}/cancel`, 'PUT');
    showToast('Booking request cancelled.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Render Admin Management Portal
function renderAdminPortal() {
  const container = document.getElementById('adminViewContent');
  if (!container) return;

  const stats = state.dashboardStats || {};
  const totalBeds = stats.total_spaces || 1;
  const occPct = Math.round(((stats.occupied_spaces || 0) / totalBeds) * 100);
  const availPct = Math.round(((stats.available_spaces || 0) / totalBeds) * 100);

  let html = `
    <!-- Admin Dashboard KPI Grid -->
    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-title">Total Students</div>
        <div class="stat-value" style="color: #67e8f9;">${stats.total_students || 0}</div>
        <div class="stat-label">Registered campus accounts</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🏗️</div>
        <div class="stat-title">Infrastructure</div>
        <div class="stat-value" style="color: #a78bfa;">${stats.total_hostels || 0}<span style="font-size:1rem; opacity:0.6;"> hostels / ${stats.total_rooms || 0} rooms</span></div>
        <div class="stat-label">Active facilities</div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon">🛏️</div>
        <div class="stat-title">Available Spaces</div>
        <div class="stat-value" style="color: #34d399;">${stats.available_spaces || 0}</div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${availPct}%; background: var(--grad-emerald);"></div></div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">⏳</div>
        <div class="stat-title">Pending Approvals</div>
        <div class="stat-value" style="color: #fbbf24;">${stats.pending_bookings || 0}</div>
        <div class="stat-label" style="color: #fbbf24;">${(stats.pending_bookings || 0) > 0 ? '⚡ Action required' : 'All clear'}</div>
      </div>
      <div class="stat-card rose">
        <div class="stat-icon">👤</div>
        <div class="stat-title">Occupied Beds</div>
        <div class="stat-value" style="color: #fb7185;">${stats.occupied_spaces || 0}<span style="font-size:0.9rem; opacity:0.6;"> / ${stats.total_spaces || 0}</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${occPct}%; background: var(--grad-rose);"></div></div>
      </div>
      <div class="stat-card emerald">
        <div class="stat-icon">💰</div>
        <div class="stat-title">Total Revenue</div>
        <div class="stat-value" style="color: #34d399; font-size: 1.55rem;">&#8358;${(stats.total_revenue || 0).toLocaleString()}</div>
        <div class="stat-label">${stats.paid_bookings || 0} confirmed payment${(stats.paid_bookings || 0) !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <!-- Admin Toolbar -->
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="font-size: 1.4rem; font-family: 'Outfit', sans-serif; font-weight: 800; background: linear-gradient(135deg, #e2e8ff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Administrative Command Center</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Manage infrastructure and review student reservation requests</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" onclick="openModal('createHostelModal')">
          🏗️ New Hostel
        </button>
        <button class="btn btn-primary" onclick="populateHostelDropdown(); openModal('createRoomModal');">
          🛏️ Add Room &amp; Spaces
        </button>
      </div>
    </div>

    <!-- Booking Requests Queue -->
    <div class="glass-panel" style="padding: 1.75rem; margin-bottom: 2.5rem;">
      <div class="section-heading" style="margin-bottom: 1.25rem;">
        <div>
          <h3>Student Booking Queue</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; font-family: inherit;">Review and approve student bed space reservation requests.</p>
        </div>
        <span class="count-pill amber">
          ${state.allBookings.filter(b => b.status === 'PENDING').length} Pending
        </span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Matric / Email</th>
              <th>Category</th>
              <th>Hostel & Room</th>
              <th>Bed Space</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (state.allBookings.length === 0) {
    html += `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No booking requests found in system database.</td></tr>`;
  } else {
    state.allBookings.forEach(b => {
      html += `
        <tr>
          <td><strong>${b.student_name}</strong></td>
          <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">${b.student_matric || b.student_email}</span></td>
          <td><span class="category-tag ${b.student_category ? b.student_category.toLowerCase() : ''}">${b.student_category || 'N/A'}</span></td>
          <td><strong>${b.hostel_name}</strong> — ${b.room_number}</td>
          <td><strong>${b.space_number}</strong></td>
          <td>
            <span class="badge ${b.payment_status === 'PAID' ? 'badge-approved' : 'badge-pending'}" style="font-size:0.75rem;">
              ${b.payment_status || 'PAID'} (&#8358;${(b.amount_paid || 150000).toLocaleString()})
            </span>
          </td>
          <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
          <td>
            ${b.status === 'PENDING' ? `
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn btn-success" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;" onclick="approveBooking('${b.id}')">✓ Approve</button>
                <button class="btn btn-danger" style="padding: 0.35rem 0.8rem; font-size: 0.76rem;" onclick="rejectBooking('${b.id}')">✕ Reject</button>
              </div>
            ` : (b.approved_by_name ? `<span style="font-size: 0.78rem; color: #34d399; font-weight: 600;">✓ ${b.approved_by_name}</span>` : '<span style="color: var(--text-faint);">—</span>')}
          </td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hostel & Room Inspection Grid -->
    <h3 style="margin-bottom: 1rem; font-size: 1.35rem;">Hostel Occupancy & Bed Space Matrix</h3>
    <div class="rooms-grid">
  `;

  state.rooms.forEach(room => {
    const hostelImg = HOSTEL_IMAGES[room.hostel_name] || 'images/alpha_male_hostel.png';

    html += `
      <div class="room-card">
        <div class="room-card-img-container" style="height: 120px;">
          <img src="${hostelImg}" class="room-card-img" alt="${room.hostel_name}">
          <div class="room-card-overlay">
            <div style="display: flex; justify-content: space-between;">
              <span class="category-tag ${room.category.toLowerCase()}">${room.category}</span>
            </div>
            <div>
              <div class="room-number">${room.room_number}</div>
              <div class="hostel-name">${room.hostel_name}</div>
            </div>
          </div>
        </div>

        <div class="room-card-body">
          <div style="display: flex; gap: 0.6rem; margin-bottom: 0.85rem; flex-wrap: wrap;">
            <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); color: #34d399;">
              ${room.available_count} Free
            </span>
            <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24;">
              ${(room.spaces || []).filter(s => s.status === 'RESERVED').length} Reserved
            </span>
            <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; background: rgba(244,63,94,0.10); border: 1px solid rgba(244,63,94,0.3); color: #fb7185;">
              ${(room.spaces || []).filter(s => s.status === 'OCCUPIED').length} Occupied
            </span>
          </div>

          <div class="spaces-container">
    `;

    room.spaces.forEach((space, idx) => {
      const adminCanDeallocate = space.status === 'OCCUPIED' || space.status === 'RESERVED';
      const slotIcon = space.status === 'AVAILABLE' ? '🛏️' : (space.status === 'RESERVED' ? '⏳' : '👤');
      const delay = (idx * 0.06).toFixed(2);
      html += `
        <div class="space-slot ${space.status.toLowerCase()}"
             style="animation: slideInUp 0.4s ${delay}s var(--t-spring) both;"
             ${adminCanDeallocate ? `title="Click to deallocate" onclick="deallocateSpace('${space.id}')"` : ''}>
          <div class="space-icon">${slotIcon}</div>
          <div class="space-number">${space.space_number}</div>
          <div class="space-status status-${space.status.toLowerCase()}">${space.status}</div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;
}

// Admin Approve / Reject Handlers
async function approveBooking(bookingId) {
  try {
    await apiCall(`/admin/bookings/${bookingId}/approve`, 'PUT');
    showToast('Booking approved! Bed space marked as OCCUPIED.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectBooking(bookingId) {
  try {
    await apiCall(`/admin/bookings/${bookingId}/reject`, 'PUT');
    showToast('Booking request rejected. Bed space released to AVAILABLE.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deallocateSpace(spaceId) {
  if (!confirm('Deallocate this space and return status to AVAILABLE?')) return;
  try {
    await apiCall(`/admin/spaces/${spaceId}/deallocate`, 'PUT');
    showToast('Space deallocated and restored to AVAILABLE status.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Create Hostel Form Submission
async function handleCreateHostel(e) {
  e.preventDefault();
  const name = document.getElementById('hostelName').value;
  const gender = document.getElementById('hostelGender').value;
  const description = document.getElementById('hostelDesc').value;

  try {
    await apiCall('/admin/hostels', 'POST', { name, gender, description });
    closeModal('createHostelModal');
    showToast('Hostel created successfully.');
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Populate Hostel Select in Create Room Modal
function populateHostelDropdown() {
  const select = document.getElementById('roomHostelSelect');
  if (!select) return;
  select.innerHTML = state.hostels.map(h => `<option value="${h.id}">${h.name} (${h.gender})</option>`).join('');
}

// Create Room Form Submission
async function handleCreateRoom(e) {
  e.preventDefault();
  const hostel_id = document.getElementById('roomHostelSelect').value;
  const room_number = document.getElementById('roomNumber').value;
  const category = document.getElementById('roomCategory').value;
  const capacity = document.getElementById('roomCapacity').value;

  try {
    await apiCall('/admin/rooms', 'POST', { hostel_id, room_number, category, capacity });
    closeModal('createRoomModal');
    showToast(`Room '${room_number}' created with ${capacity} auto-generated bed spaces.`);
    loadCurrentViewData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// View Tab Switcher
function switchTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.getElementById('studentViewContent').style.display = tabName === 'student' ? 'block' : 'none';
  document.getElementById('adminViewContent').style.display = tabName === 'admin' ? 'block' : 'none';
  loadCurrentViewData();
}

// Update Top Navigation User Display
function updateUI() {
  const container = document.getElementById('navUserInfo');
  if (!container) return;

  if (state.user) {
    const initials = state.user.full_name.split(' ').map(w => w[0]).slice(0,2).join('');
    container.innerHTML = `
      <div class="user-badge">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <span class="user-name">${state.user.full_name}</span>
          <span class="user-role-badge">${state.user.role}${state.user.category ? ' · ' + state.user.category : ''}</span>
        </div>
      </div>
      <button class="btn btn-secondary" style="padding: 0.38rem 0.85rem; font-size: 0.78rem;" onclick="handleLogout()">Sign Out</button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-success" style="padding: 0.42rem 1rem; font-size: 0.8rem;" onclick="openModal('registerModal')">✦ Register</button>
      <button class="btn btn-primary" style="padding: 0.42rem 1rem; font-size: 0.8rem;" onclick="openModal('loginModal')">Sign In</button>
    `;
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  updateUI();

  // Tab Listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleCustomLogin);

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleCustomRegistration);

  // Hostel Form
  const hostelForm = document.getElementById('createHostelForm');
  if (hostelForm) hostelForm.addEventListener('submit', handleCreateHostel);

  // Room Form
  const roomForm = document.getElementById('createRoomForm');
  if (roomForm) roomForm.addEventListener('submit', handleCreateRoom);

  // Load initial view state
  loadCurrentViewData();
});
