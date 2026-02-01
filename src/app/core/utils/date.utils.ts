/**
 * Transform Date object to YYYY-MM-DD string format
 */
export function transformDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two date strings are equal (comparing only the date part)
 */
export function areDatesEqual(date1: string, date2: string): boolean {
  const formatDate = (date: string) => date.split('T')[0];
  return formatDate(date1) === formatDate(date2);
}

/**
 * Check if two timestamps are on the same day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

/**
 * Check if timestamp1 is before timestamp2 (day-wise comparison)
 */
export function isDayBefore(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  if (date1.getFullYear() < date2.getFullYear()) {
    return true;
  } else if (date1.getFullYear() === date2.getFullYear()) {
    if (date1.getMonth() < date2.getMonth()) {
      return true;
    } else if (date1.getMonth() === date2.getMonth()) {
      return date1.getDate() < date2.getDate();
    }
  }

  return false;
}
