import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../server/db';

async function main() {
  console.log('Pushing schema to the database...');
  
  try {
    // This will push the schema to the database
    // It will create tables if they don't exist
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();