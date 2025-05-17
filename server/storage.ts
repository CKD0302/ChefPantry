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
  type InsertContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DBStorage();
