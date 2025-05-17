import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertContactMessageSchema } from "@shared/schema";
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
  
  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
