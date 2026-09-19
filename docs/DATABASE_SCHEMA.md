# FleetGuard Database Schema & Data Models 🗄️

FleetGuard uses **PostgreSQL** (version 14+) with relational constraints, foreign keys, automated timestamp triggers, indexes, and custom algorithms for risk scoring.

---

## 📊 Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    ROLES ||--o{ USERS : "has"
    BRANCHES ||--o{ VEHICLES : "houses"
    USERS ||--o{ ASSIGNMENTS : "assigned as driver"
    VEHICLES ||--o{ ASSIGNMENTS : "assigned to"
    VEHICLES ||--o{ COMPLIANCE_DOCUMENTS : "holds"
    VEHICLES ||--o{ SERVICE_RECORDS : "undergoes"
    VEHICLES ||--o{ HISTORICAL_SERVICES : "recorded for"
    VEHICLES ||--o| MAINTENANCE_RISKS : "evaluated by"
    VEHICLES ||--o{ CHECKLISTS : "inspected via"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ OVERRIDE_LOGS : "manager author"

    ROLES {
        uuid id PK
        string name UK
        string description
    }

    USERS {
        uuid id PK
        string name
        string email UK
        string password_hash
        uuid role_id FK
        boolean is_active
        timestamp created_at
    }

    BRANCHES {
        uuid id PK
        string name
        string location
        string contact_email
        string contact_phone
    }

    VEHICLES {
        uuid id PK
        string make
        string model
        integer year
        string license_plate UK
        string vin UK
        string vehicle_type
        string status
        integer current_mileage
        uuid branch_id FK
        timestamp created_at
        timestamp updated_at
    }

    COMPLIANCE_DOCUMENTS {
        uuid id PK
        uuid vehicle_id FK
        string document_type
        string document_number
        date issue_date
        date expiry_date
        string file_path
        string status
    }

    SERVICE_RECORDS {
        uuid id PK
        uuid vehicle_id FK
        string service_type
        date service_date
        integer mileage_at_service
        integer next_service_mileage
        decimal labour_cost
        decimal parts_cost
        decimal total_cost
        string invoice_file_path
    }

    MAINTENANCE_RISKS {
        uuid id PK
        uuid vehicle_id FK
        string risk_level
        integer mileage_since_last_service
        integer km_remaining_to_service
        timestamp calculated_at
    }

    ASSIGNMENTS {
        uuid id PK
        uuid vehicle_id FK
        uuid driver_id FK
        timestamp assigned_date
        timestamp expected_return_date
        timestamp actual_return_date
        string status
    }

    CHECKLISTS {
        uuid id PK
        uuid vehicle_id FK
        uuid driver_id FK
        boolean tyres_ok
        boolean brakes_ok
        boolean lights_ok
        boolean horn_ok
        boolean mirrors_ok
        integer fuel_level_percent
        string notes
        timestamp submitted_at
    }
```

---

## 🗂️ Core Table Definitions & Constraints

### 1. `roles`
Stores standard system roles.
- `name`: `Admin`, `Fleet Manager`, `Driver`, `Service Center` (Unique).

### 2. `users`
System credentials and profile data.
- `role_id`: FK to `roles(id)` ON DELETE RESTRICT.
- `email`: Indexed, Unique, Case-insensitive.

### 3. `vehicles`
Core registry table.
- `status`: `CHECK (status IN ('Available', 'Assigned', 'Maintenance', 'Inactive'))`.
- `current_mileage`: `CHECK (current_mileage >= 0)`.
- `year`: `CHECK (year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE))`.

### 4. `compliance_documents`
Tracks compliance certificates.
- `document_type`: `CHECK (document_type IN ('Insurance', 'Inspection', 'PUC', 'Fitness Certificate'))`.
- `status`: `CHECK (status IN ('Valid', 'Expired', 'Pending'))`.
- `expiry_date`: `CHECK (expiry_date >= issue_date)`.

### 5. `service_records`
Logs maintenance events.
- `total_cost`: Automatically computed as `labour_cost + parts_cost` via PostgreSQL generated column:
  `total_cost NUMERIC(10,2) GENERATED ALWAYS AS (labour_cost + parts_cost) STORED`
- `next_service_mileage`: `CHECK (next_service_mileage >= mileage_at_service)`.

---

## ⚡ Maintenance Risk Scoring Engine

The maintenance risk calculation (`src/services/riskService.js`) dynamically evaluates a vehicle's breakdown probability based on service history and mileage.

### Formula & Logic:
1. **Recommended Service Interval**: Default `10,000 km` (configurable per vehicle type).
2. **Mileage Since Last Service**:
   $$\text{Mileage Since Service} = \text{Current Mileage} - \text{Last Service Mileage}$$
3. **Km Remaining**:
   $$\text{Remaining Km} = \text{Recommended Interval} - \text{Mileage Since Service}$$
4. **Risk Classification Rules**:

| Risk Level | Condition | Explanation |
|------------|-----------|-------------|
| 🔴 **HIGH** | $\text{Remaining Km} \le 0$ | Vehicle has exceeded recommended service interval. High probability of mechanical breakdown. |
| 🟡 **MEDIUM** | $0 < \text{Remaining Km} \le (0.15 \times \text{Interval})$ | Vehicle is within 15% (e.g. $\le 1,500\text{ km}$) of recommended service limit. Service due soon. |
| 🟢 **LOW** | $\text{Remaining Km} > (0.15 \times \text{Interval})$ | Vehicle is well within operational tolerances. |

---

## ⚙️ Automated Triggers & Functions

### Timestamp Auto-Update Trigger
```sql
CREATE OR REPLACE FUNCTION update_vehicle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_timestamp
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_timestamp();
```
