import { Router } from "express";
import { storage } from "../storage";
import { 
  insertCompanySchema,
  insertCompanyMemberSchema,
  insertBusinessCompanyInviteSchema,
  insertBusinessCompanyLinkSchema,
  businessCompanyInvites,
  businessProfiles
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail } from "../lib/email";
import { authenticateUser, type AuthenticatedRequest } from "../lib/authMiddleware";
import { z } from "zod";
import { ZodError } from "zod";

const router = Router();

// Create Company
router.post("/", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const data = insertCompanySchema.parse(req.body);
    const userId = req.user!.id;

    // Create the company
    const company = await storage.createCompany({
      ...data,
      ownerUserId: userId
    });

    // Create owner membership automatically
    await storage.createCompanyMember({
      companyId: company.id,
      userId: userId,
      role: "owner"
    });

    res.json({ data: company });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Failed to create company" });
  }
});

// Get companies for current user
router.get("/mine", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const companies = await storage.getCompaniesByUserId(userId);
    res.json({ data: companies });
  } catch (error) {
    console.error("Error fetching user companies:", error);
    res.status(500).json({ message: "Failed to fetch companies" });
  }
});

// Get accessible businesses for a company user (MUST be before /:id route)
router.get("/accessible-businesses", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const businesses = await storage.getUserAccessibleBusinesses(userId);
    res.json({ data: businesses });
  } catch (error) {
    console.error("Error fetching accessible businesses:", error);
    res.status(500).json({ message: "Failed to fetch accessible businesses" });
  }
});

// Get company details
router.get("/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const company = await storage.getCompany(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if user is a member of this company
    const members = await storage.getCompanyMembers(id);
    const isMember = members.some(member => member.userId === userId);
    
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ data: company });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Failed to fetch company" });
  }
});

// Get company members
router.get("/:id/members", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is a member of this company
    const members = await storage.getCompanyMembers(id);
    const isMember = members.some(member => member.userId === userId);
    
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ data: members });
  } catch (error) {
    console.error("Error fetching company members:", error);
    res.status(500).json({ message: "Failed to fetch company members" });
  }
});

// Update company details
router.put("/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Check if user is owner or admin of this company
    const members = await storage.getCompanyMembers(id);
    const userMembership = members.find(member => member.userId === userId);
    
    if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
      return res.status(403).json({ message: "Access denied: Only owners and admins can update company details" });
    }

    // Validate the update data
    const updateSchema = z.object({
      name: z.string().min(2, "Company name must be at least 2 characters").optional(),
      description: z.string().optional(),
    });
    
    const updateData = updateSchema.parse(req.body);
    
    const company = await storage.updateCompany(id, updateData);
    res.json({ data: company });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error updating company:", error);
    res.status(500).json({ message: "Failed to update company" });
  }
});

// Remove company member (for owners/admins)
router.delete("/:id/members/:userId", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: companyId, userId: memberUserId } = req.params;
    const currentUserId = req.user!.id;
    
    // Check if current user is owner or admin of this company
    const members = await storage.getCompanyMembers(companyId);
    const currentUserMembership = members.find(member => member.userId === currentUserId);
    
    if (!currentUserMembership || !["owner", "admin"].includes(currentUserMembership.role)) {
      return res.status(403).json({ message: "Access denied: Only owners and admins can remove members" });
    }

    // Prevent removing the owner
    const memberToRemove = members.find(member => member.userId === memberUserId);
    if (memberToRemove?.role === "owner") {
      return res.status(400).json({ message: "Cannot remove company owner" });
    }

    // Prevent self-removal unless there are other owners
    if (currentUserId === memberUserId) {
      const ownerCount = members.filter(member => member.role === "owner").length;
      if (ownerCount <= 1) {
        return res.status(400).json({ message: "Cannot remove yourself as the last owner" });
      }
    }

    const removed = await storage.removeCompanyMember(companyId, memberUserId);
    
    if (!removed) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing company member:", error);
    res.status(500).json({ message: "Failed to remove company member" });
  }
});

// Get venues linked to company
router.get("/:id/venues", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is a member of this company
    const members = await storage.getCompanyMembers(id);
    const isMember = members.some(member => member.userId === userId);
    
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const links = await storage.getCompanyBusinessLinks(id);
    res.json({ data: links });
  } catch (error) {
    console.error("Error fetching company venues:", error);
    res.status(500).json({ message: "Failed to fetch company venues" });
  }
});

// Send invitation from business to company
router.post("/invite-business", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const data = insertBusinessCompanyInviteSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if user owns the business
    const isOwner = await storage.isBusinessOwner(userId, data.businessId);
    if (!isOwner) {
      return res.status(403).json({ message: "Access denied: You must own this business" });
    }

    // Check for existing pending invite
    const existingInvites = await storage.getBusinessCompanyInvitesByBusiness(data.businessId);
    const existingInvite = existingInvites.find(invite => 
      invite.inviteeEmail === data.inviteeEmail && invite.status === 'pending'
    );
    
    if (existingInvite) {
      return res.status(400).json({ 
        message: "An invite to this email is already pending. Please wait for them to respond or revoke the existing invite first." 
      });
    }

    // Generate invite token
    const token = randomBytes(32).toString("hex");
    
    // Set expiry to 14 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Create invite
    const invite = await storage.createBusinessCompanyInvite({
      businessId: data.businessId,
      inviteeEmail: data.inviteeEmail,
      role: data.role,
      token,
      createdBy: userId,
      expiresAt
    });

    // Create in-platform notification
    try {
      // Look up user by email to send notification
      const inviteeUser = await storage.getUserByEmail(data.inviteeEmail);
      if (!inviteeUser) {
        console.log(`No user found with email ${data.inviteeEmail} - skipping notification`);
      } else {
        // Fetch businessProfile for notification content
        const businessProfile = await storage.getBusinessProfile(data.businessId);
        if (!businessProfile) {
          throw new Error("Business profile not found for notification composition");
        }
        
        const { createNotification } = await import("../lib/notify");
        await createNotification({
          userId: inviteeUser.id,
          type: 'platform_update',  // Using existing type that works
          title: `${businessProfile.businessName} invited your company`,
          body: `You've been invited to manage ${businessProfile.businessName} as ${data.role}. View and respond to this invitation in your notifications.`,
          entityType: 'company_invite',
          entityId: invite.id,
          meta: {
            businessId: data.businessId,
            businessName: businessProfile.businessName,
            role: data.role,
            inviteToken: token,
            expiresAt: expiresAt.toISOString()
          }
        });
        console.log(`Company invite notification created for user ${inviteeUser.id}`);
      }
    } catch (notificationError) {
      console.error("Failed to create company invite notification:", notificationError);
      // Don't fail the invitation creation if notification fails
    }

    res.json({ data: invite });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error creating company invite:", error);
    res.status(500).json({ message: "Failed to create company invite" });
  }
});

// Get invite details by token
router.get("/invite/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const invite = await storage.getBusinessCompanyInviteByToken(token);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Don't expose sensitive data like the token itself
    const { token: _, ...inviteData } = invite;
    res.json({ data: inviteData });
  } catch (error) {
    console.error("Error fetching invite:", error);
    res.status(500).json({ message: "Failed to fetch invite" });
  }
});

// Accept invite
router.post("/accept-invite", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    // Validate request body with Zod - SECURITY FIX: Remove arbitrary companyId input
    const acceptInviteSchema = z.object({
      token: z.string().min(1, "Token is required"),
      companyId: z.string().uuid("Company ID must be a valid UUID").optional()
    });
    const { token, companyId } = acceptInviteSchema.parse(req.body);
    const userId = req.user!.id;

    // Get invite by token
    const invite = await storage.getBusinessCompanyInviteByToken(token);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Invite is no longer valid" });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: "Invite has expired" });
    }

    // SECURITY FIX: Validate that this invite is intended for the current user
    const userProfile = await storage.getUserProfile(userId);
    if (!userProfile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    // Check if the invite email matches user's email
    if (userProfile.email !== invite.inviteeEmail) {
      return res.status(403).json({ 
        message: "This invitation was not intended for your account. Invitation email must match your account email." 
      });
    }

    // SECURITY FIX: Get companies where user is owner/admin to prevent IDOR
    const userCompanies = await storage.getUserCompanies(userId);
    const eligibleCompanies = userCompanies.filter(company => 
      company.members.some(member => 
        member.userId === userId && ["owner", "admin"].includes(member.role)
      )
    );

    if (eligibleCompanies.length === 0) {
      return res.status(403).json({ message: "You must be an owner or admin of a company to accept invites" });
    }

    // Determine which company to use
    let selectedCompanyId: string;
    
    if (companyId) {
      // Validate that the provided companyId is one the user can use
      const isEligible = eligibleCompanies.some(company => company.id === companyId);
      if (!isEligible) {
        return res.status(403).json({ message: "You don't have permission to accept this invite for the specified company" });
      }
      selectedCompanyId = companyId;
    } else if (eligibleCompanies.length === 1) {
      // Auto-select if user has only one eligible company
      selectedCompanyId = eligibleCompanies[0].id;
    } else {
      // User has multiple companies but didn't specify which one
      return res.status(400).json({ 
        message: "You have multiple companies. Please specify which company should manage this business.",
        eligibleCompanies: eligibleCompanies.map(c => ({ id: c.id, name: c.name }))
      });
    }

    // Check if this business is already linked to this specific company (prevent duplicate)
    const existingLinks = await storage.getBusinessCompanyLinks(invite.businessId);
    const existingLink = existingLinks.find(link => link.companyId === selectedCompanyId);
    if (existingLink) {
      return res.status(400).json({ message: "This business is already managed by your company" });
    }

    // Create business-company link
    await storage.createBusinessCompanyLink({
      businessId: invite.businessId,
      companyId: selectedCompanyId,
      role: invite.role
    });

    // Mark invite as accepted
    await storage.updateBusinessCompanyInviteStatus(invite.id, "accepted");

    // Send acceptance email to business owner
    try {
      const businessProfile = await storage.getBusinessProfile(invite.businessId);
      const company = await storage.getCompany(selectedCompanyId);
      
      if (businessProfile && company) {
        const subject = `${company.name} accepted your company management invitation`;
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>Invitation Accepted</h2>
            <p>${company.name} has accepted your invitation to manage ${businessProfile.businessName}.</p>
            <p><strong>Role granted:</strong> ${invite.role}</p>
            <p>They can now help manage your venue operations through Chef Pantry.</p>
            <p>— Chef Pantry</p>
          </div>`;
        
        // Note: We'd need to get the business owner's actual email
        // For now, we'll skip this email until we have proper email lookup
        console.log(`Company acceptance notification needed for ${businessProfile.businessName}`);
      }
    } catch (emailError) {
      console.error("Failed to send acceptance email:", emailError);
    }

    res.json({ message: "Invite accepted successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error accepting invite:", error);
    res.status(500).json({ message: "Failed to accept invite" });
  }
});

// Revoke a pending invite
router.delete("/invites/:id/revoke", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get the invite
    const invite = await storage.getBusinessCompanyInvite(id);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Check if user owns the business that sent the invite
    const isOwner = await storage.isBusinessOwner(userId, invite.businessId);
    if (!isOwner) {
      return res.status(403).json({ message: "Access denied: You can only revoke invites for businesses you own" });
    }

    // Check if invite is still pending
    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Only pending invites can be revoked" });
    }

    // Update invite status to revoked
    await storage.updateBusinessCompanyInviteStatus(id, "revoked");

    // Send notification to the invitee about revocation
    try {
      const businessProfile = await storage.getBusinessProfile(invite.businessId);
      
      if (businessProfile) {
        // Get user email from Supabase for notification
        const { getUserEmail } = await import('../lib/supabaseService');
        const inviteeEmail = invite.inviteeEmail;
        
        // Find the invitee's user ID by email (if they have an account)
        // We'll send a notification if they have an account, otherwise it's just revoked silently
        // Note: This could be enhanced to lookup user by email, but for now we'll just log it
        console.log(`Invite revoked: ${businessProfile.businessName} revoked invite to ${inviteeEmail}`);
      }
    } catch (error) {
      console.error("Failed to send revocation notification:", error);
    }

    res.json({ message: "Invite revoked successfully" });
  } catch (error) {
    console.error("Error revoking invite:", error);
    res.status(500).json({ message: "Failed to revoke invite" });
  }
});

// Revoke company access
router.delete("/revoke-access", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    // Validate request body with Zod
    const revokeAccessSchema = z.object({
      businessId: z.string().uuid("Business ID must be a valid UUID"),
      companyId: z.string().uuid("Company ID must be a valid UUID")
    });
    const { businessId, companyId } = revokeAccessSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if user owns the business
    const isOwner = await storage.isBusinessOwner(userId, businessId);
    if (!isOwner) {
      return res.status(403).json({ message: "Access denied: You must own this business" });
    }

    // Remove the link
    const removed = await storage.removeBusinessCompanyLink(businessId, companyId);
    
    if (!removed) {
      return res.status(404).json({ message: "Company link not found" });
    }

    // Send revocation email to company owners
    try {
      // BUGFIX: Fetch businessProfile for logging
      const businessProfile = await storage.getBusinessProfile(businessId);
      const company = await storage.getCompany(companyId);
      const companyMembers = await storage.getCompanyMembers(companyId);
      const owners = companyMembers.filter(member => member.role === "owner");
      
      if (company && businessProfile && owners.length > 0) {
        // Note: We'd need to get owner email addresses from user profiles
        // For now, we'll just log this
        console.log(`Company access revoked: ${company.name} lost access to ${businessProfile.businessName}`);
      }
    } catch (emailError) {
      console.error("Failed to send revocation email:", emailError);
    }

    res.json({ message: "Company access revoked successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error revoking company access:", error);
    res.status(500).json({ message: "Failed to revoke company access" });
  }
});

// Get pending invites for current user
router.get("/invites/pending", authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user email from Supabase (not profile table since business_profiles doesn't have email)
    const { getUserEmail } = await import('../lib/supabaseService');
    const userEmail = await getUserEmail(userId);
    if (!userEmail) {
      return res.status(404).json({ message: "User email not found" });
    }

    // Find pending invites by email
    const allInvites = await db.select({
      id: businessCompanyInvites.id,
      businessId: businessCompanyInvites.businessId,
      inviteeEmail: businessCompanyInvites.inviteeEmail,
      role: businessCompanyInvites.role,
      token: businessCompanyInvites.token,
      status: businessCompanyInvites.status,
      createdAt: businessCompanyInvites.createdAt,
      expiresAt: businessCompanyInvites.expiresAt,
      businessName: businessProfiles.businessName,
      businessLocation: businessProfiles.location
    })
      .from(businessCompanyInvites)
      .innerJoin(businessProfiles, sql`${businessCompanyInvites.businessId}::uuid = ${businessProfiles.id}`)
      .where(
        and(
          eq(businessCompanyInvites.inviteeEmail, userEmail),
          eq(businessCompanyInvites.status, "pending"),
          sql`${businessCompanyInvites.expiresAt} > NOW()`  // Not expired
        )
      )
      .orderBy(desc(businessCompanyInvites.createdAt));

    res.json({ data: allInvites });
  } catch (error) {
    console.error("Error fetching pending invites:", error);
    res.status(500).json({ message: "Failed to fetch pending invites" });
  }
});

export default router;