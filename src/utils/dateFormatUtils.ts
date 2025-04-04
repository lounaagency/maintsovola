
/**
 * Converts a Date object to an ISO string format or returns the original string
 * This helps with type compatibility when working with date fields
 */
export const formatDateToString = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  return date;
};
