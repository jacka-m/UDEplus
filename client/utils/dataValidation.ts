/**
 * Data validation boundaries for order metrics
 * Prevents outliers and invalid data from entering the ML model
 */

export interface DataBoundaries {
  payout: { min: number; max: number };
  miles: { min: number; max: number };
  estimatedTime: { min: number; max: number };
  numberOfStops: { min: number; max: number };
  actualTotalTime: { min: number; max: number };
  actualPay: { min: number; max: number };
}

// Define realistic boundaries based on delivery driver economics
export const ORDER_BOUNDARIES: DataBoundaries = {
  payout: {
    min: 1, // Minimum $1 per order
    max: 2500, // Absolute maximum - no delivery would be this much
  },
  miles: {
    min: 0.1, // At least 0.1 miles (very short delivery)
    max: 500, // Maximum 500 miles per order (unrealistic but safe boundary)
  },
  estimatedTime: {
    min: 1, // At least 1 minute
    max: 480, // Maximum 8 hours estimated time
  },
  numberOfStops: {
    min: 1, // At least 1 stop
    max: 100, // Maximum 100 stops per order
  },
  actualTotalTime: {
    min: 1, // At least 1 minute
    max: 480, // Maximum 8 hours
  },
  actualPay: {
    min: 1,
    max: 2500,
  },
};

export interface ValidationError {
  field: string;
  value: number;
  message: string;
  boundary: { min: number; max: number };
}

/**
 * Validate a single metric against boundaries
 */
export function validateMetric(
  field: keyof DataBoundaries,
  value: number
): ValidationError | null {
  if (value === null || value === undefined) {
    return null;
  }

  const boundary = ORDER_BOUNDARIES[field];

  if (value < boundary.min) {
    return {
      field,
      value,
      message: `${field} cannot be less than ${boundary.min}`,
      boundary,
    };
  }

  if (value > boundary.max) {
    return {
      field,
      value,
      message: `${field} cannot exceed ${boundary.max}`,
      boundary,
    };
  }

  return null;
}

/**
 * Validate all order metrics
 */
export function validateOrderData(data: {
  payout?: number;
  miles?: number;
  estimatedTime?: number;
  numberOfStops?: number;
  actualTotalTime?: number;
  actualPay?: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.payout !== undefined && data.payout !== null) {
    const payoutError = validateMetric("payout", data.payout);
    if (payoutError) errors.push(payoutError);
  }

  if (data.miles !== undefined && data.miles !== null) {
    const milesError = validateMetric("miles", data.miles);
    if (milesError) errors.push(milesError);
  }

  if (data.estimatedTime !== undefined && data.estimatedTime !== null) {
    const timeError = validateMetric("estimatedTime", data.estimatedTime);
    if (timeError) errors.push(timeError);
  }

  if (data.numberOfStops !== undefined && data.numberOfStops !== null) {
    const stopsError = validateMetric("numberOfStops", data.numberOfStops);
    if (stopsError) errors.push(stopsError);
  }

  if (data.actualTotalTime !== undefined && data.actualTotalTime !== null) {
    const actualTimeError = validateMetric(
      "actualTotalTime",
      data.actualTotalTime
    );
    if (actualTimeError) errors.push(actualTimeError);
  }

  if (data.actualPay !== undefined && data.actualPay !== null) {
    const actualPayError = validateMetric("actualPay", data.actualPay);
    if (actualPayError) errors.push(actualPayError);
  }

  return errors;
}

/**
 * Check if data has any validation errors
 */
export function hasValidationErrors(data: {
  payout?: number;
  miles?: number;
  estimatedTime?: number;
  numberOfStops?: number;
  actualTotalTime?: number;
  actualPay?: number;
}): boolean {
  return validateOrderData(data).length > 0;
}

/**
 * Get a user-friendly error message summarizing all validation issues
 */
export function getValidationErrorMessage(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  const messages = errors.map(
    (err) =>
      `${err.field}: ${err.value} is outside valid range (${err.boundary.min}-${err.boundary.max})`
  );

  return `Data validation failed:\n\n${messages.join("\n")}\n\nPlease correct these values before saving.`;
}
