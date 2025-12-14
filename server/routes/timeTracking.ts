import { Router, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../lib/authMiddleware';

const router = Router();

const clockInSchema = z.object({
  venueId: z.string().uuid(),
  gigId: z.string().uuid().optional().nullable(),
  method: z.enum(['manual', 'qr', 'nfc']).default('manual'),
});

const clockOutSchema = z.object({
  shiftId: z.string().uuid(),
  method: z.enum(['manual', 'qr', 'nfc']).default('manual'),
});

const updateShiftStatusSchema = z.object({
  status: z.enum(['approved', 'disputed', 'void']),
  venueNote: z.string().optional(),
});

const addVenueStaffSchema = z.object({
  chefId: z.string(),
  role: z.string().optional(),
});

const updateVenueStaffSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.string().optional().nullable(),
});

// Get my current open shift
router.get('/shifts/open', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const openShift = await storage.getOpenShiftByChef(userId);
    
    if (openShift) {
      // Get venue details
      const venue = await storage.getBusinessProfile(openShift.venueId);
      // Get gig details if applicable
      let gig = null;
      if (openShift.gigId) {
        gig = await storage.getGig(openShift.gigId);
      }
      
      return res.json({ 
        shift: openShift,
        venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null,
        gig: gig ? { id: gig.id, title: gig.title } : null
      });
    }
    
    return res.json({ shift: null });
  } catch (error) {
    console.error('Error fetching open shift:', error);
    return res.status(500).json({ error: 'Failed to fetch open shift' });
  }
});

// Get my shift history
router.get('/shifts/my', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { fromDate, toDate, venueId, gigId } = req.query;
    
    const options: { fromDate?: Date; toDate?: Date; venueId?: string; gigId?: string } = {};
    if (fromDate) options.fromDate = new Date(fromDate as string);
    if (toDate) options.toDate = new Date(toDate as string);
    if (venueId) options.venueId = venueId as string;
    if (gigId) options.gigId = gigId as string;

    const shifts = await storage.getShiftsByChef(userId, options);
    
    // Batch fetch all unique venues and gigs to avoid N+1 queries
    const uniqueVenueIds = Array.from(new Set(shifts.map(s => s.venueId)));
    const uniqueGigIds = Array.from(new Set(shifts.filter(s => s.gigId).map(s => s.gigId!)));
    
    // Fetch all venues and gigs in parallel
    const [venues, gigs] = await Promise.all([
      Promise.all(uniqueVenueIds.map(id => storage.getBusinessProfile(id))),
      Promise.all(uniqueGigIds.map(id => storage.getGig(id)))
    ]);
    
    // Create lookup maps for O(1) access
    const venueMap = new Map(venues.filter(Boolean).map(v => [v!.id, v!]));
    const gigMap = new Map(gigs.filter(Boolean).map(g => [g!.id, g!]));
    
    // Enrich shifts using lookup maps (no additional DB calls)
    const enrichedShifts = shifts.map(shift => {
      const venue = venueMap.get(shift.venueId);
      const gig = shift.gigId ? gigMap.get(shift.gigId) : null;
      return {
        ...shift,
        venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null,
        gig: gig ? { id: gig.id, title: gig.title } : null
      };
    });
    
    return res.json(enrichedShifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Get shifts for a venue (venue admin only)
router.get('/shifts/venue/:venueId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { venueId } = req.params;
    const { fromDate, toDate, status } = req.query;
    
    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this venue\'s shifts' });
    }
    
    const options: { fromDate?: Date; toDate?: Date; status?: string } = {};
    if (fromDate) options.fromDate = new Date(fromDate as string);
    if (toDate) options.toDate = new Date(toDate as string);
    if (status) options.status = status as string;

    const shifts = await storage.getShiftsByVenue(venueId, options);
    
    // Batch fetch all unique chefs and gigs to avoid N+1 queries
    const uniqueChefIds = Array.from(new Set(shifts.map(s => s.chefId)));
    const uniqueGigIds = Array.from(new Set(shifts.filter(s => s.gigId).map(s => s.gigId!)));
    
    // Fetch all chefs and gigs in parallel
    const [chefs, gigs] = await Promise.all([
      Promise.all(uniqueChefIds.map(id => storage.getChefProfile(id))),
      Promise.all(uniqueGigIds.map(id => storage.getGig(id)))
    ]);
    
    // Create lookup maps for O(1) access
    const chefMap = new Map(chefs.filter(Boolean).map(c => [c!.id, c!]));
    const gigMap = new Map(gigs.filter(Boolean).map(g => [g!.id, g!]));
    
    // Enrich shifts using lookup maps (no additional DB calls)
    const enrichedShifts = shifts.map(shift => {
      const chef = chefMap.get(shift.chefId);
      const gig = shift.gigId ? gigMap.get(shift.gigId) : null;
      return {
        ...shift,
        chef: chef ? { 
          id: chef.id, 
          fullName: chef.fullName, 
          profileImageUrl: chef.profileImageUrl,
          hourlyRate: chef.hourlyRate ? parseFloat(chef.hourlyRate) : null
        } : null,
        gig: gig ? { id: gig.id, title: gig.title } : null
      };
    });
    
    return res.json(enrichedShifts);
  } catch (error) {
    console.error('Error fetching venue shifts:', error);
    return res.status(500).json({ error: 'Failed to fetch venue shifts' });
  }
});

// Clock in
router.post('/clock-in', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const validation = clockInSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { venueId, gigId, method } = validation.data;

    // Check if chef already has an open shift
    const existingShift = await storage.getOpenShiftByChef(userId);
    if (existingShift) {
      return res.status(400).json({ error: 'You already have an open shift. Please clock out first.' });
    }

    // Validate chef can work at this venue
    if (gigId) {
      // Check if chef is accepted for this gig
      const gig = await storage.getGig(gigId);
      if (!gig) {
        return res.status(404).json({ error: 'Gig not found' });
      }
      if (gig.businessId !== venueId) {
        return res.status(400).json({ error: 'Gig does not belong to this venue' });
      }
      
      // Check if chef is accepted for this gig
      const applications = await storage.getGigApplicationsByChefId(userId);
      const acceptedApp = applications.find(app => 
        app.gigId === gigId && app.status === 'accepted'
      );
      if (!acceptedApp) {
        return res.status(403).json({ error: 'You are not accepted for this gig' });
      }
    } else {
      // Check if chef is staff at this venue
      const staffMembership = await storage.getVenueStaffMembership(venueId, userId);
      if (!staffMembership || !staffMembership.isActive) {
        return res.status(403).json({ error: 'You are not staff at this venue. Please clock in via a gig.' });
      }
    }

    // Create the shift
    const shift = await storage.createShift({
      chefId: userId,
      venueId,
      gigId: gigId || null,
      clockInMethod: method,
      clockOutMethod: 'manual',
      status: 'open',
      breakMinutes: 0,
    });

    const venue = await storage.getBusinessProfile(venueId);

    return res.status(201).json({ 
      shift,
      venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    return res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock out
router.post('/clock-out', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const validation = clockOutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { shiftId, method } = validation.data;

    // Get the shift
    const shift = await storage.getShiftById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    if (shift.chefId !== userId) {
      return res.status(403).json({ error: 'Not your shift' });
    }
    if (shift.status !== 'open') {
      return res.status(400).json({ error: 'Shift is not open' });
    }

    // Clock out
    const updatedShift = await storage.clockOutShift(shiftId, method);

    return res.json({ shift: updatedShift });
  } catch (error) {
    console.error('Error clocking out:', error);
    return res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Update shift status (venue admin only)
router.patch('/shifts/:shiftId/status', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { shiftId } = req.params;
    const validation = updateShiftStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { status, venueNote } = validation.data;

    // Get the shift
    const shift = await storage.getShiftById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, shift.venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to update this shift' });
    }

    // Can only approve/dispute submitted shifts
    if (shift.status !== 'submitted' && status !== 'void') {
      return res.status(400).json({ error: 'Can only approve or dispute submitted shifts' });
    }

    // Update the shift
    const updatedShift = await storage.updateShiftStatus(shiftId, status, venueNote);

    return res.json({ shift: updatedShift });
  } catch (error) {
    console.error('Error updating shift status:', error);
    return res.status(500).json({ error: 'Failed to update shift status' });
  }
});

// Get venues where chef is staff
router.get('/venues/staff', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const staffVenues = await storage.getVenueStaffByChef(userId);
    
    // Enrich with venue details
    const enrichedVenues = await Promise.all(staffVenues.map(async (staff) => {
      const venue = await storage.getBusinessProfile(staff.venueId);
      return {
        ...staff,
        venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null
      };
    }));
    
    return res.json(enrichedVenues);
  } catch (error) {
    console.error('Error fetching staff venues:', error);
    return res.status(500).json({ error: 'Failed to fetch staff venues' });
  }
});

// Get gigs where chef is accepted (for clock in dropdown)
router.get('/gigs/accepted', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const applications = await storage.getAcceptedApplicationsByChefId(userId);
    
    // Get gig and venue details for each application
    const enrichedGigs = await Promise.all(applications.map(async (app) => {
      const gig = await storage.getGig(app.gigId);
      if (!gig) return null;
      
      const venue = gig.businessId ? await storage.getBusinessProfile(gig.businessId) : null;
      
      return {
        applicationId: app.id,
        gig: {
          id: gig.id,
          title: gig.title,
          startDate: gig.startDate,
          endDate: gig.endDate,
          startTime: gig.startTime,
          endTime: gig.endTime,
          location: gig.location,
          venueType: gig.venueType,
        },
        venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null
      };
    }));
    
    // Filter out nulls
    const validGigs = enrichedGigs.filter(g => g !== null);
    
    return res.json(validGigs);
  } catch (error) {
    console.error('Error fetching accepted gigs:', error);
    return res.status(500).json({ error: 'Failed to fetch accepted gigs' });
  }
});

// Venue Staff Management Routes

// Get staff for a venue
router.get('/venue/:venueId/staff', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { venueId } = req.params;

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this venue\'s staff' });
    }

    const staff = await storage.getVenueStaffByVenue(venueId);
    
    // Enrich with chef details
    const enrichedStaff = await Promise.all(staff.map(async (s) => {
      const chef = await storage.getChefProfile(s.chefId);
      return {
        ...s,
        chef: chef ? { id: chef.id, fullName: chef.fullName, profileImageUrl: chef.profileImageUrl } : null
      };
    }));
    
    return res.json(enrichedStaff);
  } catch (error) {
    console.error('Error fetching venue staff:', error);
    return res.status(500).json({ error: 'Failed to fetch venue staff' });
  }
});

// Add staff to venue
router.post('/venue/:venueId/staff', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { venueId } = req.params;
    const validation = addVenueStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { chefId, role } = validation.data;

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to add staff to this venue' });
    }

    // Check if chef exists
    const chef = await storage.getChefProfile(chefId);
    if (!chef) {
      return res.status(404).json({ error: 'Chef not found' });
    }

    // Check if already staff
    const existing = await storage.getVenueStaffMembership(venueId, chefId);
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ error: 'Chef is already staff at this venue' });
      }
      // Reactivate
      const updated = await storage.updateVenueStaffStatus(existing.id, true);
      return res.json(updated);
    }

    // Add staff
    const staff = await storage.addVenueStaff({
      venueId,
      chefId,
      role: role || null,
      createdBy: userId,
      isActive: true,
    });

    return res.status(201).json(staff);
  } catch (error) {
    console.error('Error adding venue staff:', error);
    return res.status(500).json({ error: 'Failed to add venue staff' });
  }
});

// Remove staff from venue
router.delete('/venue/:venueId/staff/:staffId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { venueId, staffId } = req.params;

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to remove staff from this venue' });
    }

    // Deactivate rather than delete
    await storage.updateVenueStaffStatus(staffId, false);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing venue staff:', error);
    return res.status(500).json({ error: 'Failed to remove venue staff' });
  }
});

// Update staff member (toggle active status, update role)
router.patch('/venue/:venueId/staff/:staffId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { venueId, staffId } = req.params;
    const validation = updateVenueStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { isActive, role } = validation.data;

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to update staff at this venue' });
    }

    // Update staff member
    const updated = await storage.updateVenueStaff(staffId, { isActive, role });
    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Enrich with chef details
    const chef = await storage.getChefProfile(updated.chefId);
    
    return res.json({
      ...updated,
      chef: chef ? { id: chef.id, fullName: chef.fullName, profileImageUrl: chef.profileImageUrl } : null
    });
  } catch (error) {
    console.error('Error updating venue staff:', error);
    return res.status(500).json({ error: 'Failed to update venue staff' });
  }
});

// QR Code Clock-in/out Routes - PERMANENT QR codes that toggle clock in/out

const validateQRTokenSchema = z.object({
  token: z.string().min(1),
});

// Get or create permanent QR token for venue
router.post('/qr/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const venueId = req.body.venueId;
    
    if (!venueId) {
      return res.status(400).json({ error: 'venueId is required' });
    }

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to generate QR codes for this venue' });
    }

    // Get or create permanent token for this venue
    const token = await storage.getOrCreateVenueQRToken(venueId, userId);
    const venue = await storage.getBusinessProfile(venueId);

    return res.status(200).json({
      token: token.token,
      tokenId: token.id,
      venueId: token.venueId,
      venueName: venue?.businessName || 'Unknown Venue',
      isPermanent: true,
    });
  } catch (error) {
    console.error('Error generating QR token:', error);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Validate QR token and toggle clock in/out
router.post('/qr/validate', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const validation = validateQRTokenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { token } = validation.data;

    // Find the permanent token
    const checkinToken = await storage.getVenueByQRToken(token);
    if (!checkinToken) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const venueId = checkinToken.venueId;
    const venue = await storage.getBusinessProfile(venueId);

    // Check if chef has an open shift
    const existingShift = await storage.getOpenShiftByChef(userId);
    
    if (existingShift) {
      // Chef has an open shift - check if it's at THIS venue
      if (existingShift.venueId === venueId) {
        // Clock OUT - same venue, end the shift
        const updatedShift = await storage.clockOutShift(existingShift.id, 'qr');
        
        return res.status(200).json({
          success: true,
          action: 'clock_out',
          message: `Clocked out at ${venue?.businessName || 'the venue'}`,
          shift: updatedShift,
          venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null,
        });
      } else {
        // Open shift at DIFFERENT venue - error
        const otherVenue = await storage.getBusinessProfile(existingShift.venueId);
        return res.status(400).json({ 
          error: `You have an open shift at ${otherVenue?.businessName || 'another venue'}. Please clock out there first.` 
        });
      }
    }

    // No open shift - clock IN (validate staff membership first)
    const staffMembership = await storage.getVenueStaffMembership(venueId, userId);
    if (!staffMembership || !staffMembership.isActive) {
      return res.status(403).json({ error: 'You are not staff at this venue. Please contact the venue to be added as staff.' });
    }

    // Create the shift
    const shift = await storage.createShift({
      chefId: userId,
      venueId,
      gigId: null,
      clockInMethod: 'qr',
      clockOutMethod: 'manual',
      status: 'open',
      breakMinutes: 0,
    });

    return res.status(201).json({
      success: true,
      action: 'clock_in',
      message: `Clocked in at ${venue?.businessName || 'the venue'}`,
      shift,
      venue: venue ? { id: venue.id, name: venue.businessName, location: venue.location } : null,
    });
  } catch (error) {
    console.error('Error validating QR token:', error);
    return res.status(500).json({ error: 'Failed to process QR code' });
  }
});

// Get permanent QR token for venue
router.get('/qr/venue/:venueId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { venueId } = req.params;

    // Check if user owns this venue
    const isOwner = await storage.isBusinessOwner(userId, venueId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to view QR codes for this venue' });
    }

    const token = await storage.getVenueQRToken(venueId);
    
    if (!token) {
      return res.json(null);
    }

    return res.json(token);
  } catch (error) {
    console.error('Error fetching QR token:', error);
    return res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

export default router;
