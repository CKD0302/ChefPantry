-- Supabase RLS Security Policies for Chef Pantry
-- Run this in the Supabase SQL Editor to fix security advisories
-- Created: January 2026
--
-- IMPORTANT: Run these in order. Test after each section before proceeding.
-- The server uses service role key (bypasses RLS), so these primarily protect
-- client-side direct Supabase access.

-- ============================================================
-- PHASE 1: ENABLE RLS ON TABLES (Critical - Fixes Errors)
-- ============================================================

-- Enable RLS on venue_staff
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;

-- Enable RLS on work_shifts
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on venue_checkin_tokens
ALTER TABLE public.venue_checkin_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE 2: ADD POLICIES FOR VENUE_STAFF
-- Chefs can see their own staff records
-- Business profile owners can manage staff at their venues
-- ============================================================

DROP POLICY IF EXISTS "venue_staff_select" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_insert" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_update" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_delete" ON public.venue_staff;

-- Select: Chef sees their own records, venue owner sees their venue's staff
CREATE POLICY "venue_staff_select" ON public.venue_staff
FOR SELECT USING (
  auth.uid()::text = chef_id 
  OR auth.uid()::text = venue_id  -- business_profiles.id = user's auth UID
  OR auth.uid()::text = created_by
);

-- Insert: Only venue owners can add staff
CREATE POLICY "venue_staff_insert" ON public.venue_staff
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

-- Update: Venue owners can update staff status
CREATE POLICY "venue_staff_update" ON public.venue_staff
FOR UPDATE USING (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

-- Delete: Venue owners can remove staff
CREATE POLICY "venue_staff_delete" ON public.venue_staff
FOR DELETE USING (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

-- ============================================================
-- PHASE 3: ADD POLICIES FOR WORK_SHIFTS
-- Chefs can manage their own shifts
-- Venue owners can view/approve shifts at their venues
-- ============================================================

DROP POLICY IF EXISTS "work_shifts_select" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_insert" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_update" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_delete" ON public.work_shifts;

-- Select: Chef sees their own shifts, venue owner sees their venue's shifts
CREATE POLICY "work_shifts_select" ON public.work_shifts
FOR SELECT USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text = venue_id  -- business_profiles.id = user's auth UID
);

-- Insert: Chefs create their own shifts
CREATE POLICY "work_shifts_insert" ON public.work_shifts
FOR INSERT WITH CHECK (
  auth.uid()::text = chef_id
);

-- Update: Chef can update their shifts, venue owner can approve/dispute
CREATE POLICY "work_shifts_update" ON public.work_shifts
FOR UPDATE USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text = venue_id
);

-- Delete: Generally shifts shouldn't be deleted, only by venue owner if needed
CREATE POLICY "work_shifts_delete" ON public.work_shifts
FOR DELETE USING (
  auth.uid()::text = venue_id
);

-- ============================================================
-- PHASE 4: ADD POLICIES FOR VENUE_CHECKIN_TOKENS
-- Only venue owners can manage their QR tokens
-- ============================================================

DROP POLICY IF EXISTS "venue_checkin_tokens_select" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_insert" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_update" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_delete" ON public.venue_checkin_tokens;

-- Select: Only venue owner/creator can view tokens
CREATE POLICY "venue_checkin_tokens_select" ON public.venue_checkin_tokens
FOR SELECT USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

-- Insert: Only venue owners can create tokens
CREATE POLICY "venue_checkin_tokens_insert" ON public.venue_checkin_tokens
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

-- Update: Tokens generally don't need updating
CREATE POLICY "venue_checkin_tokens_update" ON public.venue_checkin_tokens
FOR UPDATE USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

-- Delete: Venue owners can delete tokens
CREATE POLICY "venue_checkin_tokens_delete" ON public.venue_checkin_tokens
FOR DELETE USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

-- ============================================================
-- PHASE 5: ADD POLICIES FOR TABLES WITH RLS BUT NO POLICIES
-- These tables have RLS enabled but deny all access (INFO warnings)
-- ============================================================

-- --- business_company_invites ---
DROP POLICY IF EXISTS "business_company_invites_select" ON public.business_company_invites;
DROP POLICY IF EXISTS "business_company_invites_insert" ON public.business_company_invites;
DROP POLICY IF EXISTS "business_company_invites_update" ON public.business_company_invites;
DROP POLICY IF EXISTS "business_company_invites_delete" ON public.business_company_invites;

CREATE POLICY "business_company_invites_select" ON public.business_company_invites
FOR SELECT USING (
  auth.uid()::text = created_by
  OR auth.email() = invitee_email
);

CREATE POLICY "business_company_invites_insert" ON public.business_company_invites
FOR INSERT WITH CHECK (
  auth.uid()::text = created_by
);

CREATE POLICY "business_company_invites_update" ON public.business_company_invites
FOR UPDATE USING (
  auth.uid()::text = created_by
  OR auth.email() = invitee_email
);

CREATE POLICY "business_company_invites_delete" ON public.business_company_invites
FOR DELETE USING (
  auth.uid()::text = created_by
);

-- --- business_company_links ---
DROP POLICY IF EXISTS "business_company_links_select" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_insert" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_update" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_delete" ON public.business_company_links;

CREATE POLICY "business_company_links_select" ON public.business_company_links
FOR SELECT USING (
  auth.uid()::text = business_id
  OR auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
  OR auth.uid()::text IN (
    SELECT user_id FROM public.company_members WHERE company_id = business_company_links.company_id
  )
);

CREATE POLICY "business_company_links_insert" ON public.business_company_links
FOR INSERT WITH CHECK (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "business_company_links_update" ON public.business_company_links
FOR UPDATE USING (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "business_company_links_delete" ON public.business_company_links
FOR DELETE USING (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

-- --- companies ---
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;

CREATE POLICY "companies_select" ON public.companies
FOR SELECT USING (
  auth.uid()::text = owner_user_id
  OR auth.uid()::text IN (
    SELECT user_id FROM public.company_members WHERE company_id = id
  )
);

CREATE POLICY "companies_insert" ON public.companies
FOR INSERT WITH CHECK (
  auth.uid()::text = owner_user_id
);

CREATE POLICY "companies_update" ON public.companies
FOR UPDATE USING (
  auth.uid()::text = owner_user_id
);

CREATE POLICY "companies_delete" ON public.companies
FOR DELETE USING (
  auth.uid()::text = owner_user_id
);

-- --- company_members ---
DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
DROP POLICY IF EXISTS "company_members_insert" ON public.company_members;
DROP POLICY IF EXISTS "company_members_update" ON public.company_members;
DROP POLICY IF EXISTS "company_members_delete" ON public.company_members;

CREATE POLICY "company_members_select" ON public.company_members
FOR SELECT USING (
  auth.uid()::text = user_id
  OR auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "company_members_insert" ON public.company_members
FOR INSERT WITH CHECK (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "company_members_update" ON public.company_members
FOR UPDATE USING (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "company_members_delete" ON public.company_members
FOR DELETE USING (
  auth.uid()::text IN (
    SELECT owner_user_id FROM public.companies WHERE id = company_id
  )
);

-- ============================================================
-- PHASE 6: FIX SECURITY DEFINER VIEW
-- Replace SECURITY DEFINER with SECURITY INVOKER (default)
-- ============================================================

DROP VIEW IF EXISTS public.user_accessible_businesses;

CREATE VIEW public.user_accessible_businesses AS
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.location,
  bp.profile_image_url,
  'owner' as access_type
FROM public.business_profiles bp
WHERE bp.id = auth.uid()::text
UNION ALL
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.location,
  bp.profile_image_url,
  cm.role as access_type
FROM public.business_profiles bp
INNER JOIN public.business_company_links bcl ON bp.id = bcl.business_id
INNER JOIN public.company_members cm ON bcl.company_id = cm.company_id
WHERE cm.user_id = auth.uid()::text;

-- ============================================================
-- PHASE 7: TIGHTEN OVERLY PERMISSIVE POLICIES (WARNINGS)
-- These replace "USING (true)" policies with proper restrictions
-- 
-- NOTE: Profile tables remain publicly readable but only owner-writable
-- ============================================================

-- --- chef_profiles ---
-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_select" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_insert" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_update" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_delete" ON public.chef_profiles;

-- Profiles are publicly viewable (for browsing chefs)
CREATE POLICY "chef_profiles_select" ON public.chef_profiles
FOR SELECT USING (true);

-- Only owner can insert/update/delete their profile
CREATE POLICY "chef_profiles_insert" ON public.chef_profiles
FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "chef_profiles_update" ON public.chef_profiles
FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "chef_profiles_delete" ON public.chef_profiles
FOR DELETE USING (auth.uid()::text = id);

-- --- business_profiles ---
DROP POLICY IF EXISTS "Enable read access for all users" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_select" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_insert" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_update" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_delete" ON public.business_profiles;

-- Profiles are publicly viewable (for browsing venues)
CREATE POLICY "business_profiles_select" ON public.business_profiles
FOR SELECT USING (true);

-- Only owner can insert/update/delete their profile
CREATE POLICY "business_profiles_insert" ON public.business_profiles
FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "business_profiles_update" ON public.business_profiles
FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "business_profiles_delete" ON public.business_profiles
FOR DELETE USING (auth.uid()::text = id);

-- --- chef_documents ---
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chef_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chef_documents;
DROP POLICY IF EXISTS "Enable update for users based on chef_id" ON public.chef_documents;
DROP POLICY IF EXISTS "Enable delete for users based on chef_id" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_select" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_insert" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_update" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_delete" ON public.chef_documents;

-- Only document owner can access their documents
CREATE POLICY "chef_documents_select" ON public.chef_documents
FOR SELECT USING (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_insert" ON public.chef_documents
FOR INSERT WITH CHECK (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_update" ON public.chef_documents
FOR UPDATE USING (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_delete" ON public.chef_documents
FOR DELETE USING (auth.uid()::text = chef_id);

-- --- contact_messages ---
DROP POLICY IF EXISTS "Enable insert for all users" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;

-- Anyone can submit a contact message (no auth required)
CREATE POLICY "contact_messages_insert" ON public.contact_messages
FOR INSERT WITH CHECK (true);

-- Reading messages requires admin access (via service role, not RLS)

-- --- gig_applications ---
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gig_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gig_applications;
DROP POLICY IF EXISTS "Enable update for users" ON public.gig_applications;
DROP POLICY IF EXISTS "Enable delete for users" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_select" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_insert" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_update" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_delete" ON public.gig_applications;

-- Chef sees their own applications, gig creator sees applications for their gigs
CREATE POLICY "gig_applications_select" ON public.gig_applications
FOR SELECT USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text IN (
    SELECT created_by FROM public.gigs WHERE id = gig_id
  )
);

CREATE POLICY "gig_applications_insert" ON public.gig_applications
FOR INSERT WITH CHECK (auth.uid()::text = chef_id);

-- Chef can update their app, gig creator can accept/reject
CREATE POLICY "gig_applications_update" ON public.gig_applications
FOR UPDATE USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text IN (
    SELECT created_by FROM public.gigs WHERE id = gig_id
  )
);

CREATE POLICY "gig_applications_delete" ON public.gig_applications
FOR DELETE USING (auth.uid()::text = chef_id);

-- --- gigs ---
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gigs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gigs;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON public.gigs;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON public.gigs;
DROP POLICY IF EXISTS "gigs_select" ON public.gigs;
DROP POLICY IF EXISTS "gigs_insert" ON public.gigs;
DROP POLICY IF EXISTS "gigs_update" ON public.gigs;
DROP POLICY IF EXISTS "gigs_delete" ON public.gigs;

-- Gigs are publicly viewable (for browsing available work)
CREATE POLICY "gigs_select" ON public.gigs
FOR SELECT USING (true);

-- Only creator can manage their gigs
CREATE POLICY "gigs_insert" ON public.gigs
FOR INSERT WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "gigs_update" ON public.gigs
FOR UPDATE USING (auth.uid()::text = created_by);

CREATE POLICY "gigs_delete" ON public.gigs
FOR DELETE USING (auth.uid()::text = created_by);

-- ============================================================
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD:
-- ============================================================
-- 1. Go to Authentication > Settings
-- 2. Enable "Leaked Password Protection" (toggle ON)
--
-- 3. For Postgres security patches:
--    Go to Settings > Database > scroll to "Database version"
--    If patches are available, click "Apply patches"
-- ============================================================
