# FleetGuard API Reference 📡

Base URL: `http://localhost:5000/api` (or your configured production host).  
All protected endpoints require a valid JWT token sent in the HTTP Request Header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents
- [1. Authentication](#1-authentication)
- [2. Branches](#2-branches)
- [3. Vehicles](#3-vehicles)
- [4. Compliance Documents](#4-compliance-documents)
- [5. Service Records](#5-service-records)
- [6. Historical Services](#6-historical-services)
- [7. Maintenance Risk Scoring](#7-maintenance-risk-scoring)
- [8. Vehicle Assignments](#8-vehicle-assignments)
- [9. Override Logs](#9-override-logs)
- [10. Pre-trip Checklists](#10-pre-trip-checklists)
- [11. Notifications](#11-notifications)

---

## 1. Authentication

### `POST /api/auth/register`
- **Access**: Public
- **Description**: Registers a new user in the system.
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Driver"
}
```
*Allowed roles: `Admin`, `Fleet Manager`, `Driver`, `Service Center`*

### `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials and returns a JWT token.
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "c1f7a0a0-0000-0000-0000-000000000000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Driver"
  }
}
```

### `GET /api/auth/me`
- **Access**: Authenticated
- **Description**: Retrieves profile details of the logged-in user.

---

## 2. Branches

### `GET /api/branches`
- **Access**: Authenticated
- **Description**: List all registered branches.

### `POST /api/branches`
- **Access**: `Admin`, `Fleet Manager`
- **Request Body**:
```json
{
  "name": "North Logistics Hub",
  "location": "New York, NY",
  "contact_email": "north@fleetguard.com",
  "contact_phone": "+1-555-0199"
}
```

### `DELETE /api/branches/:id`
- **Access**: `Admin`
- **Description**: Deletes a branch if no vehicles are currently associated with it.

---

## 3. Vehicles

### `GET /api/vehicles`
- **Access**: Authenticated
- **Query Params**: `branch_id`, `status`, `vehicle_type`, `search`
- **Response Example**:
```json
[
  {
    "id": "e8d7123a-...",
    "make": "Toyota",
    "model": "Prius",
    "year": 2023,
    "license_plate": "FG-01-NY",
    "vin": "1HGCR2F83HA000000",
    "status": "Available",
    "current_mileage": 45000,
    "branch_id": "b1a234..."
  }
]
```

### `POST /api/vehicles`
- **Access**: `Admin`, `Fleet Manager`
- **Request Body**:
```json
{
  "make": "Volvo",
  "model": "FH16",
  "year": 2024,
  "license_plate": "FG-99-NY",
  "vin": "4V4NC9EJ8NN123456",
  "vehicle_type": "Truck",
  "current_mileage": 12000,
  "branch_id": "b1a234..."
}
```

---

## 4. Compliance Documents

### `POST /api/compliance`
- **Access**: `Admin`, `Fleet Manager`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `vehicle_id` (string/UUID)
  - `document_type` (`Insurance` | `Inspection` | `PUC` | `Fitness Certificate`)
  - `document_number` (string)
  - `issue_date` (YYYY-MM-DD)
  - `expiry_date` (YYYY-MM-DD)
  - `file` (File binary - PDF, PNG, JPG)

### `GET /api/compliance/vehicle/:vehicleId/status`
- **Access**: Authenticated
- **Description**: Evaluates if the vehicle has valid compliance documents.
- **Response**:
```json
{
  "vehicle_id": "e8d7123a-...",
  "compliance_status": "Compliant",
  "total_documents": 4,
  "expired_documents": 0
}
```

---

## 5. Service Records

### `POST /api/services`
- **Access**: `Admin`, `Fleet Manager`, `Service Center`
- **Content-Type**: `multipart/form-data` (or JSON if no invoice uploaded)
- **Request Body**:
```json
{
  "vehicle_id": "e8d7123a-...",
  "service_type": "Routine Maintenance",
  "service_date": "2026-08-01",
  "mileage_at_service": 45000,
  "next_service_mileage": 55000,
  "labour_cost": 150.00,
  "parts_cost": 200.00,
  "description": "Oil filter replacement and brake check"
}
```
*Note: `total_cost` (350.00) is automatically calculated by DB generated column.*

---

## 6. Historical Services

### `POST /api/historical-services`
- **Access**: `Admin`, `Fleet Manager`
- **Description**: Backfills service data prior to FleetGuard onboarding.

---

## 7. Maintenance Risk Scoring

### `GET /api/maintenance-risks`
- **Access**: Authenticated
- **Query Params**: `risk_level` (`Low`, `Medium`, `High`)

### `POST /api/maintenance-risks/calculate`
- **Access**: `Admin`, `Fleet Manager`
- **Request Body**: `{ "vehicle_id": "optional-uuid" }` (Omitting `vehicle_id` recalculates for all vehicles)

---

## 8. Vehicle Assignments

### `POST /api/assignments`
- **Access**: `Admin`, `Fleet Manager`
- **Request Body**:
```json
{
  "vehicle_id": "e8d7123a-...",
  "driver_id": "c1f7a0a0-...",
  "assigned_date": "2026-08-05T08:00:00Z",
  "expected_return_date": "2026-08-10T18:00:00Z",
  "override_required": false
}
```

### `PUT /api/assignments/:id/return`
- **Access**: `Admin`, `Fleet Manager`
- **Request Body**: `{ "return_mileage": 45800 }`

---

## 9. Override Logs

### `GET /api/override-logs`
- **Access**: `Admin`, `Fleet Manager`
- **Description**: Fetches manager justification logs recorded when assigning non-available vehicles.

---

## 10. Pre-trip Checklists

### `POST /api/checklists`
- **Access**: `Driver` (or Authenticated)
- **Request Body**:
```json
{
  "vehicle_id": "e8d7123a-...",
  "tyres_ok": true,
  "brakes_ok": true,
  "lights_ok": true,
  "horn_ok": true,
  "mirrors_ok": true,
  "fuel_level_percent": 85,
  "notes": "Vehicle clean and ready for trip"
}
```

---

## 11. Notifications

### `GET /api/notifications`
- **Access**: Authenticated
- **Query Params**: `is_read` (`true` / `false`)

### `PUT /api/notifications/:id/read`
- **Access**: Authenticated
- **Description**: Marks a specific notification as read.
