-- Phase 1: Enable RLS only (Critical - Safe to run)
-- This just enables RLS on tables that have it disabled

-- Enable RLS on venue_staff
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;

-- Enable RLS on work_shifts
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on venue_checkin_tokens
ALTER TABLE public.venue_checkin_tokens ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Phase 1 Complete: RLS enabled on venue_staff, work_shifts, venue_checkin_tokens' as status;
