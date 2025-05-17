import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Use the DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

// Check if DATABASE_URL is defined
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not defined');
  process.exit(1);
}

// Create a postgres connection
const client = postgres(connectionString, { max: 1 });

// Create drizzle instance with our schema
export const db = drizzle(client, { schema });