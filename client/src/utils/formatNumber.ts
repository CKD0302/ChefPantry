/**
 * Formats a number with commas as thousands separators and adds a plus sign
 * 
 * @param num The number to format
 * @returns Formatted string (e.g., "1,234+")
 */
export function formatNumberWithPlus(num: number): string {
  // Use US English locale to format with commas
  const formatted = num.toLocaleString('en-US');
  return `${formatted}+`;
}