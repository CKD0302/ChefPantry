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
  type InsertNotification
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
  
  // Business Profiles methods (Supabase)
  getBusinessProfile(id: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(id: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  
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
  createGigApplication(application: InsertGigApplication): Promise<GigApplication>;
  updateGigApplicationStatus(id: string, status: string): Promise<GigApplication | undefined>;
  acceptChefForGig(applicationId: string, gigId: string): Promise<{ acceptedApplication: GigApplication; rejectedCount: number }>;
  confirmGigApplication(applicationId: string, chefFirstName: string): Promise<GigApplication | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByRecipient(recipientId: string): Promise<Notification[]>;
  
  // Invoice methods
  createGigInvoice(invoice: InsertGigInvoice): Promise<GigInvoice>;
  getGigInvoice(id: string): Promise<GigInvoice | undefined>;
  getGigInvoiceByGigAndChef(gigId: string, chefId: string): Promise<GigInvoice | undefined>;
  getGigInvoicesByChef(chefId: string): Promise<GigInvoice[]>;
  getGigInvoicesByBusiness(businessId: string): Promise<GigInvoice[]>;
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
      
      // Log the exact data being sent to the database
      console.log("Sending gig data to database:", JSON.stringify(gigData, null, 2));
      
      const result = await db.insert(gigs).values(gigData).returning();
      console.log("Database insert result:", result);
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

      // 4. Create a notification for the business
      await tx
        .insert(notifications)
        .values({
          recipientId: gig.createdBy,
          type: "gig_confirmed",
          message: `Chef ${chefFirstName} has confirmed the gig: ${gig.title}`,
          linkUrl: `/gigs/view/${gig.id}`,
          isRead: false
        });

      return confirmedApplication;
    });
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async getNotificationsByRecipient(recipientId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, recipientId))
      .orderBy(desc(notifications.createdAt));
    
    return result;
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

  async getGigInvoicesByChef(chefId: string): Promise<GigInvoice[]> {
    return db.select()
      .from(gigInvoices)
      .where(eq(gigInvoices.chefId, chefId))
      .orderBy(desc(gigInvoices.createdAt));
  }

  async getGigInvoicesByBusiness(businessId: string): Promise<GigInvoice[]> {
    return db.select()
      .from(gigInvoices)
      .where(eq(gigInvoices.businessId, businessId))
      .orderBy(desc(gigInvoices.createdAt));
  }
}

export const storage = new DBStorage();
