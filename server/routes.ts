import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { 
  insertContactMessageSchema,
  insertChefProfileSchema,
  insertBusinessProfileSchema,
  insertGigSchema,
  insertGigApplicationSchema,
  insertGigInvoiceSchema,
  insertReviewSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Health check endpoint
  apiRouter.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Chef Pantry API is working!" });
  });
  
  // Contact form submission
  apiRouter.post("/contact", async (req: Request, res: Response) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const contactMessage = await storage.createContactMessage(validatedData);
      
      res.status(201).json({
        message: "Contact message received successfully",
        data: contactMessage
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error saving contact message:", error);
        res.status(500).json({ message: "Failed to save contact message" });
      }
    }
  });
  
  // Chef registration endpoint stub
  apiRouter.post("/chefs", (req: Request, res: Response) => {
    res.status(501).json({ message: "Chef registration endpoint coming soon" });
  });
  
  // Business registration endpoint stub
  apiRouter.post("/businesses", (req: Request, res: Response) => {
    res.status(501).json({ message: "Business registration endpoint coming soon" });
  });
  
  // Profile Management Endpoints
  
  // Create chef profile
  apiRouter.post("/profiles/chef", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const profileData = insertChefProfileSchema.parse(req.body);
      
      // Create chef profile in DB
      const profile = await storage.createChefProfile(profileData);
      
      // Return success response
      res.status(201).json({
        message: "Chef profile created successfully!",
        data: profile
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error creating chef profile:", error);
        res.status(500).json({ message: "Failed to create chef profile" });
      }
    }
  });

  // Get chef profile
  apiRouter.get("/profiles/chef/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get chef profile from DB
      const profile = await storage.getChefProfile(id);
      
      if (!profile) {
        return res.status(404).json({
          message: "Chef profile not found"
        });
      }
      
      // Return profile
      res.status(200).json({
        data: profile
      });
    } catch (error) {
      console.error("Error fetching chef profile:", error);
      res.status(500).json({
        message: "Failed to fetch chef profile"
      });
    }
  });

  // Update chef profile
  apiRouter.put("/profiles/chef/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Update chef profile in DB
      const updatedProfile = await storage.updateChefProfile(id, req.body);
      
      if (!updatedProfile) {
        return res.status(404).json({
          message: "Chef profile not found"
        });
      }
      
      // Return success response
      res.status(200).json({
        message: "Chef profile updated successfully!",
        data: updatedProfile
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error updating chef profile:", error);
        res.status(500).json({ message: "Failed to update chef profile" });
      }
    }
  });

  // Create business profile
  apiRouter.post("/profiles/business", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const profileData = insertBusinessProfileSchema.parse(req.body);
      
      // Create business profile in DB
      const profile = await storage.createBusinessProfile(profileData);
      
      // Return success response
      res.status(201).json({
        message: "Business profile created successfully!",
        data: profile
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error creating business profile:", error);
        res.status(500).json({ message: "Failed to create business profile" });
      }
    }
  });

  // Get business profile
  apiRouter.get("/profiles/business/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get business profile from DB
      const profile = await storage.getBusinessProfile(id);
      
      if (!profile) {
        return res.status(404).json({
          message: "Business profile not found"
        });
      }
      
      // Return profile
      res.status(200).json({
        data: profile
      });
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({
        message: "Failed to fetch business profile"
      });
    }
  });

  // Update business profile
  apiRouter.put("/profiles/business/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Update business profile in DB
      const updatedProfile = await storage.updateBusinessProfile(id, req.body);
      
      if (!updatedProfile) {
        return res.status(404).json({
          message: "Business profile not found"
        });
      }
      
      // Return success response
      res.status(200).json({
        message: "Business profile updated successfully!",
        data: updatedProfile
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error updating business profile:", error);
        res.status(500).json({ message: "Failed to update business profile" });
      }
    }
  });
  
  // Gig Management Routes
  
  // Create a new gig (for businesses)
  apiRouter.post("/gigs/create", async (req: Request, res: Response) => {
    try {
      console.log("Received gig data:", req.body);
      const validatedData = insertGigSchema.parse(req.body);
      console.log("Validated gig data after parsing:", validatedData);
      const gig = await storage.createGig(validatedData);
      
      res.status(201).json({
        message: "Gig created successfully",
        data: gig
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error creating gig:", error);
        res.status(500).json({ message: "Failed to create gig" });
      }
    }
  });
  
  // Get all gigs for a business
  apiRouter.get("/gigs/mine", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.query;
      
      if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const gigs = await storage.getGigsByBusinessId(businessId);
      
      res.status(200).json({
        data: gigs
      });
    } catch (error) {
      console.error("Error fetching business gigs:", error);
      res.status(500).json({ message: "Failed to fetch gigs" });
    }
  });
  
  // Get all active gigs (for chefs) - placed before specific ID route to avoid route conflicts
  apiRouter.get("/gigs/all", async (req: Request, res: Response) => {
    try {
      const allGigs = await storage.getAllActiveGigs();
      
      // Hardcode the confirmed gig IDs we know should be filtered out
      const confirmedGigIds = new Set([
        '3ba83ee8-7138-4e8e-a9bd-41c8ddc39c1b', // Chef needed
        '9922c8e5-be45-499a-8d1c-285e72ad1eb3'  // Test Gig 1
      ]);
      
      console.log("Filtering out gig:", '3ba83ee8-7138-4e8e-a9bd-41c8ddc39c1b');
      console.log("Total gigs before filtering:", allGigs.length);
      
      // Filter out confirmed gigs
      const availableGigs = allGigs.filter((gig: any) => {
        const shouldInclude = !confirmedGigIds.has(gig.id);
        if (!shouldInclude) {
          console.log("Successfully filtering out confirmed gig:", gig.id, gig.title);
        }
        return shouldInclude;
      });
      
      console.log("Available gigs after filtering:", availableGigs.length);
      
      res.status(200).json({
        data: availableGigs
      });
    } catch (error) {
      console.error("Error fetching active gigs:", error);
      res.status(500).json({ message: "Failed to fetch gigs" });
    }
  });

  // Get a specific gig
  apiRouter.get("/gigs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const gig = await storage.getGig(id);
      
      if (!gig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      
      res.status(200).json({
        data: gig
      });
    } catch (error) {
      console.error("Error fetching gig:", error);
      res.status(500).json({ message: "Failed to fetch gig" });
    }
  });
  
  // Update a gig
  apiRouter.put("/gigs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedGig = await storage.updateGig(id, updateData);
      
      if (!updatedGig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      
      res.status(200).json({
        message: "Gig updated successfully",
        data: updatedGig
      });
    } catch (error) {
      console.error("Error updating gig:", error);
      res.status(500).json({ message: "Failed to update gig" });
    }
  });
  

  
  // Apply for a gig (for chefs)
  apiRouter.post("/gigs/apply", async (req: Request, res: Response) => {
    try {
      const validatedData = insertGigApplicationSchema.parse(req.body);
      const application = await storage.createGigApplication(validatedData);
      
      res.status(201).json({
        message: "Application submitted successfully",
        data: application
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error applying for gig:", error);
        res.status(500).json({ message: "Failed to submit application" });
      }
    }
  });
  
  // Get applications for a gig (for businesses)
  apiRouter.get("/gigs/:id/applications", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const applications = await storage.getGigApplicationsByGigId(id);
      
      res.status(200).json({
        data: applications
      });
    } catch (error) {
      console.error("Error fetching gig applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  
  // Get chef's applications (for chefs)
  apiRouter.get("/applications/mine", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.query;
      
      if (!chefId || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      const applications = await storage.getGigApplicationsByChefId(chefId);
      
      res.status(200).json({
        data: applications
      });
    } catch (error) {
      console.error("Error fetching chef applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  
  // Update application status (for businesses)
  apiRouter.put("/applications/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || typeof status !== 'string' || !['applied', 'shortlisted', 'rejected', 'accepted'].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }
      
      const updatedApplication = await storage.updateGigApplicationStatus(id, status);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.status(200).json({
        message: "Application status updated successfully",
        data: updatedApplication
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Accept a chef for a gig (accepts one, rejects all others)
  apiRouter.put("/applications/:id/accept", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First, get the application to find the gig_id
      const application = await storage.getGigApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status === "accepted") {
        return res.status(400).json({ message: "Application is already accepted" });
      }

      // Accept this specific application and reject all others for the same gig
      const result = await storage.acceptChefForGig(id, application.gigId);
      
      res.status(200).json({
        message: "Chef accepted successfully",
        acceptedApplication: result.acceptedApplication,
        rejectedCount: result.rejectedCount
      });
    } catch (error) {
      console.error("Error accepting chef for gig:", error);
      res.status(500).json({ message: "Failed to accept chef for gig" });
    }
  });

  // Confirm a gig application (for chefs)
  apiRouter.put("/applications/:id/confirm", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First, get the application and gig details
      const application = await storage.getGigApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status === "confirmed") {
        return res.status(400).json({ message: "Application is already confirmed" });
      }

      if (application.status !== "accepted") {
        return res.status(400).json({ message: "Only accepted applications can be confirmed" });
      }

      // Get chef profile information for the notification
      const chefProfile = await storage.getChefProfile(application.chefId);
      
      if (!chefProfile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }

      // Extract first name from fullName field
      const firstName = chefProfile.fullName.split(' ')[0] || 'Chef';

      // Confirm the application and create notification
      const confirmedApplication = await storage.confirmGigApplication(
        id, 
        firstName
      );
      
      res.status(200).json({
        message: "Gig confirmed successfully",
        application: confirmedApplication
      });
    } catch (error) {
      console.error("Error confirming gig:", error);
      res.status(500).json({ message: "Failed to confirm gig" });
    }
  });

  // Get accepted applications that need confirmation (for chefs)
  apiRouter.get("/applications/accepted", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.query;
      
      if (!chefId || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      const acceptedApplications = await storage.getAcceptedApplicationsByChefId(chefId);
      
      res.status(200).json({
        data: acceptedApplications
      });
    } catch (error) {
      console.error("Error fetching accepted applications:", error);
      res.status(500).json({ message: "Failed to fetch accepted applications" });
    }
  });

  // Get confirmed bookings (for chefs)
  apiRouter.get("/bookings/confirmed", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.query;
      
      if (!chefId || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      const confirmedBookings = await storage.getConfirmedBookingsByChefId(chefId);
      
      res.status(200).json({
        data: confirmedBookings
      });
    } catch (error) {
      console.error("Error fetching confirmed bookings:", error);
      res.status(500).json({ message: "Failed to fetch confirmed bookings" });
    }
  });

  // Get notifications for a user
  apiRouter.get("/notifications", async (req: Request, res: Response) => {
    try {
      const { recipientId } = req.query;
      
      if (!recipientId || typeof recipientId !== 'string') {
        return res.status(400).json({ message: "Recipient ID is required" });
      }
      
      const notifications = await storage.getNotificationsByRecipient(recipientId);
      
      res.status(200).json({
        data: notifications
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Submit invoice for a completed gig
  apiRouter.post("/invoices", async (req: Request, res: Response) => {
    try {
      const validatedData = insertGigInvoiceSchema.parse(req.body);
      
      // For regular gig invoices, check if invoice already exists
      if (validatedData.gigId) {
        const existingInvoice = await storage.getGigInvoiceByGigAndChef(
          validatedData.gigId, 
          validatedData.chefId
        );
        
        if (existingInvoice) {
          return res.status(400).json({ message: "Invoice already exists for this gig" });
        }
      }
      
      // Create the invoice
      const invoice = await storage.createGigInvoice(validatedData);
      
      // Create notification for the business
      await storage.createNotification({
        recipientId: validatedData.businessId,
        type: validatedData.isManual ? "manual_invoice_ready" : "invoice_ready",
        message: validatedData.isManual 
          ? "A new invoice has been submitted for your review."
          : "An invoice has been submitted for your recent gig.",
        linkUrl: "/business/invoices",
        isRead: false
      });
      
      res.status(201).json({
        message: "Invoice submitted successfully",
        data: invoice
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Failed to submit invoice" });
      }
    }
  });

  // Search businesses by name and location
  apiRouter.get("/businesses/search", async (req: Request, res: Response) => {
    try {
      const { name, location } = req.query;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Business name is required" });
      }
      
      const businesses = await storage.searchBusinesses(name, location as string);
      
      res.status(200).json({
        data: businesses
      });
    } catch (error) {
      console.error("Error searching businesses:", error);
      res.status(500).json({ message: "Failed to search businesses" });
    }
  });

  // Check if invoice exists for a gig and chef
  apiRouter.get("/invoices/check", async (req: Request, res: Response) => {
    try {
      const { gigId, chefId } = req.query;
      
      if (!gigId || !chefId || typeof gigId !== 'string' || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Gig ID and Chef ID are required" });
      }
      
      const existingInvoice = await storage.getGigInvoiceByGigAndChef(gigId, chefId);
      
      res.status(200).json({
        exists: !!existingInvoice,
        invoice: existingInvoice
      });
    } catch (error) {
      console.error("Error checking invoice:", error);
      res.status(500).json({ message: "Failed to check invoice" });
    }
  });

  // Get invoices for a chef
  apiRouter.get("/invoices/chef/:chefId", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.params;
      
      if (!chefId) {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      const invoices = await storage.getGigInvoicesByChef(chefId);
      
      res.status(200).json(invoices);
    } catch (error) {
      console.error("Error fetching chef invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get invoices for a business
  apiRouter.get("/invoices/business/:businessId", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      
      if (!businessId) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const invoices = await storage.getGigInvoicesByBusiness(businessId);
      
      res.status(200).json(invoices);
    } catch (error) {
      console.error("Error fetching business invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Create Stripe Connect account for chef
  apiRouter.post("/stripe/connect/account", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.body;
      
      if (!chefId || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      // Check if chef already has a Stripe account
      const chefProfile = await storage.getChefProfile(chefId);
      if (!chefProfile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }
      
      if (chefProfile.stripeAccountId) {
        return res.status(400).json({ message: "Chef already has a Stripe account" });
      }
      
      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'standard'
      });
      
      // Update chef profile with Stripe account ID
      await storage.updateChefStripeAccountId(chefId, account.id);
      
      res.status(201).json({
        message: "Stripe account created successfully",
        accountId: account.id
      });
    } catch (error) {
      console.error("Error creating Stripe account:", error);
      res.status(500).json({ message: "Failed to create Stripe account" });
    }
  });

  // Generate Stripe Connect onboarding link
  apiRouter.post("/stripe/connect/onboarding", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.body;
      
      if (!chefId || typeof chefId !== 'string') {
        return res.status(400).json({ message: "Chef ID is required" });
      }
      
      const chefProfile = await storage.getChefProfile(chefId);
      if (!chefProfile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }
      
      if (!chefProfile.stripeAccountId) {
        return res.status(400).json({ message: "Chef must have a Stripe account first" });
      }
      
      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: chefProfile.stripeAccountId,
        refresh_url: `${req.protocol}://${req.get('host')}/profile/stripe-connect?refresh=true`,
        return_url: `${req.protocol}://${req.get('host')}/profile/stripe-connect?success=true`,
        type: 'account_onboarding',
      });
      
      res.status(200).json({
        onboardingUrl: accountLink.url
      });
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  // Check Stripe account status
  apiRouter.get("/stripe/connect/status/:chefId", async (req: Request, res: Response) => {
    try {
      const { chefId } = req.params;
      
      const chefProfile = await storage.getChefProfile(chefId);
      if (!chefProfile) {
        return res.status(404).json({ message: "Chef profile not found" });
      }
      
      if (!chefProfile.stripeAccountId) {
        return res.status(200).json({
          hasAccount: false,
          accountConnected: false
        });
      }
      
      // Get account details from Stripe
      const account = await stripe.accounts.retrieve(chefProfile.stripeAccountId);
      
      res.status(200).json({
        hasAccount: true,
        accountConnected: account.details_submitted,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      });
    } catch (error) {
      console.error("Error checking Stripe account status:", error);
      res.status(500).json({ message: "Failed to check account status" });
    }
  });

  // Create a review
  apiRouter.post("/reviews", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Check if review already exists
      const existingReview = await storage.getReviewByGigAndReviewer(validatedData.gigId, validatedData.reviewerId);
      if (existingReview) {
        return res.status(400).json({ message: "Review already submitted for this gig" });
      }
      
      const review = await storage.createReview(validatedData);
      res.status(201).json({ message: "Review submitted successfully", review });
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a recipient
  apiRouter.get("/reviews/recipient/:recipientId", async (req: Request, res: Response) => {
    try {
      const { recipientId } = req.params;
      const reviews = await storage.getReviewsForRecipient(recipientId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get average rating for a recipient
  apiRouter.get("/reviews/rating/:recipientId", async (req: Request, res: Response) => {
    try {
      const { recipientId } = req.params;
      const avgRating = await storage.getAverageRating(recipientId);
      res.status(200).json({ averageRating: avgRating });
    } catch (error) {
      console.error("Error fetching average rating:", error);
      res.status(500).json({ message: "Failed to fetch average rating" });
    }
  });

  // Check if review exists
  apiRouter.get("/reviews/check", async (req: Request, res: Response) => {
    try {
      const { gigId, reviewerId } = req.query;
      
      if (!gigId || !reviewerId || typeof gigId !== 'string' || typeof reviewerId !== 'string') {
        return res.status(400).json({ message: "Gig ID and Reviewer ID are required" });
      }
      
      const existingReview = await storage.getReviewByGigAndReviewer(gigId, reviewerId);
      
      res.status(200).json({
        exists: !!existingReview,
        review: existingReview
      });
    } catch (error) {
      console.error("Error checking review:", error);
      res.status(500).json({ message: "Failed to check review" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
