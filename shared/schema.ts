import { pgTable, text, serial, integer, boolean, timestamp, uuid, time, date, numeric, jsonb, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

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
  email: text("email"),
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
  // Payment preferences - Bank transfer only
  bankName: text("bank_name"), // Bank name for payment
  accountName: text("account_name"), // Account holder name
  bankAccountNumber: text("bank_account_number"), // Bank account number
  bankSortCode: text("bank_sort_code"), // Bank sort code
  // Payment method - only bank transfer supported
  paymentMethod: text("payment_method").default("bank"), // Always 'bank'
  // Disclaimer acceptance
  chefDisclaimerAccepted: boolean("chef_disclaimer_accepted").default(false).notNull(),
  chefDisclaimerAcceptedAt: timestamp("chef_disclaimer_accepted_at"),
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
  // Disclaimer acceptance
  businessDisclaimerAccepted: boolean("business_disclaimer_accepted").default(false).notNull(),
  businessDisclaimerAcceptedAt: timestamp("business_disclaimer_accepted_at"),
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
  isBooked: boolean("is_booked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gig Applications table for chef applications
export const gigApplications = pgTable("gig_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  gigId: uuid("gig_id").notNull().references(() => gigs.id),
  chefId: text("chef_id").notNull(), // UUID from Supabase auth
  status: text("status").notNull().default("applied"),
  message: text("message"),
  confirmed: boolean("confirmed").default(false).notNull(),
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
  userId: text("user_id").notNull(), // UUID from Supabase auth
  type: text("type").notNull(), // 'invoice_submitted', 'invoice_paid'
  title: text("title").notNull(),
  body: text("body"),
  entityType: text("entity_type"), // e.g. 'invoice'
  entityId: uuid("entity_id"), // e.g. gig_invoices.id
  meta: jsonb("meta"), // extra: { amount, chef_name, venue_name }
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeCheck: check("type_check", sql`type IN (
    'invoice_submitted', 'invoice_paid',
    'chef_applied', 'application_accepted', 'application_rejected', 'gig_confirmed', 'gig_declined',
    'review_reminder', 'review_submitted',
    'gig_posted', 'gig_updated', 'gig_cancelled', 'gig_deadline_approaching',
    'profile_update', 'welcome', 'platform_update'
  )`),
}));

// Notification Preferences table for user notification settings
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(), // UUID from Supabase auth
  // Application & Booking notifications
  chefAppliedApp: boolean("chef_applied_app").default(true).notNull(),
  chefAppliedEmail: boolean("chef_applied_email").default(true).notNull(),
  applicationAcceptedApp: boolean("application_accepted_app").default(true).notNull(),
  applicationAcceptedEmail: boolean("application_accepted_email").default(true).notNull(),
  applicationRejectedApp: boolean("application_rejected_app").default(true).notNull(),
  applicationRejectedEmail: boolean("application_rejected_email").default(false).notNull(),
  gigConfirmedApp: boolean("gig_confirmed_app").default(true).notNull(),
  gigConfirmedEmail: boolean("gig_confirmed_email").default(true).notNull(),
  gigDeclinedApp: boolean("gig_declined_app").default(true).notNull(),
  gigDeclinedEmail: boolean("gig_declined_email").default(true).notNull(),
  // Invoice notifications
  invoiceSubmittedApp: boolean("invoice_submitted_app").default(true).notNull(),
  invoiceSubmittedEmail: boolean("invoice_submitted_email").default(true).notNull(),
  invoicePaidApp: boolean("invoice_paid_app").default(true).notNull(),
  invoicePaidEmail: boolean("invoice_paid_email").default(true).notNull(),
  // Review notifications
  reviewReminderApp: boolean("review_reminder_app").default(true).notNull(),
  reviewReminderEmail: boolean("review_reminder_email").default(false).notNull(),
  reviewSubmittedApp: boolean("review_submitted_app").default(true).notNull(),
  reviewSubmittedEmail: boolean("review_submitted_email").default(true).notNull(),
  // Gig management notifications
  gigPostedApp: boolean("gig_posted_app").default(true).notNull(),
  gigPostedEmail: boolean("gig_posted_email").default(false).notNull(),
  gigUpdatedApp: boolean("gig_updated_app").default(true).notNull(),
  gigUpdatedEmail: boolean("gig_updated_email").default(false).notNull(),
  gigCancelledApp: boolean("gig_cancelled_app").default(true).notNull(),
  gigCancelledEmail: boolean("gig_cancelled_email").default(true).notNull(),
  gigDeadlineApp: boolean("gig_deadline_app").default(true).notNull(),
  gigDeadlineEmail: boolean("gig_deadline_email").default(false).notNull(),
  // System notifications
  profileUpdateApp: boolean("profile_update_app").default(true).notNull(),
  profileUpdateEmail: boolean("profile_update_email").default(false).notNull(),
  welcomeApp: boolean("welcome_app").default(true).notNull(),
  welcomeEmail: boolean("welcome_email").default(true).notNull(),
  platformUpdateApp: boolean("platform_update_app").default(true).notNull(),
  platformUpdateEmail: boolean("platform_update_email").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gig Invoices table for post-gig billing
export const gigInvoices = pgTable("gig_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  gigId: uuid("gig_id").references(() => gigs.id), // Made nullable for manual invoices
  chefId: text("chef_id").notNull(), // UUID from Supabase auth
  businessId: text("business_id").notNull(), // UUID from Supabase auth
  hoursWorked: numeric("hours_worked", { precision: 10, scale: 2 }).notNull(),
  ratePerHour: numeric("rate_per_hour", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'disputed'
  isManual: boolean("is_manual").default(false).notNull(), // Flag for manual invoices
  serviceTitle: text("service_title"), // For manual invoices
  serviceDescription: text("service_description"), // For manual invoices
  paymentType: text("payment_type").default("hourly").notNull(), // 'hourly', 'fixed'
  // Legacy bank fields (keeping for backward compatibility)
  bankName: text("bank_name"), // Bank name for payment
  accountName: text("account_name"), // Account holder name
  accountNumber: text("account_number"), // Bank account number
  sortCode: text("sort_code"), // Bank sort code
  // Payment method - only bank transfer supported
  paymentMethod: text("payment_method").default("bank"), // Always 'bank'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews table for mutual reviews between chefs and businesses
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  gigId: uuid("gig_id").notNull().references(() => gigs.id),
  reviewerId: text("reviewer_id").notNull(), // UUID from Supabase auth (chef or business)
  recipientId: text("recipient_id").notNull(), // UUID from Supabase auth (chef or business)
  reviewerType: text("reviewer_type").notNull(), // 'chef' or 'business'
  rating: integer("rating").notNull(), // 1-5 stars (overall average)
  comment: text("comment"),
  // Category ratings for chefs reviewing venues
  organisationRating: integer("organisation_rating"), // 1-5 stars
  equipmentRating: integer("equipment_rating"), // 1-5 stars
  welcomingRating: integer("welcoming_rating"), // 1-5 stars
  // Category ratings for venues reviewing chefs
  timekeepingRating: integer("timekeeping_rating"), // 1-5 stars
  appearanceRating: integer("appearance_rating"), // 1-5 stars
  roleFulfilmentRating: integer("role_fulfilment_rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGigInvoiceSchema = createInsertSchema(gigInvoices).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
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
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

export type InsertGigInvoice = z.infer<typeof insertGigInvoiceSchema>;
export type GigInvoice = typeof gigInvoices.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Additional validation schemas for route inputs
export const updateChefProfileSchema = z.object({
  fullName: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().optional(),
  location: z.string().optional(),
  travelRadiusKm: z.number().optional(),
  profileImageUrl: z.string().optional(),
  dishPhotosUrls: z.array(z.string()).optional(),
  introVideoUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankSortCode: z.string().optional(),
  paymentMethod: z.string().optional()
});

export const updateBusinessProfileSchema = z.object({
  businessName: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  profileImageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()).optional(),
  websiteUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  venueType: z.string().optional(),
  cuisineSpecialties: z.array(z.string()).optional(),
  businessSize: z.string().optional(),
  isHiring: z.boolean().optional(),
  availabilityNotes: z.string().optional()
});

export const updateGigSchema = z.object({
  title: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  payRate: z.string().optional(),
  role: z.string().optional(),
  venueType: z.string().optional(),
  dressCode: z.string().optional(),
  serviceExpectations: z.string().optional(),
  kitchenDetails: z.string().optional(),
  equipmentProvided: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  tipsAvailable: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const applicationStatusSchema = z.object({
  status: z.enum(['applied', 'shortlisted', 'rejected', 'accepted'])
});

export const chefPaymentMethodSchema = z.object({
  bankSortCode: z.string().min(6, "Sort code must be at least 6 characters").max(8, "Sort code cannot exceed 8 characters"),
  bankAccountNumber: z.string().min(8, "Account number must be at least 8 characters").max(10, "Account number cannot exceed 10 characters")
});

export type UpdateChefProfile = z.infer<typeof updateChefProfileSchema>;
export type UpdateBusinessProfile = z.infer<typeof updateBusinessProfileSchema>;
export type UpdateGig = z.infer<typeof updateGigSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ChefPaymentMethod = z.infer<typeof chefPaymentMethodSchema>;
