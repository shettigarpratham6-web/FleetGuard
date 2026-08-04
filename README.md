# FleetGuard 🚛

**A Full-Stack Fleet Management & Compliance System** built with Node.js, Express, PostgreSQL / Supabase, Next.js 15, React 19, and Tailwind CSS. FleetGuard enables transport companies, logistics operators, and fleet managers to handle vehicle compliance, driver assignments, maintenance scheduling, risk scoring, pre-trip checklists, and real-time notifications — all through a secure, role-aware REST API and modern web dashboard.

---

## 📚 Documentation Index

For detailed guides and deep dives into specific topics, check out our [`docs/`](./docs) folder:

- 🏗️ **[System Architecture](./docs/ARCHITECTURE.md)** — Architectural design, security layers, RBAC policies, and data flow.
- 📡 **[API Reference](./docs/API_REFERENCE.md)** — Complete endpoint specifications, payload schemas, headers, and status codes.
- 🗄️ **[Database Schema & Models](./docs/DATABASE_SCHEMA.md)** — PostgreSQL tables, foreign key constraints, triggers, indexes, and risk scoring formulas.
- 🚀 **[Setup & Deployment Guide](./docs/SETUP_GUIDE.md)** — Step-by-step local development setup, environment variables, Supabase connection, and seeding.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Access Control](#roles--access-control)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running Backend & Frontend](#running-backend--frontend)
- [API Quick Reference](#api-quick-reference)
- [Database Schema Overview](#database-schema-overview)
- [File Uploads](#file-uploads)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

FleetGuard provides a centralized hub for fleet operations, solving common compliance and logistics challenges:

- 🛡️ **Vehicle Compliance** — Expiry monitoring for Insurance, Inspection, PUC, and Fitness Certificates.
- 👨‍✈️ **Driver Assignments** — Role-checked vehicle assignments with manager override logs for special cases.
- 🔧 **Maintenance Scheduling & Risk Scoring** — Service history logging, mileage tracking, and automatic risk rating (Low / Medium / High).
- 📝 **Pre-trip Checklists** — Daily safety checks (tyres, brakes, lights, mirrors) submitted directly by drivers.
- 🔔 **In-App Notifications** — Real-time alerts for expiring documents, pending services, and assignment changes.
- 🏢 **Multi-Branch Operations** — Branch-level grouping and access control for multi-location fleets.

---

## Key Features

- 🔐 **JWT Authentication & Security** — Hashed passwords (`bcryptjs`), stateless JWT tokens, and strict role validation middleware.
- 👥 **Granular RBAC** — 4 distinct user roles: **Admin**, **Fleet Manager**, **Driver**, and **Service Center**.
- 🚗 **Vehicle Operations** — Complete lifecycle management: status updates (`Available`, `Assigned`, `Maintenance`, `Inactive`), mileage sync, and document links.
- 📄 **Compliance Document Management** — Upload and track PDFs/Images for compliance with auto-calculated expiry statuses (`Valid`, `Expired`, `Pending`).
- ⚡ **Auto-Calculating Risk Engine** — Calculates mileage since last service vs. maintenance intervals to predict breakdown risks.
- 📋 **Pre-Trip Safety Inspections** — Standardized checklist forms for drivers before operating any vehicle.
- 📂 **Auto DB Schema Initialization** — DB tables, indexes, UUID extensions (`pgcrypto`), and triggers are auto-created on server launch.
- 🎨 **Modern Next.js 15 Dashboard** — High-performance frontend powered by React 19, TypeScript, and Tailwind CSS v4.

---

## Tech Stack

### Backend
| Component     | Technology                                      |
|---------------|-------------------------------------------------|
| Runtime       | Node.js (v18+)                                  |
| Framework     | Express.js                                      |
| Database      | PostgreSQL / Supabase (`pg`, `@supabase/supabase-js`) |
| Authentication| JWT (`jsonwebtoken`) + `bcryptjs`               |
| File Uploads  | Multer                                          |
| Tooling       | Nodemon, `dotenv`                               |

### Frontend
| Component     | Technology                                      |
|---------------|-------------------------------------------------|
| Framework     | Next.js 15 (App Router, Turbopack)              |
| UI Library    | React 19                                        |
| Styling       | Tailwind CSS v4, Lucide React Icons             |
| Language      | TypeScript                                      |
| Firebase      | Firebase Web SDK                                |

---

## Project Structure

```
FleetGuard/
├── backend/                         # Express.js REST API Server
│   ├── src/
│   │   ├── config/                  # DB pool, JWT, Multer, env configs
│   │   │   ├── db.js
│   │   │   ├── initDb.js            # Auto-table & trigger creation
│   │   │   ├── env.js
│   │   │   ├── jwt.js
│   │   │   └── multer.js
│   │   ├── controllers/             # Request handlers per module
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # Business logic (risk, compliance, assignments)
│   │   ├── middleware/              # Auth, role check, upload & error handling
│   │   ├── utils/                   # Loggers, calculators, response formatters
│   │   ├── jobs/                    # Expiry & alert background jobs
│   │   ├── seed/                    # Seed scripts for initial setup
│   │   ├── app.js                   # Express app setup
│   │   └── server.js                # Server entry point
│   ├── uploads/                     # Storage for document & invoice uploads
│   └── package.json
│
├── frontend/                        # Next.js 15 Web Application
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages (login, dashboard, etc.)
│   │   ├── components/              # Reusable UI components
│   │   └── services/                # API integration client
│   └── package.json
│
├── docs/                            # Project Documentation
│   ├── README.md                    # Documentation index
│   ├── ARCHITECTURE.md              # System design & architecture
│   ├── API_REFERENCE.md             # Complete API documentation
│   ├── DATABASE_SCHEMA.md           # ERD & DB documentation
│   └── SETUP_GUIDE.md               # Detailed installation guide
│
├── .gitignore
└── README.md                        # Primary project README
```

---

## Roles & Access Control

Permissions are enforced at the API layer via JWT tokens and role verification middleware (`authMiddleware.js` & `roleMiddleware.js`):

| Role            | Scope & Capabilities |
|-----------------|----------------------|
| 👑 **Admin** | Full system permissions: create/edit/delete any record, assign roles, manage system parameters. |
| 💼 **Fleet Manager** | Manage vehicles, branches, compliance documents, vehicle assignments, view override logs, send notifications. |
| 🚚 **Driver** | View assigned vehicle details, submit daily pre-trip checklists, check notification history. |
| 🔧 **Service Center** | Log new service records, update maintenance status, upload repair invoices. |

---

## Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** instance (Local installation or [Supabase](https://supabase.com))
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shettigarpratham6-web/FleetGuard.git
   cd FleetGuard
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# PostgreSQL / Supabase Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/fleetguard
# OR individual parameters:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=password
# DB_DATABASE=fleetguard
# DB_SSL=false
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

---

### Database Setup & Seeding

1. **Automatic Initialization:**
   When you start the backend server, `initDb.js` automatically creates all required tables, constraints, indexes, triggers, and the `pgcrypto` extension.

2. **Seed Sample Data:**
   To populate the database with default accounts, branches, vehicles, and compliance records:
   ```bash
   cd backend
   npm run seed
   ```

   **Default Accounts Created:**
   - 👑 **Admin:** `admin@fleetguard.com` / `admin123`
   - 💼 **Fleet Manager:** `manager@fleetguard.com` / `manager123`

---

### Running Backend & Frontend

#### Start Backend API:
```bash
cd backend
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```
*API will run at `http://localhost:5000`*

#### Start Frontend Web App:
```bash
cd frontend
# Development mode
npm run dev
```
*Frontend will run at `http://localhost:3000`*

---

## API Quick Reference

All endpoints are prefixed with `/api`. For full details, see the [API Reference Documentation](./docs/API_REFERENCE.md).

| Category | Method | Endpoint | Access |
|----------|--------|----------|--------|
| **Auth** | `POST` | `/api/auth/login` | Public |
| **Auth** | `GET` | `/api/auth/me` | Authenticated |
| **Vehicles** | `GET` | `/api/vehicles` | Authenticated |
| **Vehicles** | `POST` | `/api/vehicles` | Admin, Manager |
| **Compliance** | `POST` | `/api/compliance` | Admin, Manager |
| **Compliance** | `GET` | `/api/compliance/vehicle/:vehicleId/status` | Authenticated |
| **Services** | `POST` | `/api/services` | Admin, Manager, Service Center |
| **Risks** | `GET` | `/api/maintenance-risks` | Authenticated |
| **Assignments** | `POST` | `/api/assignments` | Admin, Manager |
| **Checklists** | `POST` | `/api/checklists` | Driver |
| **Notifications**| `GET` | `/api/notifications` | Authenticated |

---

## Database Schema Overview

FleetGuard models complex logistics entities with full relational integrity:

```
[branches] ───< [vehicles] ───< [compliance_documents]
                     │     └───< [service_records]
                     │     └───< [maintenance_risks]
                     ├───< [assignments] >─── [users] (Driver)
                     ├───< [override_logs]
                     └───< [checklists]
```

Detailed definitions, foreign key rules, and calculation formulas are documented in [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md).

---

## File Uploads

Compliance certificates and service invoices are securely stored via **Multer**:
- **Supported Formats:** PDF, JPG, PNG, DOC, DOCX
- **Max File Size:** 5 MB
- **Storage Path:** `backend/uploads/` (categorized into `insurance/`, `inspection/`, `emissions/`, `service/`)

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repo and create your feature branch (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add AmazingFeature'`).
3. Push to the branch (`git push origin feature/AmazingFeature`).
4. Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
