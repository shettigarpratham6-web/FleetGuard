/**
 * Maintenance risk calculation utility.
 * Pure-function helpers that mirror the riskService logic for use outside of the DB layer.
 */

/** Default service interval in km */
export const DEFAULT_SERVICE_INTERVAL = 10000;

export interface RiskCalculationResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  remainingDistance: number;
  summary: string;
  distanceSinceLastService: number;
}

/**
 * Calculate risk level and summary from mileage data.
 */
export const calculateRisk = (
  currentMileage: number = 0,
  lastServiceMileage: number = 0,
  recommendedInterval: number = DEFAULT_SERVICE_INTERVAL
): RiskCalculationResult => {
  const distanceSinceLastService = currentMileage - lastServiceMileage;
  const remainingDistance = recommendedInterval - distanceSinceLastService;

  let riskLevel: 'Low' | 'Medium' | 'High';
  let summary: string;

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
 */
export const riskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'High':   return 'red';
    case 'Medium': return 'yellow';
    case 'Low':    return 'green';
    default:       return 'gray';
  }
};

/**
 * Check if a vehicle is overdue for service.
 */
export const isServiceOverdue = (
  currentMileage: number,
  lastServiceMileage: number,
  recommendedInterval: number = DEFAULT_SERVICE_INTERVAL
): boolean => {
  return (currentMileage - lastServiceMileage) >= recommendedInterval;
};

export default {
  DEFAULT_SERVICE_INTERVAL,
  calculateRisk,
  riskColor,
  isServiceOverdue
};
