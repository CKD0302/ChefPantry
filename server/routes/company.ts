import { Router } from 'express';
import { storage } from '../storage';
import { randomBytes } from 'crypto';
import { sendEmailWithPreferences } from '../lib/email';
import { insertCompanySchema, insertBusinessCompanyInviteSchema } from '@shared/schema';
import { z } from 'zod';
import { authenticateUser, type AuthenticatedRequest } from '../lib/authMiddleware';
import { Response } from 'express';

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

    // Verify user owns this business or has permission to invite on behalf of it
    const businessProfile = await storage.getBusinessProfile(req.user.id);
    if (!businessProfile || business_id !== businessProfile.id) {
      return res.status(403).json({ error: 'You can only send invites for your own business' });
    }

    // Generate unique token
    const token = randomBytes(24).toString('hex');
    
    // Prepare invite data
    const inviteData = insertBusinessCompanyInviteSchema.parse({
      businessId: parseInt(business_id),
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

/** Company owner/admin accepts invite (must belong to a company) */
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

    // Verify user has permission to view members
    const membership = await storage.getCompanyMember(companyId, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this company' });
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
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify user owns this business by fetching the business and checking ownership
    const businessProfile = await storage.getBusinessProfile(businessId);
    if (!businessProfile) {
      return res.status(404).json({ error: 'Business not found' });
    }
    if (businessProfile.id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view invites for your own business' });
    }
    
    const invites = await storage.getBusinessCompanyInvitesByBusiness(parseInt(businessId));
    
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
    
    // Verify user is a member of this company
    const membership = await storage.getCompanyMember(id, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'You can only access companies you are a member of' });
    }
    
    const company = await storage.getCompany(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

/** Update company details */
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    // Verify user is a member of this company
    const membership = await storage.getCompanyMember(id, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'You can only update companies you are a member of' });
    }
    
    // Update the company
    const updatedCompany = await storage.updateCompany(id, { name: name.trim() });
    if (!updatedCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
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