-- Supabase RLS Security Policies for Chef Pantry
-- FIXED VERSION - Matches actual database schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- PHASE 1: ENABLE RLS ON TABLES
-- ============================================================

ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_checkin_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE 2: VENUE_STAFF POLICIES
-- ============================================================

DROP POLICY IF EXISTS "venue_staff_select" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_insert" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_update" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_delete" ON public.venue_staff;

CREATE POLICY "venue_staff_select" ON public.venue_staff
FOR SELECT USING (
  auth.uid()::text = chef_id 
  OR auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_staff_insert" ON public.venue_staff
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_staff_update" ON public.venue_staff
FOR UPDATE USING (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_staff_delete" ON public.venue_staff
FOR DELETE USING (
  auth.uid()::text = venue_id 
  OR auth.uid()::text = created_by
);

-- ============================================================
-- PHASE 3: WORK_SHIFTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "work_shifts_select" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_insert" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_update" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_delete" ON public.work_shifts;

CREATE POLICY "work_shifts_select" ON public.work_shifts
FOR SELECT USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text = venue_id
);

CREATE POLICY "work_shifts_insert" ON public.work_shifts
FOR INSERT WITH CHECK (
  auth.uid()::text = chef_id
);

CREATE POLICY "work_shifts_update" ON public.work_shifts
FOR UPDATE USING (
  auth.uid()::text = chef_id
  OR auth.uid()::text = venue_id
);

CREATE POLICY "work_shifts_delete" ON public.work_shifts
FOR DELETE USING (
  auth.uid()::text = venue_id
);

-- ============================================================
-- PHASE 4: VENUE_CHECKIN_TOKENS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "venue_checkin_tokens_select" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_insert" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_update" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_delete" ON public.venue_checkin_tokens;

CREATE POLICY "venue_checkin_tokens_select" ON public.venue_checkin_tokens
FOR SELECT USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_checkin_tokens_insert" ON public.venue_checkin_tokens
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_checkin_tokens_update" ON public.venue_checkin_tokens
FOR UPDATE USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

CREATE POLICY "venue_checkin_tokens_delete" ON public.venue_checkin_tokens
FOR DELETE USING (
  auth.uid()::text = venue_id
  OR auth.uid()::text = created_by
);

-- ============================================================
-- PHASE 5: BUSINESS_COMPANY_LINKS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "business_company_links_select" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_insert" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_update" ON public.business_company_links;
DROP POLICY IF EXISTS "business_company_links_delete" ON public.business_company_links;

CREATE POLICY "business_company_links_select" ON public.business_company_links
FOR SELECT USING (
  auth.uid()::text = business_id
  OR auth.uid() IN (
    SELECT owner_user_id::uuid FROM public.companies WHERE id = company_id
  )
  OR auth.uid()::text IN (
    SELECT user_id FROM public.company_members WHERE company_id = business_company_links.company_id
  )
);

CREATE POLICY "business_company_links_insert" ON public.business_company_links
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT owner_user_id::uuid FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "business_company_links_update" ON public.business_company_links
FOR UPDATE USING (
  auth.uid() IN (
    SELECT owner_user_id::uuid FROM public.companies WHERE id = company_id
  )
);

CREATE POLICY "business_company_links_delete" ON public.business_company_links
FOR DELETE USING (
  auth.uid() IN (
    SELECT owner_user_id::uuid FROM public.companies WHERE id = company_id
  )
);

-- ============================================================
-- PHASE 6: FIX SECURITY DEFINER VIEW
-- ============================================================

-- Drop dependent policies first
DROP POLICY IF EXISTS "gigs_company_access" ON public.gigs;
DROP POLICY IF EXISTS "gig_invoices_company_access" ON public.gig_invoices;
DROP POLICY IF EXISTS "gig_applications_company_access" ON public.gig_applications;

-- Drop and recreate view
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

-- Recreate gig_invoices policy (chef_id and business_id are UUID in this table)
CREATE POLICY "gig_invoices_company_access" ON public.gig_invoices
FOR SELECT USING (
  auth.uid() = chef_id
  OR business_id::text IN (
    SELECT business_id FROM public.user_accessible_businesses
  )
);

-- ============================================================
-- PHASE 7: PROFILE POLICIES (Tighten overly permissive)
-- ============================================================

-- chef_profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.chef_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_select" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_insert" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_update" ON public.chef_profiles;
DROP POLICY IF EXISTS "chef_profiles_delete" ON public.chef_profiles;

CREATE POLICY "chef_profiles_select" ON public.chef_profiles
FOR SELECT USING (true);

CREATE POLICY "chef_profiles_insert" ON public.chef_profiles
FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "chef_profiles_update" ON public.chef_profiles
FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "chef_profiles_delete" ON public.chef_profiles
FOR DELETE USING (auth.uid()::text = id);

-- business_profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.business_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_select" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_insert" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_update" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_delete" ON public.business_profiles;

CREATE POLICY "business_profiles_select" ON public.business_profiles
FOR SELECT USING (true);

CREATE POLICY "business_profiles_insert" ON public.business_profiles
FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "business_profiles_update" ON public.business_profiles
FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "business_profiles_delete" ON public.business_profiles
FOR DELETE USING (auth.uid()::text = id);

-- chef_documents
DROP POLICY IF EXISTS "chef_documents_select" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_insert" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_update" ON public.chef_documents;
DROP POLICY IF EXISTS "chef_documents_delete" ON public.chef_documents;

CREATE POLICY "chef_documents_select" ON public.chef_documents
FOR SELECT USING (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_insert" ON public.chef_documents
FOR INSERT WITH CHECK (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_update" ON public.chef_documents
FOR UPDATE USING (auth.uid()::text = chef_id);

CREATE POLICY "chef_documents_delete" ON public.chef_documents
FOR DELETE USING (auth.uid()::text = chef_id);

-- gigs (no business_id column exists, so simpler policies)
DROP POLICY IF EXISTS "gigs_select" ON public.gigs;
DROP POLICY IF EXISTS "gigs_insert" ON public.gigs;
DROP POLICY IF EXISTS "gigs_update" ON public.gigs;
DROP POLICY IF EXISTS "gigs_delete" ON public.gigs;

CREATE POLICY "gigs_select" ON public.gigs
FOR SELECT USING (true);

CREATE POLICY "gigs_insert" ON public.gigs
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "gigs_update" ON public.gigs
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "gigs_delete" ON public.gigs
FOR DELETE USING (auth.uid() = created_by);

-- gig_applications
DROP POLICY IF EXISTS "gig_applications_select" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_insert" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_update" ON public.gig_applications;
DROP POLICY IF EXISTS "gig_applications_delete" ON public.gig_applications;

CREATE POLICY "gig_applications_select" ON public.gig_applications
FOR SELECT USING (
  auth.uid()::text = chef_id
  OR auth.uid() IN (
    SELECT created_by FROM public.gigs WHERE id = gig_id
  )
);

CREATE POLICY "gig_applications_insert" ON public.gig_applications
FOR INSERT WITH CHECK (auth.uid()::text = chef_id);

CREATE POLICY "gig_applications_update" ON public.gig_applications
FOR UPDATE USING (
  auth.uid()::text = chef_id
  OR auth.uid() IN (
    SELECT created_by FROM public.gigs WHERE id = gig_id
  )
);

CREATE POLICY "gig_applications_delete" ON public.gig_applications
FOR DELETE USING (auth.uid()::text = chef_id);

-- contact_messages (insert only)
DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;

CREATE POLICY "contact_messages_insert" ON public.contact_messages
FOR INSERT WITH CHECK (true);

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT 'RLS policies applied successfully!' as status;
