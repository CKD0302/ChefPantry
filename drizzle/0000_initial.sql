-- Create tables for Chef Pantry application

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Chefs table
CREATE TABLE IF NOT EXISTS "chefs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "full_name" TEXT NOT NULL,
  "bio" TEXT,
  "specialties" TEXT,
  "experience" TEXT,
  "hourly_rate" INTEGER,
  "availability" TEXT,
  "location" TEXT NOT NULL,
  "profile_image" TEXT
);

-- Businesses table
CREATE TABLE IF NOT EXISTS "businesses" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "business_type" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "contact_phone" TEXT,
  "profile_image" TEXT
);

-- Bookings table
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" SERIAL PRIMARY KEY,
  "chef_id" INTEGER NOT NULL REFERENCES "chefs"("id"),
  "business_id" INTEGER NOT NULL REFERENCES "businesses"("id"),
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "rate" INTEGER NOT NULL,
  "details" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);