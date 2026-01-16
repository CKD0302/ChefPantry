-- Phase 2: Basic policies for time tracking tables
-- Run after Phase 1

-- venue_staff policies
DROP POLICY IF EXISTS "venue_staff_select" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_insert" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_update" ON public.venue_staff;
DROP POLICY IF EXISTS "venue_staff_delete" ON public.venue_staff;

CREATE POLICY "venue_staff_select" ON public.venue_staff
FOR SELECT USING (
  auth.uid()::text = chef_id::text 
  OR auth.uid()::text = venue_id::text
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_staff_insert" ON public.venue_staff
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id::text 
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_staff_update" ON public.venue_staff
FOR UPDATE USING (
  auth.uid()::text = venue_id::text 
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_staff_delete" ON public.venue_staff
FOR DELETE USING (
  auth.uid()::text = venue_id::text 
  OR auth.uid()::text = created_by::text
);

-- work_shifts policies
DROP POLICY IF EXISTS "work_shifts_select" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_insert" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_update" ON public.work_shifts;
DROP POLICY IF EXISTS "work_shifts_delete" ON public.work_shifts;

CREATE POLICY "work_shifts_select" ON public.work_shifts
FOR SELECT USING (
  auth.uid()::text = chef_id::text
  OR auth.uid()::text = venue_id::text
);

CREATE POLICY "work_shifts_insert" ON public.work_shifts
FOR INSERT WITH CHECK (
  auth.uid()::text = chef_id::text
);

CREATE POLICY "work_shifts_update" ON public.work_shifts
FOR UPDATE USING (
  auth.uid()::text = chef_id::text
  OR auth.uid()::text = venue_id::text
);

CREATE POLICY "work_shifts_delete" ON public.work_shifts
FOR DELETE USING (
  auth.uid()::text = venue_id::text
);

-- venue_checkin_tokens policies
DROP POLICY IF EXISTS "venue_checkin_tokens_select" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_insert" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_update" ON public.venue_checkin_tokens;
DROP POLICY IF EXISTS "venue_checkin_tokens_delete" ON public.venue_checkin_tokens;

CREATE POLICY "venue_checkin_tokens_select" ON public.venue_checkin_tokens
FOR SELECT USING (
  auth.uid()::text = venue_id::text
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_checkin_tokens_insert" ON public.venue_checkin_tokens
FOR INSERT WITH CHECK (
  auth.uid()::text = venue_id::text
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_checkin_tokens_update" ON public.venue_checkin_tokens
FOR UPDATE USING (
  auth.uid()::text = venue_id::text
  OR auth.uid()::text = created_by::text
);

CREATE POLICY "venue_checkin_tokens_delete" ON public.venue_checkin_tokens
FOR DELETE USING (
  auth.uid()::text = venue_id::text
  OR auth.uid()::text = created_by::text
);

SELECT 'Phase 2 Complete: Policies added for venue_staff, work_shifts, venue_checkin_tokens' as status;
