/**
 * Simple logger utility that gates debug messages by NODE_ENV
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Always log errors and warnings
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  
  // Only log info and debug in development
  info: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  }
};