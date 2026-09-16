/**
 * Maintenance risk calculation utility.
 * Pure-function helpers that mirror the riskService logic for use outside of the DB layer.
 */

/** Default service interval in km */
const DEFAULT_SERVICE_INTERVAL = 10000;

/**
 * Calculate risk level and summary from mileage data.
 * @param {number} currentMileage - Current vehicle mileage
 * @param {number} lastServiceMileage - Mileage at last service
 * @param {number} recommendedInterval - Recommended service interval in km
 * @returns {{ riskLevel: string, remainingDistance: number, summary: string }}
 */
const calculateRisk = (
  currentMileage = 0,
  lastServiceMileage = 0,
  recommendedInterval = DEFAULT_SERVICE_INTERVAL
) => {
  const distanceSinceLastService = currentMileage - lastServiceMileage;
  const remainingDistance = recommendedInterval - distanceSinceLastService;

  let riskLevel;
  let summary;

  if (remainingDistance <= 0) {
    riskLevel = 'High';
    summary =
      remainingDistance < 0
        ? `High maintenance risk: vehicle has exceeded its recommended service interval by ${Math.abs(remainingDistance)} km. Immediate servicing required.`
        : `High maintenance risk: vehicle has reached its recommended service interval. Immediate servicing required.`;
  } else if (remainingDistance <= 1000) {
    riskLevel = 'Medium';
    summary = `Medium maintenance risk: only ${remainingDistance} km remain before the next scheduled service. Plan maintenance soon.`;
  } else {
    riskLevel = 'Low';
    summary = `Low maintenance risk: approximately ${remainingDistance} km remain before the next scheduled service.`;
  }

  return { riskLevel, remainingDistance, summary, distanceSinceLastService };
};

/**
 * Determine the risk badge color for UI display.
 * @param {string} riskLevel - 'Low' | 'Medium' | 'High'
 * @returns {string} CSS color class suggestion
 */
const riskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'High':   return 'red';
    case 'Medium': return 'yellow';
    case 'Low':    return 'green';
    default:       return 'gray';
  }
};

/**
 * Check if a vehicle is overdue for service.
 * @param {number} currentMileage
 * @param {number} lastServiceMileage
 * @param {number} recommendedInterval
 * @returns {boolean}
 */
const isServiceOverdue = (
  currentMileage,
  lastServiceMileage,
  recommendedInterval = DEFAULT_SERVICE_INTERVAL
) => {
  return (currentMileage - lastServiceMileage) >= recommendedInterval;
};

module.exports = {
  DEFAULT_SERVICE_INTERVAL,
  calculateRisk,
  riskColor,
  isServiceOverdue
};
