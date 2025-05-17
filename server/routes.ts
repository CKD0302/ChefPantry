import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertContactMessageSchema,
  insertChefProfileSchema,
  insertBusinessProfileSchema,
  insertGigSchema,
  insertGigApplicationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Health check endpoint
  apiRouter.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Chefy API is working!" });
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
  
  // Get all active gigs (for chefs)
  apiRouter.get("/gigs/all", async (req: Request, res: Response) => {
    try {
      const gigs = await storage.getAllActiveGigs();
      
      res.status(200).json({
        data: gigs
      });
    } catch (error) {
      console.error("Error fetching active gigs:", error);
      res.status(500).json({ message: "Failed to fetch gigs" });
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

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
