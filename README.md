# FleetGuard 🚛

**A full-stack Fleet Management & Compliance System** built with the MERN stack. FleetGuard helps organizations manage vehicle compliance, driver assignments, maintenance scheduling, and real-time notifications — all from a single, role-aware platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Access](#roles--access)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Modules](#api-modules)
- [Database Collections](#database-collections)
- [Documentation](#documentation)
- [Docker Setup](#docker-setup)

---

## Overview

FleetGuard is designed for transport companies, logistics firms, and fleet operators who need centralized control over:

- Vehicle compliance (insurance, inspection, emissions)
- Driver-vehicle assignment with override tracking
- Maintenance scheduling and risk scoring
- Pre-trip checklists
- Audit logs and role-based dashboards

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React (Vite), Tailwind CSS, React Router        |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB (Mongoose ODM)                          |
| Auth       | JWT (JSON Web Tokens)                           |
| File Upload| Multer                                          |
| Scheduling | Node-cron (expiry alert jobs)                   |
| DevOps     | Docker, docker-compose                          |

---

## Project Structure

```
FleetGuard/
│
├── frontend/                        # React + Vite client
│   ├── public/                      # Static assets (favicon, logo, manifest)
│   └── src/
│       ├── assets/                  # Icons, images, illustrations
│       ├── components/
│       │   ├── common/              # Reusable UI (Navbar, Sidebar, Button, Modal…)
│       │   ├── dashboard/           # Stats, compliance/risk/cost charts, alerts
│       │   ├── vehicles/            # Vehicle cards, forms, compliance status
│       │   ├── assignment/          # Assign vehicle, override modal, driver card
│       │   ├── maintenance/         # Service forms, risk indicator, mileage tracker
│       │   ├── checklist/           # Pre-trip checklist form and items
│       │   └── notifications/       # Notification bell and list
│       ├── pages/
│       │   ├── auth/                # Login, Unauthorized
│       │   ├── dashboard/           # Role-specific dashboards (Admin, Fleet, Driver, Service)
│       │   ├── vehicles/            # List, Details, Add, Edit
│       │   ├── assignment/          # Assignment page and logs
│       │   ├── maintenance/         # Maintenance page, service queue, service details
│       │   ├── checklist/           # Pre-trip checklist page
│       │   ├── notifications/       # Notifications page
│       │   └── profile/             # User profile
│       ├── layouts/                 # Role-based layouts (Admin, Driver, Fleet, Service)
│       ├── routes/                  # AppRoutes, ProtectedRoute, RoleRoute
│       ├── services/                # Axios API service wrappers per module
│       ├── context/                 # AuthContext, NotificationContext
│       ├── hooks/                   # useAuth, useNotification, useRole
│       ├── utils/                   # Date utils, validators, constants, helpers
│       └── styles/                  # globals.css, tailwind.css
│
├── backend/                         # Node.js + Express API server
│   ├── src/
│   │   ├── config/                  # DB, JWT, Multer, env config
│   │   ├── models/                  # Mongoose schemas (User, Vehicle, Assignment…)
│   │   ├── controllers/             # Route handlers per module
│   │   ├── routes/                  # Express routers per module
│   │   ├── services/                # Business logic layer
│   │   ├── middleware/              # Auth, role, upload, error, validation
│   │   ├── utils/                   # Compliance calculator, expiry checker, risk scorer
│   │   ├── jobs/                    # Cron jobs for expiry alerts and notifications
│   │   └── seed/                    # Seed scripts for admin, vehicles, drivers
│   └── uploads/                     # Uploaded compliance documents
│       ├── insurance/
│       ├── inspection/
│       ├── emissions/
│       └── service/
│
├── docs/                            # Project documentation
│   ├── PRD.md
│   ├── ER-Diagram.png
│   ├── DatabaseSchema.pdf
│   ├── API_Documentation.md
│   ├── UserStories.md
│   ├── ClickUp_Tickets.pdf
│   ├── SprintReports/
│   ├── UI-Wireframes/
│   └── Presentation.pptx
│
├── README.md
├── .gitignore
└── docker-compose.yml
```

---

## Roles & Access

| Role            | Dashboard                  | Key Permissions                                          |
|-----------------|----------------------------|----------------------------------------------------------|
| Admin           | AdminDashboard             | Full system access, audit logs, user management          |
| Fleet Manager   | FleetManagerDashboard      | Vehicle management, assignments, compliance oversight     |
| Driver          | DriverDashboard            | Pre-trip checklist, view assigned vehicle, notifications  |
| Service Center  | ServiceCenterDashboard     | View/update service queue, log service records           |

---

## Features

- **Compliance Tracking** — Upload and track insurance, inspection, and emissions documents with automatic expiry alerts
- **Driver Assignment** — Assign vehicles to drivers with validation; log overrides with justification
- **Maintenance Management** — Schedule services, track mileage, and score risk per vehicle
- **Pre-trip Checklists** — Drivers complete and submit daily checklists before operating a vehicle
- **Role-based Dashboards** — Each role sees a tailored view with relevant charts and stats
- **Notifications** — In-app notifications with bell indicator; background cron jobs for expiry alerts
- **Audit Logs** — Full audit trail for compliance-sensitive actions
- **Document Uploads** — Multer-powered file uploads per compliance category

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-org/fleetguard.git
cd FleetGuard
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

See [Environment Variables](#environment-variables) below. Create a `.env` file inside `backend/`.

### 4. Seed the database (optional)

```bash
cd backend
node src/seed/seedAdmin.js
node src/seed/seedVehicles.js
node src/seed/seedDrivers.js
```

### 5. Start development servers

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000` by default.

---

## Environment Variables

Create `backend/.env` with the following:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fleetguard
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
```

---

## API Modules

| Module              | Base Route             | Description                                  |
|---------------------|------------------------|----------------------------------------------|
| Authentication      | `/api/auth`            | Login, logout, token refresh                 |
| Vehicle Management  | `/api/vehicles`        | CRUD for vehicles                            |
| Compliance          | `/api/compliance`      | Document upload, status, expiry tracking     |
| Driver Assignment   | `/api/assignments`     | Assign/unassign vehicles, override logs      |
| Service Management  | `/api/maintenance`     | Service records, queue, risk scoring         |
| Dashboard           | `/api/dashboard`       | Aggregated stats per role                    |
| Notifications       | `/api/notifications`   | Fetch and mark notifications                 |
| Audit Logs          | `/api/audit`           | Read-only audit trail                        |

Full API reference: [`docs/API_Documentation.md`](docs/API_Documentation.md)

---

## Database Collections

| Collection           | Purpose                                              |
|----------------------|------------------------------------------------------|
| `Users`              | All system users with roles                          |
| `Vehicles`           | Vehicle registry with compliance status              |
| `ComplianceDocuments`| Uploaded compliance files with expiry dates          |
| `Assignments`        | Driver-vehicle assignment records                    |
| `OverrideLogs`       | Logged override actions with justifications          |
| `ServiceRecords`     | Maintenance and service history per vehicle          |
| `Checklists`         | Pre-trip checklist submissions                       |
| `Notifications`      | System-generated alerts and messages                 |
| `AuditLogs`          | Immutable log of all compliance-sensitive actions    |

ER diagram: [`docs/ER-Diagram.png`](docs/ER-Diagram.png)

---

## Documentation

All project documentation lives in the [`docs/`](docs/) folder:

- `PRD.md` — Product Requirements Document
- `API_Documentation.md` — Full REST API reference
- `UserStories.md` — Epics and user stories
- `DatabaseSchema.pdf` — Detailed schema definitions
- `ER-Diagram.png` — Entity Relationship diagram
- `UI-Wireframes/` — Figma/wireframe exports
- `SprintReports/` — Sprint-by-sprint progress reports
- `Presentation.pptx` — Project presentation deck

---

## Docker Setup

To run the entire stack with Docker:

```bash
docker-compose up --build
```

The `docker-compose.yml` at the project root spins up the frontend, backend, and a MongoDB instance together.

---

## License

This project is for academic and demonstration purposes.
