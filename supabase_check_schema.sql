-- Diagnostic: Check which tables and columns exist in your database
-- Run this FIRST to see your actual schema

-- Check venue_staff columns
SELECT 'venue_staff' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'venue_staff'
ORDER BY ordinal_position;

-- Check work_shifts columns
SELECT 'work_shifts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'work_shifts'
ORDER BY ordinal_position;

-- Check venue_checkin_tokens columns
SELECT 'venue_checkin_tokens' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'venue_checkin_tokens'
ORDER BY ordinal_position;

-- Check business_company_links columns
SELECT 'business_company_links' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'business_company_links'
ORDER BY ordinal_position;

-- Check gig_invoices columns (looking for business_id)
SELECT 'gig_invoices' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'gig_invoices'
ORDER BY ordinal_position;

-- Check gigs columns (looking for business_id)
SELECT 'gigs' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'gigs'
ORDER BY ordinal_position;
