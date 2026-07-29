const db = require('../config/db');

/**
 * Get vehicles that require maintenance.
 * Categories:
 * 1. Overdue
 * 2. Due Soon
 * 3. Upcoming
 */
exports.getServiceQueue = async () => {
    const query = `
    SELECT
      v.id,
      v.vehicle_number,
      v.registration_number,
      v.manufacturer,
      v.model,
      v.current_mileage,

      sr.service_date,
      sr.next_service_date,
      sr.next_service_mileage,

      CASE
        WHEN sr.next_service_mileage IS NOT NULL
             AND v.current_mileage >= sr.next_service_mileage
          THEN 'Overdue'

        WHEN sr.next_service_mileage IS NOT NULL
             AND (sr.next_service_mileage - v.current_mileage) <= 1000
          THEN 'Due Soon'

        ELSE 'Upcoming'
      END AS service_status,

      CASE
        WHEN sr.next_service_mileage IS NOT NULL
          THEN (sr.next_service_mileage - v.current_mileage)
        ELSE NULL
      END AS mileage_remaining,

      CASE
        WHEN sr.next_service_date IS NOT NULL
          THEN (sr.next_service_date - CURRENT_DATE)
        ELSE NULL
      END AS days_remaining

    FROM vehicles v

    INNER JOIN (
      SELECT DISTINCT ON (vehicle_id)
        vehicle_id,
        service_date,
        next_service_date,
        next_service_mileage
      FROM service_records
      ORDER BY vehicle_id, service_date DESC
    ) sr
      ON sr.vehicle_id = v.id

    ORDER BY
      CASE
        WHEN sr.next_service_mileage IS NOT NULL
             AND v.current_mileage >= sr.next_service_mileage
          THEN 1

        WHEN sr.next_service_mileage IS NOT NULL
             AND (sr.next_service_mileage - v.current_mileage) <= 1000
          THEN 2

        ELSE 3
      END,

      sr.next_service_date ASC NULLS LAST;
  `;

    const { rows } = await db.query(query);

    return rows;
};