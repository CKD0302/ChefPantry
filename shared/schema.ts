import { pgTable, text, serial, integer, boolean, timestamp, uuid, time, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chefs table
export const chefs = pgTable("chefs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  specialties: text("specialties"),
  experience: text("experience"),
  hourlyRate: integer("hourly_rate"),
  availability: text("availability"),
  location: text("location").notNull(),
  profileImage: text("profile_image"),
});

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  businessType: text("business_type").notNull(),
  location: text("location").notNull(),
  contactPhone: text("contact_phone"),
  profileImage: text("profile_image"),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  chefId: integer("chef_id").references(() => chefs.id).notNull(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("pending"),
  rate: integer("rate").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chef Profiles table (Supabase integration)
export const chefProfiles = pgTable("chef_profiles", {
  id: text("id").primaryKey(), // UUID from Supabase auth
  fullName: text("full_name").notNull(),
  bio: text("bio").notNull(),
  skills: text("skills").array().notNull(),
  experienceYears: integer("experience_years").notNull(),
  location: text("location").notNull(),
  travelRadiusKm: integer("travel_radius_km"),
  profileImageUrl: text("profile_image_url"),
  dishPhotosUrls: text("dish_photos_urls").array(),
  introVideoUrl: text("intro_video_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  // New fields
  languages: text("languages").array(),
  certifications: text("certifications").array(),
  isAvailable: boolean("is_available").default(true),
  // isApproved field removed per user request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Business Profiles table (Supabase integration)
export const businessProfiles = pgTable("business_profiles", {
  id: text("id").primaryKey(), // UUID from Supabase auth
  businessName: text("business_name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  profileImageUrl: text("profile_image_url"),
  galleryImageUrls: text("gallery_image_urls").array(),
  websiteUrl: text("website_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  // New fields
  venueType: text("venue_type"),
  cuisineSpecialties: text("cuisine_specialties").array(),
  businessSize: text("business_size"),
  isHiring: boolean("is_hiring").default(false),
  availabilityNotes: text("availability_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gigs table for job postings
export const gigs = pgTable("gigs", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdBy: text("created_by").notNull(), // UUID from Supabase auth
  title: text("title").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: text("location").notNull(),
  payRate: numeric("pay_rate").notNull(),
  role: text("role").notNull(),
  venueType: text("venue_type").notNull(),
  dressCode: text("dress_code"),
  serviceExpectations: text("service_expectations"),
  kitchenDetails: text("kitchen_details"),
  equipmentProvided: text("equipment_provided").array(),
  benefits: text("benefits").array(),
  tipsAvailable: boolean("tips_available").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gig Applications table for chef applications
export const gigApplications = pgTable("gig_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  gigId: uuid("gig_id").notNull().references(() => gigs.id),
  chefId: text("chef_id").notNull(), // UUID from Supabase auth
  status: text("status").notNull().default("applied"),
  message: text("message"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chef Documents table for certificates, licenses, etc.
export const chefDocuments = pgTable("chef_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  chefId: text("chef_id").notNull(), // UUID from Supabase auth
  name: text("name").notNull(),
  url: text("url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Notifications table for system notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: text("recipient_id").notNull(), // UUID from Supabase auth
  type: text("type").notNull(), // 'gig_confirmed', 'application_received', etc.
  message: text("message").notNull(),
  linkUrl: text("link_url"), // Optional link to relevant page
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChefSchema = createInsertSchema(chefs).omit({
  id: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChefProfileSchema = createInsertSchema(chefProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
});

export const insertGigApplicationSchema = createInsertSchema(gigApplications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertChefDocumentSchema = createInsertSchema(chefDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChef = z.infer<typeof insertChefSchema>;
export type Chef = typeof chefs.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type InsertChefProfile = z.infer<typeof insertChefProfileSchema>;
export type ChefProfile = typeof chefProfiles.$inferSelect;

export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;

export type InsertGig = z.infer<typeof insertGigSchema>;
export type Gig = typeof gigs.$inferSelect;

export type InsertGigApplication = z.infer<typeof insertGigApplicationSchema>;
export type GigApplication = typeof gigApplications.$inferSelect;

export type InsertChefDocument = z.infer<typeof insertChefDocumentSchema>;
export type ChefDocument = typeof chefDocuments.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
