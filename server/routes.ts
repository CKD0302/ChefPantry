import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertContactMessageSchema,
  insertChefProfileSchema,
  insertBusinessProfileSchema 
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
  
  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
