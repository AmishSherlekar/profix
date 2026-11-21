-- ============================================================================
-- ProFix — Demo Seed Data
-- Run this in Supabase SQL Editor to populate demo professionals & categories
-- ============================================================================

-- Note: In Supabase, users normally exist in auth.users first.
-- To test locally or in preview, create auth users with these emails,
-- or run the script below to seed sample professional records for test accounts.

-- 1. Ensure categories are present
insert into public.service_categories (id, name, description, icon, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Plumbing', 'General plumbing repairs, pipeline leaks, and fittings.', '🔧', true),
  ('22222222-2222-2222-2222-222222222222', 'Electrical Work', 'Wiring, switchboards, lighting fixtures, and circuit breakers.', '⚡', true),
  ('33333333-3333-3333-3333-333333333333', 'Tap & Faucet Repair', 'Fix leaking faucets, washbasin taps, and bathroom showers.', '🚿', true),
  ('44444444-4444-4444-4444-444444444444', 'Drain Cleaning', 'Clearing clogged sinks, bathroom lines, and main sewer pipes.', '🪣', true),
  ('55555555-5555-5555-5555-555555555555', 'Water Heater Repair', 'Geyser installation, element replacement, and thermostat fixing.', '🌡️', true),
  ('66666666-6666-6666-6666-666666666666', 'Fan Installation', 'Ceiling and exhaust fan mounting, repair, and regulator tuning.', '🌀', true)
on conflict (name) do nothing;

-- 2. Helper documentation for creating Admin & Demo Pros:
/*
-- TO CREATE AN ADMIN USER:
-- 1. Sign up a user via the application interface (e.g., admin@profix.local)
-- 2. In Supabase SQL Editor run:
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@profix.local');

-- TO MAKE A PROFESSIONAL INSTANTLY VERIFIED:
update public.professional_profiles
set verification_status = 'verified'
where user_id = (select id from auth.users where email = 'pro@profix.local');
*/
