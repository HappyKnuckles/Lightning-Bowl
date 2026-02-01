/**
 * Check if two arrays are equal (after sorting)
 */
export function areArraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
}

/**
 * Check if a value is a valid number between 0 and 10 (inclusive)
 */
export function isValidNumber0to10(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 10;
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): boolean {
  return !isNaN(parseFloat(value as string)) && isFinite(value as number);
}

/**
 * Parse a value to integer, return empty string if not a number
 */
export function parseIntValue(value: unknown): string | number {
  const parsedValue = parseInt(value as string, 10);
  return isNaN(parsedValue) ? '' : parsedValue;
}

/**
 * Calculate the difference between two stat values with percentage
 */
export function calculateStatDifference(currentValue: number, previousValue: number): string {
  if (previousValue === undefined) {
    return '0';
  }
  const difference = (currentValue - previousValue).toFixed(2);
  if (Number(difference) === 0) {
    return '0';
  }
  const percentageChange = previousValue === 0 ? '' : ((Number(difference) / previousValue) * 100).toFixed(2);
  const differenceWithSign = Number(difference) > 0 ? `+${difference}` : difference;
  return previousValue === 0 ? `${differenceWithSign}` : `${differenceWithSign} (${percentageChange}%)`;
}

/**
 * Get the arrow icon name based on value comparison
 */
export function getArrowIcon(currentValue: number, previousValue?: number): string {
  if (previousValue === undefined || currentValue === undefined) {
    return '';
  }
  if (currentValue === previousValue) {
    return '';
  }
  return currentValue > previousValue ? 'arrow-up' : 'arrow-down';
}

/**
 * Get the color for diff display based on value comparison
 */
export function getDiffColor(currentValue: number, previousValue?: number): string {
  if (previousValue === undefined || currentValue === undefined) {
    return '';
  }
  if (currentValue === previousValue) {
    return '';
  }
  return currentValue > previousValue ? 'success' : 'danger';
}
