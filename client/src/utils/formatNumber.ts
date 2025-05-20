/**
 * Formats a number with commas as thousands separators
 * 
 * @param num The number to format
 * @returns Formatted string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  // Use US English locale to format with commas
  return num.toLocaleString('en-US');
}