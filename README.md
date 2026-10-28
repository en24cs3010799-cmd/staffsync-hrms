# StaffSync - Modern HR Management Solution

A MERN stack (MongoDB, Express, React, Node) web app that digitizes core HR work.
Three roles with separate access: **HR**, **Manager**, **Employee**. Auth uses **JWT**, UI uses **Bootstrap 5**.

## Features

| Role | What they can do |
|------|------------------|
| **HR** | Manage employees (add / edit / delete / deactivate), approve or reject any leave, view everyone's attendance, post announcements and news, create trainings |
| **Manager** | See own team, approve or reject team leave requests, view team attendance, create and assign training programs to team members |
| **Employee** | Apply for leave (and cancel pending ones), mark attendance (check-in / check-out), edit personal details and password, read announcements, see assigned trainings |

## Project structure

```
staffsync/
├── server/                 Express + MongoDB REST API
│   ├── config/db.js
│   ├── middleware/auth.js  JWT protect + role authorize
│   ├── models/             User, Leave, Attendance, Announcement, Training
│   ├── routes/             auth, users, leaves, attendance, announcements, training, dashboard
│   ├── seed.js             demo data
│   └── server.js
└── client/                 React (Vite) + Bootstrap UI
    └── src/
        ├── context/AuthContext.jsx
        ├── components/     Layout (sidebar), ProtectedRoute, Modal, ...
        └── pages/          Login, Dashboard, Employees, Leaves, Attendance,
                            Announcements, Training, Profile
```

## Prerequisites

Node.js 16+ (18+ recommended for Vite 5), npm 8+, MongoDB Community Server running locally
(or a MongoDB Atlas connection string).

## Setup & run

### 1. Backend

```bash
cd server
npm install
# .env is already provided; edit MONGO_URI / JWT_SECRET if needed (see .env.example)
npm run seed        # optional: inserts demo users and data
npm run dev         # API on http://localhost:5000
```

### 2. Frontend (new terminal)

```bash
cd client
npm install
npm run dev         # App on http://localhost:5173
```

Vite proxies `/api` to `http://localhost:5000`, so no extra config is needed.
https://staffsync-hrms-2.onrender.com
https://staffsync-hrms-1.onrender.com

### Demo logins (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| HR | hr@staffsync.com | hr12345 |
| Manager | manager@staffsync.com | manager123 |
| Employee | employee@staffsync.com | employee123 |

> The seeded employees report to the seeded manager, so the manager sees them as "My Team".
> Change `JWT_SECRET` and the demo passwords before any real deployment.

## API overview

All routes except login need `Authorization: Bearer <token>`.

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any |
| GET / POST | `/api/users` | HR, Manager (list) / HR (create) |
| PUT / DELETE | `/api/users/:id` | HR |
| PUT | `/api/users/me` | any (own profile + password) |
| POST | `/api/leaves` | any (apply) |
| GET | `/api/leaves/my` | any |
| GET | `/api/leaves` | HR (all), Manager (team) |
| PUT | `/api/leaves/:id/status` | HR, Manager (team only) |
| DELETE | `/api/leaves/:id` | owner, pending only |
| POST | `/api/attendance/checkin` , `/checkout` | any |
| GET | `/api/attendance/today` , `/my` | any |
| GET | `/api/attendance?date=YYYY-MM-DD` | HR (all), Manager (team) |
| GET | `/api/announcements` | any |
| POST / PUT / DELETE | `/api/announcements[/:id]` | HR |
| GET | `/api/training` | HR (all), Manager (own), Employee (assigned) |
| POST / PUT / DELETE | `/api/training[/:id]` | HR, Manager (own) |
| GET | `/api/dashboard/stats` | any (role based numbers) |

## Notes

- Passwords are hashed with bcrypt; JWTs expire after 7 days (`JWT_EXPIRES_IN`).
- One attendance record per employee per day (unique index). Less than 4 hours worked is marked "Half Day".
- A manager cannot review their own leave; only HR can approve a manager's leave.
- HR creating an employee without a password gives them the default `Welcome@123`.
