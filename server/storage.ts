import {
  users,
  type User,
  type InsertUser,
  chefs,
  type Chef,
  type InsertChef,
  businesses,
  type Business,
  type InsertBusiness,
  bookings,
  type Booking,
  type InsertBooking,
  contactMessages,
  type ContactMessage,
  type InsertContactMessage,
  chefProfiles,
  type ChefProfile,
  type InsertChefProfile,
  businessProfiles,
  type BusinessProfile,
  type InsertBusinessProfile,
  gigs,
  type Gig,
  type InsertGig,
  gigApplications,
  type GigApplication,
  type InsertGigApplication,
  gigInvoices,
  type GigInvoice,
  type InsertGigInvoice,
  notifications,
  type Notification,
  type InsertNotification,
  notificationPreferences,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  reviews,
  type Review,
  type InsertReview,
  companies,
  type Company,
  type InsertCompany,
  companyMembers,
  type CompanyMember,
  type InsertCompanyMember,
  businessCompanyLinks,
  type BusinessCompanyLink,
  type InsertBusinessCompanyLink,
  businessCompanyInvites,
  type BusinessCompanyInvite,
  type InsertBusinessCompanyInvite
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, not, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chef methods
  getChef(id: number): Promise<Chef | undefined>;
  getChefByUserId(userId: number): Promise<Chef | undefined>;
  createChef(chef: InsertChef): Promise<Chef>;
  
  // Business methods
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinessByUserId(userId: number): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  
  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByChefId(chefId: number): Promise<Booking[]>;
  getBookingsByBusinessId(businessId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Contact message methods
  getContactMessage(id: number): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  
  // Chef Profiles methods (Supabase)
  getChefProfile(id: string): Promise<ChefProfile | undefined>;
  createChefProfile(profile: InsertChefProfile): Promise<ChefProfile>;
  updateChefProfile(id: string, profile: Partial<InsertChefProfile>): Promise<ChefProfile | undefined>;
  updateChefPaymentPreferences(id: string, preferences: {
    preferredPaymentMethod: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    sortCode?: string;
  }): Promise<ChefProfile | undefined>;
  updateChefPaymentMethod(id: string, paymentData: {
    paymentMethod?: string;
    bankSortCode?: string;
    bankAccountNumber?: string;
  }): Promise<ChefProfile | undefined>;
  
  // Business Profiles methods (Supabase)
  getBusinessProfile(id: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(id: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  searchBusinesses(name: string, location?: string): Promise<BusinessProfile[]>;
  
  // Gig methods
  getGig(id: string): Promise<Gig | undefined>;
  getAllActiveGigs(): Promise<Gig[]>;
  getGigsByBusinessId(businessId: string): Promise<Gig[]>;
  createGig(gig: InsertGig): Promise<Gig>;
  updateGig(id: string, gig: Partial<InsertGig>): Promise<Gig | undefined>;
  setGigStatus(id: string, isActive: boolean): Promise<Gig | undefined>;
  
  // Gig Application methods
  getGigApplication(id: string): Promise<GigApplication | undefined>;
  getGigApplicationsByGigId(gigId: string): Promise<GigApplication[]>;
  getGigApplicationsByChefId(chefId: string): Promise<GigApplication[]>;
  getAcceptedApplicationsByChefId(chefId: string): Promise<GigApplication[]>;
  getConfirmedBookingsByChefId(chefId: string): Promise<any[]>;
  createGigApplication(application: InsertGigApplication): Promise<GigApplication>;
  updateGigApplicationStatus(id: string, status: string): Promise<GigApplication | undefined>;
  acceptChefForGig(applicationId: string, gigId: string): Promise<{ acceptedApplication: GigApplication; rejectedCount: number }>;
  confirmGigApplication(applicationId: string, chefFirstName: string): Promise<GigApplication | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  
  // Notification Preferences methods
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  updateNotificationPreferences(userId: string, preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  
  // Invoice methods
  createGigInvoice(invoice: InsertGigInvoice): Promise<GigInvoice>;
  getGigInvoice(id: string): Promise<GigInvoice | undefined>;
  getGigInvoiceByGigAndChef(gigId: string, chefId: string): Promise<GigInvoice | undefined>;
  getGigInvoicesByChef(chefId: string): Promise<GigInvoice[]>;
  getGigInvoicesByBusiness(businessId: string): Promise<GigInvoice[]>;
  updateInvoiceStatus(invoiceId: string, status: string): Promise<GigInvoice | undefined>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: string): Promise<Review | undefined>;
  getReviewByGigAndReviewer(gigId: string, reviewerId: string): Promise<Review | undefined>;
  getReviewsForRecipient(recipientId: string): Promise<Review[]>;
  getReviewsGivenByUser(userId: string): Promise<Review[]>;
  getReviewsForGig(gigId: string): Promise<Review[]>;
  getAverageRating(recipientId: string): Promise<number>;
  getReviewSummary(recipientId: string): Promise<any>;
  getPendingReviewsForUser(userId: string): Promise<any[]>;

  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompaniesByUserId(userId: string): Promise<Company[]>;
  
  // Company member methods
  addCompanyMember(member: InsertCompanyMember): Promise<CompanyMember>;
  getCompanyMembers(companyId: string): Promise<CompanyMember[]>;
  getCompanyMember(companyId: string, userId: string): Promise<CompanyMember | undefined>;
  updateCompanyMemberRole(companyId: string, userId: string, role: CompanyMember['role']): Promise<CompanyMember | undefined>;
  removeCompanyMember(companyId: string, userId: string): Promise<void>;
  
  // Business-Company link methods
  createBusinessCompanyLink(link: InsertBusinessCompanyLink): Promise<BusinessCompanyLink>;
  getBusinessCompanyLinks(businessId?: number, companyId?: string): Promise<BusinessCompanyLink[]>;
  updateBusinessCompanyLinkRole(businessId: number, companyId: string, role: BusinessCompanyLink['role']): Promise<BusinessCompanyLink | undefined>;
  removeBusinessCompanyLink(businessId: number, companyId: string): Promise<void>;
  
  // Business-Company invite methods
  createBusinessCompanyInvite(invite: InsertBusinessCompanyInvite): Promise<BusinessCompanyInvite>;
  getBusinessCompanyInvite(id: string): Promise<BusinessCompanyInvite | undefined>;
  getBusinessCompanyInviteByToken(token: string): Promise<BusinessCompanyInvite | undefined>;
  getBusinessCompanyInvitesByBusiness(businessId: number): Promise<BusinessCompanyInvite[]>;
  getBusinessCompanyInvitesByEmail(email: string): Promise<BusinessCompanyInvite[]>;
  updateBusinessCompanyInviteStatus(id: string, status: BusinessCompanyInvite['status']): Promise<BusinessCompanyInvite | undefined>;
  
  // User accessible businesses - for multi-venue access control
  getUserAccessibleBusinesses(userId: string): Promise<{ businessId: number; businessName: string }[]>;
}

export class DBStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Chef methods
  async getChef(id: number): Promise<Chef | undefined> {
    const result = await db.select().from(chefs).where(eq(chefs.id, id));
    return result[0];
  }
  
  async getChefByUserId(userId: number): Promise<Chef | undefined> {
    const result = await db.select().from(chefs).where(eq(chefs.userId, userId));
    return result[0];
  }
  
  async createChef(insertChef: InsertChef): Promise<Chef> {
    // Make sure nullable fields are set to null if undefined
    const chef = {
      ...insertChef,
      bio: insertChef.bio ?? null,
      specialties: insertChef.specialties ?? null,
      experience: insertChef.experience ?? null,
      hourlyRate: insertChef.hourlyRate ?? null,
      availability: insertChef.availability ?? null,
      profileImage: insertChef.profileImage ?? null
    };
    
    const result = await db.insert(chefs).values(chef).returning();
    return result[0];
  }
  
  // Business methods
  async getBusiness(id: number): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.id, id));
    return result[0];
  }
  
  async getBusinessByUserId(userId: number): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.userId, userId));
    return result[0];
  }
  
  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    // Make sure nullable fields are set to null if undefined
    const business = {
      ...insertBusiness,
      description: insertBusiness.description ?? null,
      contactPhone: insertBusiness.contactPhone ?? null,
      profileImage: insertBusiness.profileImage ?? null
    };
    
    const result = await db.insert(businesses).values(business).returning();
    return result[0];
  }
  
  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }
  
  async getBookingsByChefId(chefId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.chefId, chefId));
  }
  
  async getBookingsByBusinessId(businessId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.businessId, businessId));
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // Make sure nullable fields are set to null if undefined and defaults are handled
    const booking = {
      ...insertBooking,
      status: insertBooking.status || "pending",
      details: insertBooking.details ?? null
    };
    
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }
  
  // Contact message methods
  async getContactMessage(id: number): Promise<ContactMessage | undefined> {
    const result = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return result[0];
  }
  
  async createContactMessage(insertContactMessage: InsertContactMessage): Promise<ContactMessage> {
    const result = await db.insert(contactMessages).values(insertContactMessage).returning();
    return result[0];
  }
  
  // Chef Profiles methods (Supabase)
  async getChefProfile(id: string): Promise<ChefProfile | undefined> {
    const result = await db.select().from(chefProfiles).where(eq(chefProfiles.id, id));
    return result[0];
  }
  
  async createChefProfile(profile: InsertChefProfile): Promise<ChefProfile> {
    // Ensure arrays are properly handled
    const chefProfile = {
      ...profile,
      skills: profile.skills || [],
      dishPhotosUrls: profile.dishPhotosUrls || [],
      profileImageUrl: profile.profileImageUrl || null,
      introVideoUrl: profile.introVideoUrl || null,
      travelRadiusKm: profile.travelRadiusKm || null,
      instagramUrl: profile.instagramUrl || null,
      linkedinUrl: profile.linkedinUrl || null,
      portfolioUrl: profile.portfolioUrl || null,
    };
    
    const result = await db.insert(chefProfiles).values(chefProfile).returning();
    return result[0];
  }
  
  async updateChefProfile(id: string, profile: Partial<InsertChefProfile>): Promise<ChefProfile | undefined> {
    // First check if profile exists
    const existingProfile = await this.getChefProfile(id);
    if (!existingProfile) {
      return undefined;
    }
    
    const result = await db.update(chefProfiles)
      .set({
        ...profile,
        updatedAt: new Date()
      })
      .where(eq(chefProfiles.id, id))
      .returning();
    
    return result[0];
  }

  async updateChefPaymentPreferences(id: string, preferences: {
    preferredPaymentMethod: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    sortCode?: string;
  }): Promise<ChefProfile | undefined> {
    const result = await db.update(chefProfiles)
      .set({
        ...preferences,
        updatedAt: new Date()
      })
      .where(eq(chefProfiles.id, id))
      .returning();
    return result[0];
  }

  async updateChefPaymentMethod(id: string, paymentData: {
    bankSortCode?: string;
    bankAccountNumber?: string;
  }): Promise<ChefProfile | undefined> {
    const result = await db.update(chefProfiles)
      .set({
        paymentMethod: 'bank', // Fixed to bank transfer only
        ...paymentData,
        updatedAt: new Date()
      })
      .where(eq(chefProfiles.id, id))
      .returning();
    return result[0];
  }
  
  // Business Profiles methods (Supabase)
  async getBusinessProfile(id: string): Promise<BusinessProfile | undefined> {
    const result = await db.select().from(businessProfiles).where(eq(businessProfiles.id, id));
    return result[0];
  }
  
  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    // Handle nullable fields
    const businessProfile = {
      ...profile,
      profileImageUrl: profile.profileImageUrl || null,
      websiteUrl: profile.websiteUrl || null,
      instagramUrl: profile.instagramUrl || null,
      linkedinUrl: profile.linkedinUrl || null,
    };
    
    const result = await db.insert(businessProfiles).values(businessProfile).returning();
    return result[0];
  }
  
  async updateBusinessProfile(id: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    // First check if profile exists
    const existingProfile = await this.getBusinessProfile(id);
    if (!existingProfile) {
      return undefined;
    }
    
    const result = await db.update(businessProfiles)
      .set({
        ...profile,
        updatedAt: new Date()
      })
      .where(eq(businessProfiles.id, id))
      .returning();
    
    return result[0];
  }

  async searchBusinesses(name: string, location?: string): Promise<BusinessProfile[]> {
    if (location) {
      return db.select()
        .from(businessProfiles)
        .where(and(
          sql`LOWER(${businessProfiles.businessName}) LIKE LOWER(${'%' + name + '%'})`,
          sql`LOWER(${businessProfiles.location}) LIKE LOWER(${'%' + location + '%'})`
        ))
        .limit(10);
    } else {
      return db.select()
        .from(businessProfiles)
        .where(sql`LOWER(${businessProfiles.businessName}) LIKE LOWER(${'%' + name + '%'})`)
        .limit(10);
    }
  }

  // Gig methods
  async getGig(id: string): Promise<Gig | undefined> {
    const result = await db.select().from(gigs).where(eq(gigs.id, id));
    return result[0];
  }
  
  async getAllActiveGigs(): Promise<Gig[]> {
    return db.select()
      .from(gigs)
      .where(eq(gigs.isActive, true))
      .orderBy(desc(gigs.createdAt));
  }
  
  async getGigsByBusinessId(businessId: string): Promise<Gig[]> {
    return db.select()
      .from(gigs)
      .where(eq(gigs.createdBy, businessId))
      .orderBy(desc(gigs.createdAt));
  }
  
  async createGig(insertGig: InsertGig): Promise<Gig> {
    try {
      // Handle array fields
      const gigData = {
        ...insertGig,
        equipmentProvided: insertGig.equipmentProvided || [],
        benefits: insertGig.benefits || []
      };
      
      // Debug logging in development only
      if (process.env.NODE_ENV === 'development') {
        console.log("Sending gig data to database:", JSON.stringify(gigData, null, 2));
      }
      
      const result = await db.insert(gigs).values(gigData).returning();
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Database insert result:", result);
      }
      return result[0];
    } catch (error) {
      console.error("Database error during gig creation:", error);
      throw error;
    }
  }
  
  async updateGig(id: string, updateData: Partial<InsertGig>): Promise<Gig | undefined> {
    // First check if gig exists
    const existingGig = await this.getGig(id);
    if (!existingGig) {
      return undefined;
    }
    
    const result = await db.update(gigs)
      .set(updateData)
      .where(eq(gigs.id, id))
      .returning();
    
    return result[0];
  }
  
  async setGigStatus(id: string, isActive: boolean): Promise<Gig | undefined> {
    return this.updateGig(id, { isActive });
  }
  
  // Gig Application methods
  async getGigApplication(id: string): Promise<GigApplication | undefined> {
    const result = await db.select().from(gigApplications).where(eq(gigApplications.id, id));
    return result[0];
  }
  
  async getGigApplicationsByGigId(gigId: string): Promise<GigApplication[]> {
    return db.select()
      .from(gigApplications)
      .where(eq(gigApplications.gigId, gigId))
      .orderBy(desc(gigApplications.appliedAt));
  }
  
  async getGigApplicationsByChefId(chefId: string): Promise<GigApplication[]> {
    const result = await db.select({
      id: gigApplications.id,
      gigId: gigApplications.gigId,
      chefId: gigApplications.chefId,
      status: gigApplications.status,
      message: gigApplications.message,
      confirmed: gigApplications.confirmed,
      appliedAt: gigApplications.appliedAt,
      updatedAt: gigApplications.updatedAt,
      gig: {
        id: gigs.id,
        title: gigs.title,
        start_date: gigs.startDate,
        end_date: gigs.endDate,
        start_time: gigs.startTime,
        end_time: gigs.endTime,
        location: gigs.location,
        pay_rate: gigs.payRate,
        role: gigs.role,
        venue_type: gigs.venueType,
        created_by: gigs.createdBy
      }
    })
      .from(gigApplications)
      .leftJoin(gigs, eq(gigApplications.gigId, gigs.id))
      .where(eq(gigApplications.chefId, chefId))
      .orderBy(desc(gigApplications.appliedAt));
    
    return result.map(row => ({
      ...row,
      gig: (row.gig && row.gig.id) ? row.gig : undefined
    })) as GigApplication[];
  }

  async getAcceptedApplicationsByChefId(chefId: string): Promise<GigApplication[]> {
    return db.select()
      .from(gigApplications)
      .where(and(
        eq(gigApplications.chefId, chefId),
        eq(gigApplications.status, "accepted"),
        eq(gigApplications.confirmed, false)
      ))
      .orderBy(desc(gigApplications.appliedAt));
  }

  async getConfirmedBookingsByChefId(chefId: string): Promise<any[]> {
    return db.select({
      id: gigApplications.id,
      gigId: gigApplications.gigId,
      chefId: gigApplications.chefId,
      status: gigApplications.status,
      confirmed: gigApplications.confirmed,
      appliedAt: gigApplications.appliedAt,
      updatedAt: gigApplications.updatedAt,
      gig: {
        id: gigs.id,
        title: gigs.title,
        location: gigs.location,
        startDate: gigs.startDate,
        endDate: gigs.endDate,
        startTime: gigs.startTime,
        endTime: gigs.endTime,
        payRate: gigs.payRate,
        role: gigs.role,
        venueType: gigs.venueType
      },
      business: {
        businessName: businessProfiles.businessName,
        location: businessProfiles.location,
        description: businessProfiles.description
      }
    })
      .from(gigApplications)
      .leftJoin(gigs, eq(gigApplications.gigId, gigs.id))
      .leftJoin(businessProfiles, eq(gigs.createdBy, businessProfiles.id))
      .where(and(
        eq(gigApplications.chefId, chefId),
        eq(gigApplications.status, "confirmed")
      ))
      .orderBy(desc(gigs.startDate));
  }
  
  async createGigApplication(insertApplication: InsertGigApplication): Promise<GigApplication> {
    const result = await db.insert(gigApplications).values(insertApplication).returning();
    return result[0];
  }
  
  async updateGigApplicationStatus(id: string, status: string): Promise<GigApplication | undefined> {
    // First check if application exists
    const existingApplication = await this.getGigApplication(id);
    if (!existingApplication) {
      return undefined;
    }
    
    const result = await db.update(gigApplications)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(gigApplications.id, id))
      .returning();
    
    return result[0];
  }

  async acceptChefForGig(applicationId: string, gigId: string): Promise<{ acceptedApplication: GigApplication; rejectedCount: number }> {
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // 1. Accept the specific application
      const acceptedResult = await tx
        .update(gigApplications)
        .set({ 
          status: "accepted",
          updatedAt: new Date()
        })
        .where(eq(gigApplications.id, applicationId))
        .returning();

      if (acceptedResult.length === 0) {
        throw new Error("Application not found");
      }

      const acceptedApplication = acceptedResult[0];

      // 2. Reject all other applications for the same gig
      const rejectedResult = await tx
        .update(gigApplications)
        .set({ 
          status: "rejected",
          updatedAt: new Date()
        })
        .where(
          and(
            eq(gigApplications.gigId, gigId),
            not(eq(gigApplications.id, applicationId)),
            not(eq(gigApplications.status, "rejected")) // Only update non-rejected applications
          )
        )
        .returning();

      return {
        acceptedApplication,
        rejectedCount: rejectedResult.length
      };
    });
  }

  async confirmGigApplication(applicationId: string, chefFirstName: string): Promise<GigApplication | undefined> {
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // 1. Update the application status to confirmed
      const confirmedResult = await tx
        .update(gigApplications)
        .set({ 
          status: "confirmed",
          confirmed: true,
          updatedAt: new Date()
        })
        .where(eq(gigApplications.id, applicationId))
        .returning();

      if (confirmedResult.length === 0) {
        throw new Error("Application not found");
      }

      const confirmedApplication = confirmedResult[0];

      // 2. Get gig details to find business ID and gig title
      const gigResult = await tx
        .select()
        .from(gigs)
        .where(eq(gigs.id, confirmedApplication.gigId))
        .limit(1);

      if (gigResult.length === 0) {
        throw new Error("Gig not found");
      }

      const gig = gigResult[0];

      // 3. Mark the gig as booked
      await tx
        .update(gigs)
        .set({ isBooked: true })
        .where(eq(gigs.id, confirmedApplication.gigId));

      // 4. Create a notification for the business using the new notification service
      // Note: This will be called by the route handler using createNotification function
      // which respects user preferences

      return confirmedApplication;
    });
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    
    return result[0];
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    return result;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return result[0];
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    
    return result[0];
  }

  async updateNotificationPreferences(userId: string, preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    // First try to update existing preferences
    const existingPrefs = await this.getNotificationPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const result = await db
        .update(notificationPreferences)
        .set({ 
          ...preferences, 
          updatedAt: new Date() 
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      
      return result[0];
    } else {
      // Create new preferences if none exist
      const result = await db
        .insert(notificationPreferences)
        .values(preferences)
        .returning();
      
      return result[0];
    }
  }

  // Invoice methods
  async createGigInvoice(insertInvoice: InsertGigInvoice): Promise<GigInvoice> {
    const result = await db.insert(gigInvoices).values(insertInvoice).returning();
    return result[0];
  }

  async getGigInvoice(id: string): Promise<GigInvoice | undefined> {
    const result = await db.select()
      .from(gigInvoices)
      .where(eq(gigInvoices.id, id))
      .limit(1);
    return result[0];
  }

  async getGigInvoiceByGigAndChef(gigId: string, chefId: string): Promise<GigInvoice | undefined> {
    const result = await db.select()
      .from(gigInvoices)
      .where(and(
        eq(gigInvoices.gigId, gigId),
        eq(gigInvoices.chefId, chefId)
      ))
      .limit(1);
    return result[0];
  }

  async getGigInvoicesByChef(chefId: string): Promise<any[]> {
    const result = await db.select({
      id: gigInvoices.id,
      gigId: gigInvoices.gigId,
      chefId: gigInvoices.chefId,
      businessId: gigInvoices.businessId,
      hoursWorked: gigInvoices.hoursWorked,
      hourlyRate: gigInvoices.ratePerHour,
      totalAmount: gigInvoices.totalAmount,
      description: gigInvoices.notes,
      status: gigInvoices.status,
      submittedAt: gigInvoices.createdAt,
      gigTitle: gigs.title,
      businessName: businessProfiles.businessName,
      gigDate: gigs.startDate
    })
      .from(gigInvoices)
      .leftJoin(gigs, eq(gigInvoices.gigId, gigs.id))
      .leftJoin(businessProfiles, eq(gigs.createdBy, businessProfiles.id))
      .where(eq(gigInvoices.chefId, chefId))
      .orderBy(desc(gigInvoices.createdAt));
    
    // Transform the result to match the expected interface
    return result.map(invoice => ({
      ...invoice,
      gig: {
        title: invoice.gigTitle,
        businessName: invoice.businessName,
        date: invoice.gigDate
      }
    }));
  }

  async getGigInvoicesByBusiness(businessId: string): Promise<any[]> {
    const result = await db.select({
      id: gigInvoices.id,
      gigId: gigInvoices.gigId,
      chefId: gigInvoices.chefId,
      businessId: gigInvoices.businessId,
      hoursWorked: gigInvoices.hoursWorked,
      ratePerHour: gigInvoices.ratePerHour,
      totalAmount: gigInvoices.totalAmount,
      notes: gigInvoices.notes,
      status: gigInvoices.status,
      submittedAt: gigInvoices.createdAt,
      isManual: gigInvoices.isManual,
      serviceTitle: gigInvoices.serviceTitle,
      serviceDescription: gigInvoices.serviceDescription,
      paymentType: gigInvoices.paymentType,
      // Legacy bank fields
      bankName: gigInvoices.bankName,
      accountName: gigInvoices.accountName,
      accountNumber: gigInvoices.accountNumber,
      sortCode: gigInvoices.sortCode,
      // Payment method field
      paymentMethod: gigInvoices.paymentMethod,
      // Flat fields from joined tables
      gigTitle: gigs.title,
      gigLocation: gigs.location,
      gigStartDate: gigs.startDate,
      gigEndDate: gigs.endDate,
      chefFullName: chefProfiles.fullName,
    })
    .from(gigInvoices)
    .leftJoin(gigs, eq(gigInvoices.gigId, gigs.id))
    .leftJoin(chefProfiles, eq(gigInvoices.chefId, chefProfiles.id))
    .where(eq(gigInvoices.businessId, businessId))
    .orderBy(desc(gigInvoices.createdAt));
    
    // Transform the result to include nested objects
    return result.map(invoice => ({
      ...invoice,
      gig: invoice.gigId ? {
        title: invoice.gigTitle,
        location: invoice.gigLocation,
        startDate: invoice.gigStartDate,
        endDate: invoice.gigEndDate,
      } : null,
      chef: {
        fullName: invoice.chefFullName,
      }
    }));
  }

  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(insertReview).returning();
    return result[0];
  }

  async getReview(id: string): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  }

  async getReviewByGigAndReviewer(gigId: string, reviewerId: string): Promise<Review | undefined> {
    const result = await db.select()
      .from(reviews)
      .where(and(eq(reviews.gigId, gigId), eq(reviews.reviewerId, reviewerId)));
    return result[0];
  }

  async getReviewsForRecipient(recipientId: string): Promise<any[]> {
    return db.select({
      id: reviews.id,
      gigId: reviews.gigId,
      reviewerId: reviews.reviewerId,
      recipientId: reviews.recipientId,
      reviewerType: reviews.reviewerType,
      rating: reviews.rating,
      comment: reviews.comment,
      organisationRating: reviews.organisationRating,
      equipmentRating: reviews.equipmentRating,
      welcomingRating: reviews.welcomingRating,
      timekeepingRating: reviews.timekeepingRating,
      appearanceRating: reviews.appearanceRating,
      roleFulfilmentRating: reviews.roleFulfilmentRating,
      createdAt: reviews.createdAt,
      reviewer: {
        id: sql`COALESCE(${chefProfiles.id}, ${businessProfiles.id})`.as('reviewer_id'),
        fullName: sql`COALESCE(${chefProfiles.fullName}, ${businessProfiles.businessName})`.as('reviewer_name'),
      },
      gig: {
        id: gigs.id,
        title: gigs.title,
        startDate: gigs.startDate,
      }
    })
    .from(reviews)
    .leftJoin(chefProfiles, eq(reviews.reviewerId, chefProfiles.id))
    .leftJoin(businessProfiles, eq(reviews.reviewerId, businessProfiles.id))
    .leftJoin(gigs, eq(reviews.gigId, gigs.id))
    .where(eq(reviews.recipientId, recipientId))
    .orderBy(desc(reviews.createdAt));
  }

  async getReviewsForGig(gigId: string): Promise<Review[]> {
    return db.select()
      .from(reviews)
      .where(eq(reviews.gigId, gigId))
      .orderBy(desc(reviews.createdAt));
  }

  async getAverageRating(recipientId: string): Promise<number> {
    const result = await db.select({
      avgRating: sql<number>`AVG(${reviews.rating})`
    })
    .from(reviews)
    .where(eq(reviews.recipientId, recipientId));
    
    return parseFloat(result[0]?.avgRating?.toString() || '0');
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<GigInvoice | undefined> {
    const result = await db.update(gigInvoices)
      .set({ status })
      .where(eq(gigInvoices.id, invoiceId))
      .returning();
    
    return result[0];
  }

  async getReviewsGivenByUser(userId: string): Promise<any[]> {
    const result = await db.select({
      id: reviews.id,
      gigId: reviews.gigId,
      reviewerId: reviews.reviewerId,
      recipientId: reviews.recipientId,
      reviewerType: reviews.reviewerType,
      rating: reviews.rating,
      comment: reviews.comment,
      organisationRating: reviews.organisationRating,
      equipmentRating: reviews.equipmentRating,
      welcomingRating: reviews.welcomingRating,
      timekeepingRating: reviews.timekeepingRating,
      appearanceRating: reviews.appearanceRating,
      roleFulfilmentRating: reviews.roleFulfilmentRating,
      createdAt: reviews.createdAt,
      gigTitle: gigs.title,
      gigStartDate: gigs.startDate,
      recipientName: sql<string>`CASE 
        WHEN ${reviews.reviewerType} = 'chef' THEN ${businessProfiles.businessName}
        WHEN ${reviews.reviewerType} = 'business' THEN ${chefProfiles.fullName}
        ELSE 'Unknown'
      END`.as('recipientName')
    })
      .from(reviews)
      .leftJoin(gigs, eq(reviews.gigId, gigs.id))
      .leftJoin(chefProfiles, eq(reviews.recipientId, chefProfiles.id))
      .leftJoin(businessProfiles, eq(reviews.recipientId, businessProfiles.id))
      .where(eq(reviews.reviewerId, userId))
      .orderBy(desc(reviews.createdAt));
    
    return result.map(review => ({
      ...review,
      gig: {
        id: review.gigId,
        title: review.gigTitle,
        startDate: review.gigStartDate
      },
      recipient: {
        id: review.recipientId,
        fullName: review.recipientName
      }
    }));
  }

  async getReviewSummary(recipientId: string): Promise<any> {
    // Get basic stats
    const [statsResult] = await db.select({
      averageRating: sql<number>`COALESCE(avg(${reviews.rating}), 0)`,
      totalReviews: sql<number>`count(*)`,
      // Category averages
      organisationRating: sql<number>`COALESCE(avg(${reviews.organisationRating}), 0)`,
      equipmentRating: sql<number>`COALESCE(avg(${reviews.equipmentRating}), 0)`,
      welcomingRating: sql<number>`COALESCE(avg(${reviews.welcomingRating}), 0)`,
      timekeepingRating: sql<number>`COALESCE(avg(${reviews.timekeepingRating}), 0)`,
      appearanceRating: sql<number>`COALESCE(avg(${reviews.appearanceRating}), 0)`,
      roleFulfilmentRating: sql<number>`COALESCE(avg(${reviews.roleFulfilmentRating}), 0)`
    })
      .from(reviews)
      .where(eq(reviews.recipientId, recipientId));

    // Get rating distribution
    const distributionResult = await db.select({
      rating: reviews.rating,
      count: sql<number>`count(*)`
    })
      .from(reviews)
      .where(eq(reviews.recipientId, recipientId))
      .groupBy(reviews.rating);

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    distributionResult.forEach(row => {
      if (row.rating >= 1 && row.rating <= 5) {
        ratingDistribution[row.rating as keyof typeof ratingDistribution] = parseInt(row.count.toString());
      }
    });

    return {
      averageRating: parseFloat(statsResult.averageRating.toString()),
      totalReviews: parseInt(statsResult.totalReviews.toString()),
      categoryAverages: {
        organisationRating: statsResult.organisationRating > 0 ? parseFloat(statsResult.organisationRating.toString()) : undefined,
        equipmentRating: statsResult.equipmentRating > 0 ? parseFloat(statsResult.equipmentRating.toString()) : undefined,
        welcomingRating: statsResult.welcomingRating > 0 ? parseFloat(statsResult.welcomingRating.toString()) : undefined,
        timekeepingRating: statsResult.timekeepingRating > 0 ? parseFloat(statsResult.timekeepingRating.toString()) : undefined,
        appearanceRating: statsResult.appearanceRating > 0 ? parseFloat(statsResult.appearanceRating.toString()) : undefined,
        roleFulfilmentRating: statsResult.roleFulfilmentRating > 0 ? parseFloat(statsResult.roleFulfilmentRating.toString()) : undefined,
      },
      ratingDistribution
    };
  }

  async getPendingReviewsForUser(userId: string): Promise<any[]> {
    // Get completed gigs where user hasn't left a review yet
    const result = await db.select({
      gigId: gigs.id,
      gigTitle: gigs.title,
      gigDate: gigs.startDate,
      businessId: gigs.createdBy,
      businessName: businessProfiles.businessName,
      chefId: gigApplications.chefId,
      chefName: chefProfiles.fullName,
      userRole: sql<string>`CASE 
        WHEN ${gigApplications.chefId} = ${userId} THEN 'chef'
        WHEN ${gigs.createdBy} = ${userId} THEN 'business'
        ELSE 'unknown'
      END`.as('userRole')
    })
      .from(gigs)
      .innerJoin(gigApplications, and(
        eq(gigApplications.gigId, gigs.id),
        eq(gigApplications.status, 'confirmed')
      ))
      .leftJoin(chefProfiles, eq(gigApplications.chefId, chefProfiles.id))
      .leftJoin(businessProfiles, eq(gigs.createdBy, businessProfiles.id))
      .where(and(
        sql`${gigs.endDate} < NOW()`, // Gig is completed
        sql`(${gigApplications.chefId} = ${userId} OR ${gigs.createdBy} = ${userId})`, // User was involved
        not(sql`EXISTS (
          SELECT 1 FROM ${reviews} 
          WHERE ${reviews.gigId} = ${gigs.id} 
          AND ${reviews.reviewerId} = ${userId}
        )`) // No review exists yet
      ))
      .orderBy(desc(gigs.endDate));

    return result.map(row => ({
      gigId: row.gigId,
      gigTitle: row.gigTitle,
      gigDate: row.gigDate,
      recipientId: row.userRole === 'chef' ? row.businessId : row.chefId,
      recipientName: row.userRole === 'chef' ? row.businessName : row.chefName,
      recipientType: row.userRole === 'chef' ? 'business' : 'chef',
      businessName: row.businessName
    }));
  }

  // Company methods
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(insertCompany).returning();
    const company = result[0];
    
    // Add creator as owner member
    await db.insert(companyMembers).values({
      companyId: company.id,
      userId: company.ownerUserId,
      role: 'owner'
    });
    
    return company;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        ownerUserId: companies.ownerUserId,
        createdAt: companies.createdAt
      })
      .from(companies)
      .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
      .where(eq(companyMembers.userId, userId));
    return result;
  }

  async updateCompany(id: string, updateData: Partial<Company>): Promise<Company | undefined> {
    // First check if company exists
    const existingCompany = await this.getCompany(id);
    if (!existingCompany) {
      return undefined;
    }
    
    const result = await db.update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    
    return result[0];
  }

  // Company member methods
  async addCompanyMember(insertMember: InsertCompanyMember): Promise<CompanyMember> {
    const result = await db.insert(companyMembers).values(insertMember).returning();
    return result[0];
  }

  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const result = await db.select().from(companyMembers).where(eq(companyMembers.companyId, companyId));
    return result;
  }

  async getCompanyMember(companyId: string, userId: string): Promise<CompanyMember | undefined> {
    const result = await db
      .select()
      .from(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)));
    return result[0];
  }

  async updateCompanyMemberRole(companyId: string, userId: string, role: CompanyMember['role']): Promise<CompanyMember | undefined> {
    const result = await db
      .update(companyMembers)
      .set({ role })
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
      .returning();
    return result[0];
  }

  async removeCompanyMember(companyId: string, userId: string): Promise<void> {
    await db
      .delete(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)));
  }

  // Business-Company link methods
  async createBusinessCompanyLink(insertLink: InsertBusinessCompanyLink): Promise<BusinessCompanyLink> {
    const result = await db.insert(businessCompanyLinks).values(insertLink).returning();
    return result[0];
  }

  async getBusinessCompanyLinks(businessId?: number, companyId?: string): Promise<BusinessCompanyLink[]> {
    let query = db.select().from(businessCompanyLinks);
    
    if (businessId && companyId) {
      query = query.where(and(eq(businessCompanyLinks.businessId, businessId), eq(businessCompanyLinks.companyId, companyId)));
    } else if (businessId) {
      query = query.where(eq(businessCompanyLinks.businessId, businessId));
    } else if (companyId) {
      query = query.where(eq(businessCompanyLinks.companyId, companyId));
    }
    
    return await query;
  }

  async updateBusinessCompanyLinkRole(businessId: number, companyId: string, role: BusinessCompanyLink['role']): Promise<BusinessCompanyLink | undefined> {
    const result = await db
      .update(businessCompanyLinks)
      .set({ role })
      .where(and(eq(businessCompanyLinks.businessId, businessId), eq(businessCompanyLinks.companyId, companyId)))
      .returning();
    return result[0];
  }

  async removeBusinessCompanyLink(businessId: number, companyId: string): Promise<void> {
    await db
      .delete(businessCompanyLinks)
      .where(and(eq(businessCompanyLinks.businessId, businessId), eq(businessCompanyLinks.companyId, companyId)));
  }

  // Business-Company invite methods
  async createBusinessCompanyInvite(insertInvite: InsertBusinessCompanyInvite): Promise<BusinessCompanyInvite> {
    const result = await db.insert(businessCompanyInvites).values(insertInvite).returning();
    return result[0];
  }

  async getBusinessCompanyInvite(id: string): Promise<BusinessCompanyInvite | undefined> {
    const result = await db.select().from(businessCompanyInvites).where(eq(businessCompanyInvites.id, id));
    return result[0];
  }

  async getBusinessCompanyInviteByToken(token: string): Promise<BusinessCompanyInvite | undefined> {
    const result = await db.select().from(businessCompanyInvites).where(eq(businessCompanyInvites.token, token));
    return result[0];
  }

  async getBusinessCompanyInvitesByBusiness(businessId: number): Promise<BusinessCompanyInvite[]> {
    const result = await db.select().from(businessCompanyInvites).where(eq(businessCompanyInvites.businessId, businessId));
    return result;
  }

  async getBusinessCompanyInvitesByEmail(email: string): Promise<BusinessCompanyInvite[]> {
    const result = await db.select().from(businessCompanyInvites).where(eq(businessCompanyInvites.inviteeEmail, email));
    return result;
  }

  async updateBusinessCompanyInviteStatus(id: string, status: BusinessCompanyInvite['status']): Promise<BusinessCompanyInvite | undefined> {
    const result = await db
      .update(businessCompanyInvites)
      .set({ status })
      .where(eq(businessCompanyInvites.id, id))
      .returning();
    return result[0];
  }

  // User accessible businesses - for multi-venue access control
  async getUserAccessibleBusinesses(userId: string): Promise<{ businessId: number; businessName: string }[]> {
    // Since the businesses table doesn't exist, return empty array for now
    // This prevents the 500 error until business linking is fully implemented
    // TODO: Implement proper business access control with UUID-based business_profiles
    return [];
  }
}

export const storage = new DBStorage();
