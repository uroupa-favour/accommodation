# 🏛️ OROUPA — Online Campus Accommodation Management System

A full-stack campus accommodation management web application with role-based bed space allocation, academic category restrictions, and real-time concurrency rules.

---

## ⚠️ Important Usage Notice: Accessing the Application

> [!IMPORTANT]
> Always access the application via **`http://localhost:5000`** in your browser.
> 
> **Do NOT open `index.html` directly as a local file (`file:///C:/.../index.html`)**. 
> Opening the HTML file directly prevents the browser from communicating with the live Node.js backend server and central database on port `5000`. Accessing `http://localhost:5000` ensures all registered accounts, bed space requests, and administrative approvals sync to the central server.

---

## 🔑 System Login Credentials

Use the credentials below to log in via the **Login** modal on `http://localhost:5000`.

### 🛡️ System Administrator Account
| Field | Credential |
| :--- | :--- |
| **Role** | System Administrator (Full Access) |
| **Email** | `admin@campus.edu` |
| **Password** | `admin123` |

### 🎓 Preset Student Accounts
| Full Name | Academic Category | Matriculation No. | Email Address | Password |
| :--- | :--- | :--- | :--- | :--- |
| **David Adeleke** | `PREDEGREE` | `PRE/2026/001` | `predegree@campus.edu` | `student123` |
| **Ngozi Okonjo** | `UNDERGRADUATE` | `UG/2026/001` | `undergrad@campus.edu` | `student123` |
| **Emeka Nwosu** | `UNDERGRADUATE` | `UG/2026/002` | `undergrad2@campus.edu` | `student123` |

### ✨ Registering New Student Accounts
You can also register custom new student accounts directly in the browser by clicking **Register Account** at the top right of the platform header.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
From the project root:
```bash
npm run build
```
*(Or navigate to `backend/` and run `npm install`)*

### 2. Launch the Application
From the project root:
```bash
npm start
```
The server will start on **`http://localhost:5000`**. Open your browser and navigate to `http://localhost:5000`.

---

## ☁️ Deployment on Render

This project is configured as a unified full-stack Node.js application where the Express backend serves both the REST API (`/api/*`) and the frontend static assets.

### Option 1: Automatic Blueprint Deployment (Recommended)
1. Push your repository to GitHub.
2. In your [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render reads [`render.yaml`](./render.yaml) automatically and configures your Web Service with the proper build and start commands.

### Option 2: Manual Web Service Setup
1. In Render, select **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: Leave blank (defaults to root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. In the **Environment Variables** tab, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(A secure random string)*
   - `DATABASE_URL`: *(Your PostgreSQL database connection string, or leave empty to use the built-in zero-config In-Memory DB)*
5. Click **Deploy Web Service**.

---

## 🗄️ Database Setup (Optional PostgreSQL)

The application includes an **in-memory database fallback** that starts immediately with pre-seeded demo accounts with zero setup.

To use a persistent PostgreSQL database (e.g. Render PostgreSQL, Supabase, Neon):
1. Add the `DATABASE_URL` connection string to your environment variables.
2. Run database migration and seeding:
```bash
npm run seed
```

---

## 📦 Pushing to GitHub

Ensure Git is installed on your machine:
```bash
git init
git add .
git commit -m "Initial commit: OROUPA Accommodation System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## ⚙️ Core Business & Allocation Rules

1. **One Space = One Student**:
   - Each bed space (`AVAILABLE`, `RESERVED`, `OCCUPIED`) can only be allocated to a single student at any given time.
2. **One Active Booking Per Student**:
   - Students are restricted to 1 active booking (`PENDING` or `APPROVED`). Attempting a 2nd booking will return a conflict error.
3. **Academic Category Match**:
   - `PREDEGREE` students can only see and book spaces in `PREDEGREE` rooms.
   - `UNDERGRADUATE` students can only see and book spaces in `UNDERGRADUATE` rooms.
4. **Approval & Cancellation Lifecycle**:
   - Submitting a request sets space status to `RESERVED` and booking status to `PENDING`.
   - Admin approval sets space status to `OCCUPIED` and booking status to `APPROVED`.
   - Student or Admin cancellation returns space status to `AVAILABLE`.
