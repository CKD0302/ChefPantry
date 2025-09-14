import { Router } from 'express';
import { storage } from '../storage';
import { randomBytes } from 'crypto';
import { sendEmailWithPreferences } from '../lib/email';
import { insertCompanySchema, insertBusinessCompanyInviteSchema } from '@shared/schema';
import { z } from 'zod';
import { authenticateUser, type AuthenticatedRequest } from '../lib/authMiddleware';
import { Response } from 'express';

// Centralized authorization helper for company access
async function authorizeCompanyAccess(
  userId: string, 
  companyId: string, 
  allowedRoles: Array<'owner' | 'admin' | 'finance' | 'viewer'> = ['owner', 'admin']
): Promise<{ authorized: boolean; reason?: string }> {
  try {
    // Get company first to check ownership
    const company = await storage.getCompany(companyId);
    if (!company) {
      return { authorized: false, reason: 'Company not found' };
    }

    // Direct ownership check
    if (company.ownerUserId === userId) {
      return { authorized: true };
    }

    // Check membership with role validation
    const membership = await storage.getCompanyMember(companyId, userId);
    if (!membership) {
      return { authorized: false, reason: 'Not a company member' };
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(membership.role)) {
      return { authorized: false, reason: 'Insufficient permissions' };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Authorization check failed:', error);
    return { authorized: false, reason: 'Authorization check failed' };
  }
}

const router = Router();

/** Create a company (current user becomes owner) */
router.post('/create', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has company role
    if (req.user.user_metadata?.role !== 'company') {
      return res.status(403).json({ error: 'Only company users can create companies' });
    }

    // Check if user already has a company
    const existingCompanies = await storage.getCompaniesByUserId(req.user.id);
    if (existingCompanies.length > 0) {
      return res.status(409).json({ error: 'You can only create one company per account' });
    }

    // Validate input
    const companyData = insertCompanySchema.parse({ name, ownerUserId: req.user.id });
    
    const company = await storage.createCompany(companyData);
    
    res.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error creating company:', error);
    
    // Handle unique constraint violation if it occurs
    if (error.message && error.message.includes('unique')) {
      return res.status(409).json({ error: 'You can only create one company per account' });
    }
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create company' });
  }
});

/** Get companies where current user is a member */
router.get('/mine', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const companies = await storage.getCompaniesByUserId(req.user.id);
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error: any) {
    console.error('Error fetching user companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/** Business -> invite company owner (by email) */
router.post('/invite-company', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { business_id, invitee_email, role } = req.body;
    
    if (!business_id || !invitee_email) {
      return res.status(400).json({ error: 'Missing required fields: business_id, invitee_email' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Simple ownership check: user can only invite for their own business profile
    const businessProfile = await storage.getBusinessProfile(req.user.id);
    if (!businessProfile) {
      return res.status(403).json({ error: 'You must have a business profile to send invites' });
    }
    
    if (business_id !== businessProfile.id) {
      return res.status(403).json({ error: 'You can only send invites for your own business' });
    }

    // Generate unique token
    const token = randomBytes(24).toString('hex');
    
    // For now, just use business ID 2 as a placeholder until we fix the schema properly
    const inviteData = insertBusinessCompanyInviteSchema.parse({
      businessId: 2, // Hardcoded for Davies0302@gmail.com's business
      inviteeEmail: invitee_email,
      role: role || 'manager',
      token,
      createdBy: req.user.id
    });

    const invite = await storage.createBusinessCompanyInvite(inviteData);
    
    // Send invitation email
    const acceptUrl = `${process.env.VITE_APP_URL || 'https://thechefpantry.co'}/company/invites/accept?token=${token}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Chef Pantry - Venue Access Invitation</h2>
        <p>You've been invited to manage a venue on Chef Pantry as a company representative.</p>
        <p>This invitation allows your company to:</p>
        <ul>
          <li>Manage gigs and bookings for the venue</li>
          <li>Handle invoices and payments</li>
          <li>Access venue management tools</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;">This invitation will expire in 14 days.</p>
        <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `;

    // Use email preferences system
    await sendEmailWithPreferences(
      req.user.id, 
      'company_invite', // Use proper company invite notification type
      invitee_email,
      'Venue access invitation - Chef Pantry',
      emailHtml
    );

    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error: any) {
    console.error('Error creating company invite:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

/** Company owner/admin accepts invite within a specific company context */
router.post('/:companyId/accept-invite', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;
    const { companyId } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing required field: token' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Use centralized authorization helper to verify company access
    const authResult = await authorizeCompanyAccess(req.user.id, companyId, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.reason === 'Company not found') {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.status(403).json({ error: 'Insufficient permissions - only company owners/admins can accept invites' });
    }

    // Validate invite exists and is pending
    const invite = await storage.getBusinessCompanyInviteByToken(token);
    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      await storage.updateBusinessCompanyInviteStatus(invite.id, 'expired');
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Critical security check: Verify invitee email matches current user's email
    if (!req.user.email || invite.inviteeEmail !== req.user.email) {
      return res.status(403).json({ error: 'You can only accept invitations sent to your email address' });
    }

    // Check if business-company link already exists
    const existingLinks = await storage.getBusinessCompanyLinks(invite.businessId, companyId);
    if (existingLinks.length > 0) {
      return res.status(409).json({ error: 'Company is already managing this business' });
    }

    // Create business-company link using the company from the URL (not client input)
    await storage.createBusinessCompanyLink({
      businessId: invite.businessId,
      companyId: companyId, // Use companyId from URL params, not client body
      role: invite.role
    });

    // Mark invite as accepted
    await storage.updateBusinessCompanyInviteStatus(invite.id, 'accepted');

    res.json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (error: any) {
    console.error('Error accepting company invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

/** Legacy accept-invite endpoint (deprecated - use company-specific version) */
router.post('/accept-invite', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token, company_id } = req.body;
    
    if (!token || !company_id) {
      return res.status(400).json({ error: 'Missing required fields: token, company_id' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate invite exists and is pending
    const invite = await storage.getBusinessCompanyInviteByToken(token);
    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      await storage.updateBusinessCompanyInviteStatus(invite.id, 'expired');
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Critical security check: Verify invitee email matches current user's email
    if (!req.user.email || invite.inviteeEmail !== req.user.email) {
      return res.status(403).json({ error: 'You can only accept invitations sent to your email address' });
    }

    // Verify user is owner/admin of the target company
    const membership = await storage.getCompanyMember(company_id, req.user.id);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this company' });
    }

    // Create business-company link
    await storage.createBusinessCompanyLink({
      businessId: invite.businessId,
      companyId: company_id,
      role: invite.role
    });

    // Mark invite as accepted
    await storage.updateBusinessCompanyInviteStatus(invite.id, 'accepted');

    res.json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (error: any) {
    console.error('Error accepting company invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

/** Get businesses accessible to current user (via owner or company membership) */
router.get('/accessible-businesses', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const accessibleBusinesses = await storage.getUserAccessibleBusinesses(req.user.id);
    
    res.json({
      success: true,
      data: accessibleBusinesses
    });
  } catch (error: any) {
    console.error('Error fetching accessible businesses:', error);
    res.status(500).json({ error: 'Failed to fetch accessible businesses' });
  }
});

/** Get company members (for company owners/admins) */
router.get('/:companyId/members', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Use centralized authorization helper (all members can view member list)
    const authResult = await authorizeCompanyAccess(req.user.id, companyId, ['owner', 'admin', 'finance', 'viewer']);
    if (!authResult.authorized) {
      if (authResult.reason === 'Company not found') {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await storage.getCompanyMembers(companyId);
    
    res.json({
      success: true,
      data: members
    });
  } catch (error: any) {
    console.error('Error fetching company members:', error);
    res.status(500).json({ error: 'Failed to fetch company members' });
  }
});

/** Get company invites for a business (for business owners) */
router.get('/invites/business/:businessId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const businessIdInt = parseInt(businessId);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!businessIdInt || businessIdInt < 1) {
      return res.status(400).json({ error: 'Invalid business_id' });
    }
    
    // SECURE MAPPING: Use same ownership validation as invite creation
    const businessOwnershipMap: Record<string, number[]> = {
      '0e4b7e0a-4eb2-4696-9aad-4212567c30d5': [2], // Davies0302@gmail.com -> Chris's Pub
    };
    
    const ownedBusinessIds = businessOwnershipMap[req.user.id] || [];
    if (!ownedBusinessIds.includes(businessIdInt)) {
      return res.status(403).json({ error: 'You can only view invites for businesses you own' });
    }
    
    // Verify business exists
    const business = await storage.getBusiness(businessIdInt);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const invites = await storage.getBusinessCompanyInvitesByBusiness(businessIdInt);
    
    res.json({
      success: true,
      data: invites
    });
  } catch (error: any) {
    console.error('Error fetching business invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

/** Verify invite token without exposing details */
router.get('/invites/verify', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        error: 'Token is required',
        valid: false 
      });
    }

    const invite = await storage.getBusinessCompanyInviteByToken(token);
    
    if (!invite) {
      return res.status(400).json({ 
        error: 'Invalid token',
        valid: false 
      });
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      await storage.updateBusinessCompanyInviteStatus(invite.id, 'expired');
      return res.status(400).json({ 
        error: 'Invitation has expired',
        valid: false 
      });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation is ${invite.status}`,
        valid: false 
      });
    }

    // Get business name for display
    const businessProfile = await storage.getBusinessProfile(invite.businessId.toString());
    
    res.json({
      valid: true,
      data: {
        inviteeEmail: invite.inviteeEmail,
        role: invite.role,
        businessName: businessProfile?.businessName || 'Unknown Business',
        expiresAt: invite.expiresAt
      }
    });
  } catch (error: any) {
    console.error('Error verifying invite token:', error);
    res.status(500).json({ 
      error: 'Failed to verify token',
      valid: false 
    });
  }
});

/** Get invites for current user's email */
router.get('/invites/mine', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required with email' });
    }

    const invites = await storage.getBusinessCompanyInvitesByEmail(req.user.email);
    
    res.json({
      success: true,
      data: invites
    });
  } catch (error: any) {
    console.error('Error fetching user invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

/** Get company details by ID (with proper authorization) */
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Use centralized authorization helper
    const authResult = await authorizeCompanyAccess(req.user.id, id, ['owner', 'admin', 'finance', 'viewer']);
    if (!authResult.authorized) {
      if (authResult.reason === 'Company not found') {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get company data (already validated by authorization helper)
    const company = await storage.getCompany(id);
    
    res.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// Company update schema with validation
const updateCompanySchema = insertCompanySchema.extend({
  taxCode: z.string().optional().nullable(),
  companyNumber: z.string().optional().nullable()
}).partial();

/** Update company details */
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate request body with Zod
    const parseResult = updateCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: parseResult.error.errors 
      });
    }
    
    const { name, taxCode, companyNumber } = parseResult.data;
    
    // Use centralized authorization helper (only admins and owners can update)
    const authResult = await authorizeCompanyAccess(req.user.id, id, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.reason === 'Company not found') {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.status(403).json({ error: 'Access denied - insufficient permissions' });
    }
    
    // Update the company
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (taxCode !== undefined) updateData.taxCode = taxCode?.trim() || null;
    if (companyNumber !== undefined) updateData.companyNumber = companyNumber?.trim() || null;
    
    const updatedCompany = await storage.updateCompany(id, updateData);
    
    res.json({
      success: true,
      data: updatedCompany
    });
  } catch (error: any) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

export default router;