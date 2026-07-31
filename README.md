# FleetGuard 🚛

**A Fleet Management & Compliance REST API** built with Node.js, Express, and PostgreSQL. FleetGuard helps organizations manage vehicle compliance, driver assignments, maintenance scheduling, risk scoring, pre-trip checklists, and notifications — all through a secure, role-aware API.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Access Control](#roles--access-control)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Initialization](#database-initialization)
  - [Seeding](#seeding)
  - [Running the Server](#running-the-server)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [File Uploads](#file-uploads)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

FleetGuard is a backend service designed for transport companies, logistics firms, and fleet operators who need centralized control over:

- **Vehicle compliance** — Track insurance, inspection, PUC, and fitness certificate documents with expiry monitoring
- **Driver-vehicle assignment** — Assign vehicles to drivers with override tracking and justification logs
- **Maintenance scheduling** — Log service records, track mileage, and auto-calculate maintenance risk scores
- **Pre-trip checklists** — Drivers submit daily vehicle inspection checklists before operating
- **Notifications** — In-app notification system for alerts and reminders
- **Branch management** — Organize vehicles across multiple branches/locations

The API uses JWT-based authentication with role-based authorization, automatic database schema initialization, and file upload support for compliance documents and service invoices.

---

## Features

- 🔐 **JWT Authentication** — Secure registration and login with bcrypt password hashing
- 👥 **Role-Based Access Control** — Four roles (Admin, Fleet Manager, Driver, Service Center) with granular permissions
- 🚗 **Vehicle Management** — Full CRUD with branch association, status tracking, and search/filter
- 📋 **Compliance Tracking** — Upload and track Insurance, Inspection, PUC, and Fitness Certificate documents with automatic expiry status
- 🔧 **Service Records** — Log maintenance with labour/parts cost tracking, invoice uploads, and auto mileage updates
- ⚠️ **Maintenance Risk Scoring** — Automatic Low/Medium/High risk calculation based on mileage since last service
- 📜 **Historical Services** — Backfill past service history for vehicles
- 🚦 **Driver Assignment** — Assign/return/cancel vehicle assignments with override support for non-available vehicles
- 📝 **Override Logs** — Track and justify manager overrides when assigning non-available vehicles
- ✅ **Pre-trip Checklists** — Drivers submit daily checklists (tyres, brakes, lights, horn, mirrors)
- 🔔 **Notifications** — Create, fetch, mark-as-read, and delete notifications per user
- 🏢 **Branch Management** — Multi-branch support with vehicle association and referential integrity checks
- 📁 **File Uploads** — Multer-powered uploads for compliance documents and service invoices (PDF, JPG, PNG, DOC/DOCX up to 5 MB)
- 🗄️ **Auto Schema Initialization** — Database tables, constraints, indexes, and triggers are created automatically on server startup

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Runtime       | Node.js (>= 18)                                 |
| Framework     | Express.js                                      |
| Database      | PostgreSQL (via `pg`)                           |
| Cloud DB      | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Auth          | JWT (`jsonwebtoken`) + `bcryptjs`               |
| File Upload   | Multer                                          |
| Environment   | `dotenv`                                        |
| Dev Tooling   | Nodemon                                         |

---

## Project Structure

```
FleetGuard/
│
├── backend/                         # Node.js + Express API server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # PostgreSQL connection pool (pg)
│   │   │   ├── initDb.js            # Auto-create tables, indexes, triggers
│   │   │   ├── env.js               # Environment configuration
│   │   │   ├── jwt.js               # JWT configuration
│   │   │   └── multer.js            # Multer storage configuration
│   │   ├── controllers/            # Route handlers (one per module)
│   │   │   ├── authController.js
│   │   │   ├── vehicleController.js
│   │   │   ├── complianceController.js
│   │   │   ├── serviceRecordController.js
│   │   │   ├── historicalServiceController.js
│   │   │   ├── maintenanceRiskController.js
│   │   │   ├── assignmentController.js
│   │   │   ├── overrideLogController.js
│   │   │   ├── checklistController.js
│   │   │   ├── notificationController.js
│   │   │   ├── branchController.js
│   │   │   ├── dashboardController.js
│   │   │   └── auditController.js
│   │   ├── routes/                  # Express routers (one per module)
│   │   │   ├── authRoutes.js
│   │   │   ├── vehicleRoutes.js
│   │   │   ├── complianceRoutes.js
│   │   │   ├── serviceRecordRoutes.js
│   │   │   ├── historicalServiceRoutes.js
│   │   │   ├── maintenanceRiskRoutes.js
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── overrideLogRoutes.js
│   │   │   ├── checklistRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── branchRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── auditRoutes.js
│   │   ├── services/               # Business logic layer
│   │   │   ├── riskService.js       # Maintenance risk calculation engine
│   │   │   ├── assignmentService.js
│   │   │   ├── auditService.js
│   │   │   ├── authService.js
│   │   │   ├── complianceService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── maintenanceService.js
│   │   │   ├── mileageService.js
│   │   │   └── notificationService.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification + role authorization
│   │   │   ├── upload.js            # Multer file upload middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   ├── uploadMiddleware.js
│   │   │   ├── validateRequest.js
│   │   │   └── errorHandler.js
│   │   ├── models/                  # Data model placeholders
│   │   ├── utils/
│   │   │   ├── complianceCalculator.js
│   │   │   ├── expiryChecker.js
│   │   │   ├── maintenanceRisk.js
│   │   │   ├── logger.js
│   │   │   └── responseFormatter.js
│   │   ├── jobs/
│   │   │   ├── expiryAlertJob.js
│   │   │   └── notificationJob.js
│   │   ├── seed/
│   │   │   ├── seedDb.js            # Full seed script (users, branches, vehicles, services)
│   │   │   ├── seedAdmin.js
│   │   │   ├── seedVehicles.js
│   │   │   └── seedDrivers.js
│   │   ├── app.js                  # Express app setup (routes, middleware, error handling)
│   │   └── server.js               # Server entry point (DB init + listen)
│   ├── uploads/                    # Uploaded compliance documents & invoices
│   │   ├── insurance/
│   │   ├── inspection/
│   │   ├── emissions/
│   │   └── service/
│   ├── package.json
│   ├── nodemon.json
│   └── .gitignore
│
├── frontend/                        # Frontend application (placeholder)
├── docs/                            # Project documentation (placeholder)
├── .gitignore
└── README.md
```

---

## Roles & Access Control

The API enforces role-based authorization on every route. JWT tokens carry the user's role, and the `authorize` middleware restricts access accordingly.

| Role            | Key Permissions                                                              |
|-----------------|------------------------------------------------------------------------------|
| **Admin**       | Full system access — all CRUD operations, delete vehicles/documents/services |
| **Fleet Manager** | Manage vehicles, branches, compliance, assignments, override logs, notifications |
| **Driver**      | Submit pre-trip checklists, view own assignments and checklists             |
| **Service Center** | Create and update service records, upload invoices                        |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** (local installation or cloud provider such as [Supabase](https://supabase.com))
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/shettigarpratham6-web/FleetGuard.git
cd FleetGuard

# Install backend dependencies
cd backend
npm install
```

### Environment Variables

Create a `backend/.env` file with the following variables:


> **Note:** If `DATABASE_URL` is provided, it takes precedence over individual `DB_*` variables. SSL is automatically enabled in production mode or when the connection string contains `supabase`.

### Database Initialization

The database schema (tables, constraints, indexes, and triggers) is **automatically created** when the server starts via `initDb.js`. You do not need to run SQL scripts manually — just ensure your PostgreSQL database exists and is reachable.

The initialization creates the following:
- All tables with proper constraints (CHECK, UNIQUE, FOREIGN KEY)
- Database indexes for query performance
- A trigger function (`update_vehicle_timestamp`) that auto-updates `updated_at` columns
- The `pgcrypto` extension for UUID generation

### Seeding

To populate the database with sample data (admin user, manager user, branch, vehicle, and service records):

```bash
cd backend
npm run seed
```

This will create:
- **Admin user** — `admin@fleetguard.com` / `admin123`
- **Fleet Manager** — `manager@fleetguard.com` / `manager123`
- **Main HQ Branch** — New York
- **Sample vehicle** — Toyota Prius (FG-01-NY-2026)
- **Sample service record** and **historical service entry**
- **Maintenance risk calculation** for the seeded vehicle

### Running the Server

```bash
# Development mode (with auto-reload via Nodemon)
cd backend
npm run dev

# Production mode
cd backend
npm start
```

The API will be available at `http://localhost:5000` (or your configured `PORT`).

Verify the server is running:

```bash
curl http://localhost:5000/
# → { "message": "Welcome to the FleetGuard API", "status": "online", "timestamp": "..." }
```

---

## Scripts

| Script             | Command           | Description                                      |
|--------------------|-------------------|--------------------------------------------------|
| Start (production) | `npm start`       | Runs `node src/server.js`                        |
| Start (development)| `npm run dev`     | Runs `nodemon src/server.js` (auto-reload)       |
| Seed database      | `npm run seed`    | Runs `node src/seed/seedDb.js` to populate sample data |

---

## API Reference

All routes are prefixed with `/api`. Authentication is handled via `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint       | Access  | Description                |
|--------|----------------|---------|----------------------------|
| POST   | `/api/auth/register` | Public | Register a new user    |
| POST   | `/api/auth/login`    | Public | Login and receive JWT  |
| GET    | `/api/auth/me`       | Auth   | Get current user profile |

### Branches

| Method | Endpoint           | Access                          | Description              |
|--------|---------------------|---------------------------------|--------------------------|
| POST   | `/api/branches`     | Admin, Fleet Manager            | Create a branch          |
| GET    | `/api/branches`     | Authenticated                   | List branches (filterable) |
| GET    | `/api/branches/:id`| Authenticated                   | Get branch by ID         |
| PUT    | `/api/branches/:id`| Admin, Fleet Manager            | Update branch            |
| DELETE | `/api/branches/:id`| Admin                           | Delete branch (if no vehicles assigned) |

### Vehicles

| Method | Endpoint           | Access                          | Description              |
|--------|---------------------|---------------------------------|--------------------------|
| POST   | `/api/vehicles`     | Admin, Fleet Manager            | Create a vehicle         |
| GET    | `/api/vehicles`     | Authenticated                   | List vehicles (filterable by branch, status, type, search) |
| GET    | `/api/vehicles/:id` | Authenticated                   | Get vehicle by ID (includes compliance documents) |
| PUT    | `/api/vehicles/:id` | Admin, Fleet Manager            | Update vehicle           |
| DELETE | `/api/vehicles/:id` | Admin                           | Delete vehicle           |

### Compliance Documents

| Method | Endpoint                          | Access                          | Description              |
|--------|-----------------------------------|---------------------------------|--------------------------|
| POST   | `/api/compliance`                 | Admin, Fleet Manager            | Upload compliance document (with file) |
| GET    | `/api/compliance`                 | Authenticated                   | List all documents (filterable by status, type, expiring_in_days) |
| GET    | `/api/compliance/vehicle/:vehicleId/status` | Authenticated          | Get vehicle compliance status (Compliant/Non-Compliant) |
| GET    | `/api/compliance/vehicle/:vehicleId` | Authenticated               | Get documents by vehicle |
| GET    | `/api/compliance/:id`            | Authenticated                   | Get document by ID       |
| PUT    | `/api/compliance/:id`            | Admin, Fleet Manager            | Update document (with optional file) |
| DELETE | `/api/compliance/:id`            | Admin                           | Delete document (removes file) |

### Service Records

| Method | Endpoint           | Access                                    | Description              |
|--------|---------------------|-------------------------------------------|--------------------------|
| POST   | `/api/services`     | Admin, Fleet Manager, Service Center     | Create service record (with optional invoice file) |
| GET    | `/api/services`     | Authenticated                             | List service records (filterable by vehicle, type) |
| GET    | `/api/services/:id` | Authenticated                             | Get service record by ID |
| PUT    | `/api/services/:id` | Admin, Fleet Manager, Service Center     | Update service record    |
| DELETE | `/api/services/:id` | Admin                                     | Delete service record    |

### Historical Services

| Method | Endpoint                                  | Access                          | Description              |
|--------|-------------------------------------------|---------------------------------|--------------------------|
| POST   | `/api/historical-services`                | Admin, Fleet Manager            | Log a historical service |
| GET    | `/api/historical-services/vehicle/:vehicleId` | Authenticated               | Get historical services by vehicle |
| DELETE | `/api/historical-services/:id`           | Admin                           | Delete historical service |

### Maintenance Risk

| Method | Endpoint                                  | Access                          | Description              |
|--------|-------------------------------------------|---------------------------------|--------------------------|
| GET    | `/api/maintenance-risks`                 | Authenticated                   | List all risk scores (filterable by risk_level) |
| GET    | `/api/maintenance-risks/vehicle/:vehicleId` | Authenticated                 | Get risk score for a vehicle (auto-calculates if missing) |
| POST   | `/api/maintenance-risks/calculate`        | Admin, Fleet Manager            | Trigger risk recalculation (single vehicle or all) |

### Assignments

| Method | Endpoint                    | Access                          | Description              |
|--------|-----------------------------|---------------------------------|--------------------------|
| POST   | `/api/assignments`          | Admin, Fleet Manager            | Assign vehicle to driver (with optional override) |
| GET    | `/api/assignments`          | Authenticated                   | List assignments (filterable by status, vehicle, driver) |
| GET    | `/api/assignments/:id`      | Authenticated                   | Get assignment by ID     |
| PUT    | `/api/assignments/:id/return`  | Admin, Fleet Manager         | Return vehicle (complete assignment) |
| PUT    | `/api/assignments/:id/cancel`  | Admin, Fleet Manager         | Cancel assignment        |

### Override Logs

| Method | Endpoint                | Access                          | Description              |
|--------|-------------------------|---------------------------------|--------------------------|
| POST   | `/api/override-logs`    | Admin, Fleet Manager            | Create override log      |
| GET    | `/api/override-logs`    | Admin, Fleet Manager            | List all override logs   |
| GET    | `/api/override-logs/:id`| Admin, Fleet Manager            | Get override log by ID   |

### Checklists

| Method | Endpoint                              | Access                          | Description              |
|--------|---------------------------------------|---------------------------------|--------------------------|
| POST   | `/api/checklists`                     | Authenticated (Driver)          | Submit a pre-trip checklist |
| GET    | `/api/checklists`                     | Admin, Fleet Manager            | List all checklists      |
| GET    | `/api/checklists/my-checklists`       | Authenticated                   | Get current user's checklists |
| GET    | `/api/checklists/vehicle/:vehicleId`  | Authenticated                   | Get checklists by vehicle |
| GET    | `/api/checklists/:id`                 | Authenticated                   | Get checklist by ID     |

### Notifications

| Method | Endpoint                  | Access                          | Description              |
|--------|---------------------------|---------------------------------|--------------------------|
| POST   | `/api/notifications`      | Admin, Fleet Manager            | Create a notification    |
| GET    | `/api/notifications`      | Authenticated                   | Get current user's notifications (filterable by is_read) |
| PUT    | `/api/notifications/:id/read` | Authenticated               | Mark notification as read |
| DELETE | `/api/notifications/:id`  | Authenticated                   | Delete notification     |

---

## Database Schema

The database uses PostgreSQL with UUID primary keys (via `pgcrypto`). All tables, constraints, indexes, and triggers are auto-created on server startup.

| Table                  | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| `roles`               | Role definitions                                               |
| `users`               | All system users with role, status, and credentials            |
| `branches`            | Branch/locations with manager and contact info                |
| `vehicles`            | Vehicle registry with compliance status and branch association |
| `compliance_documents`| Uploaded compliance files (Insurance, Inspection, PUC, Fitness) with expiry dates |
| `service_records`     | Maintenance/service history with costs and invoice uploads    |
| `historical_services` | Backfilled past service entries                                |
| `maintenance_risks`   | Auto-calculated risk scores (Low/Medium/High) per vehicle     |
| `assignments`         | Driver-vehicle assignment records with status tracking         |
| `override_logs`       | Manager override justifications for non-available vehicles    |
| `checklists`          | Pre-trip inspection checklist submissions                      |
| `notifications`       | User-targeted alerts and messages                              |

### Key Constraints

- **Users** — Role must be one of: `Admin`, `Fleet Manager`, `Driver`, `Service Center`
- **Vehicles** — Status must be: `Available`, `Assigned`, `Maintenance`, or `Inactive`; mileage ≥ 0; manufacturing year between 1900 and current year
- **Compliance Documents** — Type must be: `Insurance`, `Inspection`, `PUC`, or `Fitness Certificate`; status must be `Valid`, `Expired`, or `Pending`; expiry date ≥ issue date
- **Service Records** — Mileage ≥ 0; costs ≥ 0; `total_cost` is a generated column (`labour_cost + parts_cost`); `next_service_mileage` ≥ `current_mileage`
- **Maintenance Risks** — Risk level must be `Low`, `Medium`, or `High`; one record per vehicle (unique constraint)
- **Assignments** — Status must be `Active`, `Completed`, or `Cancelled`
- **Override Logs** — Approval status must be `Approved`, `Rejected`, or `Pending`
- **Branches** — Cannot be deleted if vehicles are associated

### Maintenance Risk Calculation

The risk service (`riskService.js`) calculates risk based on:
- **Current mileage** vs. **last service mileage** vs. **recommended interval** (default: 10,000 km)
- **Remaining distance** = recommended interval − (current mileage − last service mileage)
- **Risk levels:**
  - `High` — Service is overdue (remaining ≤ 0)
  - `Medium` — Service due soon (remaining ≤ 15% of interval)
  - `Low` — Vehicle is in good health

Risk is automatically recalculated when service records are created, updated, or deleted.

---

## Configuration

### Nodemon

The development server uses Nodemon with the following configuration (`backend/nodemon.json`):

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.spec.js"],
  "exec": "node src/server.js"
}
```

### Database Connection

The database connection (`backend/src/config/db.js`) supports:
- **Connection string** via `DATABASE_URL` (recommended for Supabase/cloud)
- **Individual credentials** via `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- **Automatic SSL** — Enabled in production (`NODE_ENV=production`) or when `DB_SSL=true` or when the connection string contains `supabase`
- **Connection pooling** — Uses `pg.Pool` for efficient connection management

---

## File Uploads

File uploads are handled by Multer with the following configuration:

| Setting           | Value                                              |
|-------------------|----------------------------------------------------|
| Storage           | Disk storage (`backend/uploads/`)                  |
| Max file size     | 5 MB                                               |
| Allowed formats   | PDF, JPG, JPEG, PNG, DOC, DOCX                     |
| File naming       | `<fieldname>-<timestamp>-<random>.<extension>`     |

Uploaded files are served statically at `/uploads/` and stored in the `backend/uploads/` directory with subdirectories for:
- `insurance/`
- `inspection/`
- `emissions/`
- `service/`

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Guidelines

- Follow the existing code style and project structure
- Ensure all new routes are protected with appropriate `auth` and `authorize` middleware
- Test your changes against a PostgreSQL database before submitting
- Update the seed script if new tables or sample data are added

---

## License

This project is for academic and demonstration purposes.
