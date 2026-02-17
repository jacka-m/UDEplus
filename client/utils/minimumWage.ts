/**
 * Minimum wage data by state (as of 2024)
 * ZIP codes are mapped to states for lookup
 */

const stateMinimumWages: Record<string, number> = {
  // State abbreviations mapped to hourly minimum wage
  AL: 7.25, // Alabama
  AK: 11.73, // Alaska
  AZ: 14.35, // Arizona
  AR: 11.0, // Arkansas
  CA: 16.5, // California
  CO: 15.08, // Colorado
  CT: 15.69, // Connecticut
  DE: 13.25, // Delaware
  FL: 14.0, // Florida
  GA: 7.25, // Georgia
  HI: 14.0, // Hawaii
  ID: 10.55, // Idaho
  IL: 14.0, // Illinois
  IN: 7.25, // Indiana
  IA: 7.25, // Iowa
  KS: 7.25, // Kansas
  KY: 7.25, // Kentucky
  LA: 7.25, // Louisiana
  ME: 14.15, // Maine
  MD: 15.13, // Maryland
  MA: 15.0, // Massachusetts
  MI: 10.33, // Michigan
  MN: 11.85, // Minnesota
  MS: 7.25, // Mississippi
  MO: 12.3, // Missouri
  MT: 12.3, // Montana
  NE: 14.02, // Nebraska
  NV: 12.0, // Nevada
  NH: 7.25, // New Hampshire
  NJ: 15.13, // New Jersey
  NM: 12.0, // New Mexico
  NY: 15.0, // New York
  NC: 7.25, // North Carolina
  ND: 7.25, // North Dakota
  OH: 10.45, // Ohio
  OK: 7.25, // Oklahoma
  OR: 15.45, // Oregon
  PA: 7.25, // Pennsylvania
  RI: 15.0, // Rhode Island
  SC: 7.25, // South Carolina
  SD: 12.2, // South Dakota
  TN: 7.25, // Tennessee
  TX: 7.25, // Texas
  UT: 7.25, // Utah
  VT: 15.67, // Vermont
  VA: 12.0, // Virginia
  WA: 16.28, // Washington
  WV: 8.75, // West Virginia
  WI: 7.25, // Wisconsin
  WY: 7.25, // Wyoming
};

// Simplified ZIP code to state mapping (first digit patterns)
// In production, use a proper ZIP code database
const zipCodeToState: Record<string, string> = {
  // Northeast
  "0": "MA",
  "1": "CT",
  "2": "NY",
  "3": "PA",
  "4": "NC",
  "5": "FL",
  "6": "IL",
  "7": "TX",
  "8": "CO",
  "9": "CA",
};

/**
 * Get minimum wage for a given ZIP code
 * Returns the state's minimum wage
 */
export function getMinimumWageByZip(zipCode: string): number {
  try {
    // Extract first digit of ZIP code for state mapping
    const firstDigit = zipCode.charAt(0);
    const state = zipCodeToState[firstDigit];

    if (state && stateMinimumWages[state]) {
      return stateMinimumWages[state];
    }

    // Default to federal minimum wage if lookup fails
    return 7.25;
  } catch (error) {
    console.error("Error looking up minimum wage:", error);
    return 7.25;
  }
}

/**
 * Get cost of living adjustment factor based on ZIP code
 * Higher in urban/high-cost areas
 */
export function getCostOfLivingFactor(zipCode: string): number {
  const firstDigit = zipCode.charAt(0);

  // High cost of living areas (generally)
  const highCostStates = ["CA", "MA", "NY", "WA", "CO"];
  const state = zipCodeToState[firstDigit];

  if (highCostStates.includes(state || "")) {
    return 1.3; // 30% adjustment for high cost areas
  }

  return 1.0; // No adjustment for standard cost areas
}

/**
 * Calculate order quality score adjustment based on regional minimum wage
 * Used in ML model to account for regional variation
 */
export function getWageAdjustmentFactor(
  orderPayout: number,
  zipCode: string
): number {
  const minWage = getMinimumWageByZip(zipCode);
  const costOfLiving = getCostOfLivingFactor(zipCode);

  // Adjusted minimum wage expectation
  const adjustedMinimumHourly = minWage * costOfLiving;

  // If payout is significantly above regional minimum, boost score
  // This makes the scoring relative to regional economic context
  const payoutPerHour = (orderPayout / 1.5) * costOfLiving; // Assume ~1.5 hour average order
  const wageMultiplier = payoutPerHour / adjustedMinimumHourly;

  return Math.min(Math.max(wageMultiplier, 0.5), 2.0); // Clamp between 0.5 and 2.0
}
