-- ============================================================================
-- ProFix — Supabase Database Migration
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================================

-- ─── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM types ──────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('customer', 'professional', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_status as enum ('available', 'busy', 'offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum (
    'open', 'accepted', 'in_progress', 'pending_confirmation',
    'completed', 'reviewed', 'rejected', 'cancelled'
  );
exception when duplicate_object then null; end $$;

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (char_length(full_name) >= 2),
  phone       text,
  avatar_path text,
  role        user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Public profile for every authenticated user. Role is set via trigger, never by the user.';

-- ─── professional_profiles ───────────────────────────────────────────────────
create table if not exists public.professional_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references public.profiles(id) on delete cascade,
  bio                 text check (char_length(bio) <= 1000),
  experience_years    int not null default 0 check (experience_years >= 0),
  verification_status verification_status not null default 'pending',
  availability_status availability_status not null default 'available',
  service_area        text,
  latitude            double precision check (latitude between -90 and 90),
  longitude           double precision check (longitude between -180 and 180),
  average_rating      numeric(3,2) not null default 0 check (average_rating between 0 and 5),
  review_count        int not null default 0 check (review_count >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_professional_profiles_user_id on public.professional_profiles(user_id);
create index if not exists idx_professional_profiles_availability on public.professional_profiles(availability_status);
create index if not exists idx_professional_profiles_verification on public.professional_profiles(verification_status);
-- Index for spatial queries (PostGIS-ready pattern — lat/lng columns kept for prototype)
create index if not exists idx_professional_profiles_location on public.professional_profiles(latitude, longitude)
  where latitude is not null and longitude is not null;

-- ─── service_categories ──────────────────────────────────────────────────────
create table if not exists public.service_categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique check (char_length(name) >= 2),
  description text,
  icon        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── professional_services ───────────────────────────────────────────────────
create table if not exists public.professional_services (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  category_id     uuid not null references public.service_categories(id) on delete cascade,
  description     text,
  starting_price  numeric(10,2) check (starting_price >= 0),
  is_active       boolean not null default true,
  unique (professional_id, category_id)
);
create index if not exists idx_professional_services_professional on public.professional_services(professional_id);
create index if not exists idx_professional_services_category on public.professional_services(category_id);

-- ─── service_requests ────────────────────────────────────────────────────────
create table if not exists public.service_requests (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid not null references public.profiles(id) on delete restrict,
  category_id     uuid not null references public.service_categories(id),
  description     text not null check (char_length(description) >= 20),
  preferred_date  date,
  status          request_status not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_service_requests_customer on public.service_requests(customer_id);
create index if not exists idx_service_requests_professional on public.service_requests(professional_id);
create index if not exists idx_service_requests_status on public.service_requests(status);
create index if not exists idx_service_requests_created on public.service_requests(created_at desc);

-- ─── request_status_history ──────────────────────────────────────────────────
create table if not exists public.request_status_history (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references public.service_requests(id) on delete cascade,
  changed_by  uuid not null references public.profiles(id),
  old_status  request_status,
  new_status  request_status not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_rsh_request_id on public.request_status_history(request_id);

-- ─── reviews ─────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id              uuid primary key default uuid_generate_v4(),
  request_id      uuid not null unique references public.service_requests(id) on delete cascade,
  customer_id     uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid not null references public.profiles(id) on delete restrict,
  rating          smallint not null check (rating between 1 and 5),
  comment         text check (char_length(comment) <= 1000),
  created_at      timestamptz not null default now()
);
create index if not exists idx_reviews_professional on public.reviews(professional_id);
create index if not exists idx_reviews_customer on public.reviews(customer_id);

-- ─── professional_documents ──────────────────────────────────────────────────
create table if not exists public.professional_documents (
  id                  uuid primary key default uuid_generate_v4(),
  professional_id     uuid not null references public.professional_profiles(id) on delete cascade,
  storage_path        text not null,
  document_type       text not null,
  verification_status verification_status not null default 'pending',
  uploaded_at         timestamptz not null default now()
);
create index if not exists idx_pro_docs_professional on public.professional_documents(professional_id);

-- ─── admin_actions ───────────────────────────────────────────────────────────
create table if not exists public.admin_actions (
  id             uuid primary key default uuid_generate_v4(),
  admin_id       uuid not null references public.profiles(id),
  target_user_id uuid references public.profiles(id),
  action         text not null,
  reason         text,
  created_at     timestamptz not null default now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ─── Auto-create profile on signup ───────────────────────────────────────────
-- Reads role from raw_user_meta_data, but enforces only 'customer' or 'professional'.
-- Admin role CANNOT be set via self-registration.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  raw_role text;
  safe_role user_role;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  -- Enforce: only 'customer' or 'professional' allowed via self-registration
  if raw_role not in ('customer', 'professional') then
    safe_role := 'customer';
  else
    safe_role := raw_role::user_role;
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    safe_role
  );

  -- Auto-create professional_profiles row for professionals
  if safe_role = 'professional' then
    insert into public.professional_profiles (user_id)
    values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace trigger set_professional_profiles_updated_at
  before update on public.professional_profiles
  for each row execute procedure public.set_updated_at();

create or replace trigger set_service_requests_updated_at
  before update on public.service_requests
  for each row execute procedure public.set_updated_at();

-- ─── Recalculate professional average rating ─────────────────────────────────
create or replace function public.recalculate_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.professional_profiles
  set
    average_rating = coalesce((
      select avg(rating)::numeric(3,2) from public.reviews
      where professional_id = coalesce(new.professional_id, old.professional_id)
    ), 0),
    review_count = (
      select count(*) from public.reviews
      where professional_id = coalesce(new.professional_id, old.professional_id)
    )
  where user_id = coalesce(new.professional_id, old.professional_id);
  return coalesce(new, old);
end;
$$;

create or replace trigger after_review_change
  after insert or delete on public.reviews
  for each row execute procedure public.recalculate_rating();

-- ============================================================================
-- SECURE RPC FUNCTIONS
-- ============================================================================

-- ─── submit_service_request ──────────────────────────────────────────────────
-- Only a 'customer' can call this. Status is set to 'open' server-side.
create or replace function public.submit_service_request(
  p_professional_id uuid,
  p_category_id uuid,
  p_description text,
  p_preferred_date date default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid := auth.uid();
  v_customer_role user_role;
  v_professional_role user_role;
  v_request_id uuid;
begin
  -- Validate caller role
  select role into v_customer_role from public.profiles where id = v_customer_id;
  if v_customer_role <> 'customer' then
    raise exception 'Only customers can submit service requests.';
  end if;

  -- Validate that the target is a professional
  select role into v_professional_role from public.profiles where id = p_professional_id;
  if v_professional_role <> 'professional' then
    raise exception 'Invalid professional ID.';
  end if;

  -- Validate description length
  if char_length(p_description) < 20 then
    raise exception 'Description must be at least 20 characters.';
  end if;

  -- Insert the request
  insert into public.service_requests (customer_id, professional_id, category_id, description, preferred_date, status)
  values (v_customer_id, p_professional_id, p_category_id, p_description, p_preferred_date, 'open')
  returning id into v_request_id;

  -- Record initial status
  insert into public.request_status_history (request_id, changed_by, old_status, new_status)
  values (v_request_id, v_customer_id, null, 'open');

  return json_build_object('request_id', v_request_id);
end;
$$;

-- ─── update_request_status ───────────────────────────────────────────────────
-- Enforces the state machine. No arbitrary status writes allowed.
create or replace function public.update_request_status(
  p_request_id uuid,
  p_new_status request_status
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_caller_id    uuid := auth.uid();
  v_caller_role  user_role;
  v_req          public.service_requests%rowtype;
  v_allowed      boolean := false;
begin
  -- Load the request
  select * into v_req from public.service_requests where id = p_request_id;
  if not found then
    return json_build_object('success', false, 'message', 'Request not found.');
  end if;

  select role into v_caller_role from public.profiles where id = v_caller_id;

  -- ── State machine enforcement ──────────────────────────────────────────────
  -- Customer transitions
  if v_caller_id = v_req.customer_id and v_caller_role = 'customer' then
    if p_new_status = 'cancelled' and v_req.status in ('open', 'accepted') then
      v_allowed := true;
    end if;
    -- Customer confirms completion (pending_confirmation → completed)
    if p_new_status = 'completed' and v_req.status = 'pending_confirmation' then
      v_allowed := true;
    end if;
  end if;

  -- Professional transitions
  if v_caller_id = v_req.professional_id and v_caller_role = 'professional' then
    if p_new_status = 'accepted'  and v_req.status = 'open'       then v_allowed := true; end if;
    if p_new_status = 'rejected'  and v_req.status = 'open'       then v_allowed := true; end if;
    if p_new_status = 'in_progress'          and v_req.status = 'accepted'   then v_allowed := true; end if;
    -- Professional marks complete → pending_confirmation (customer must confirm)
    if p_new_status = 'pending_confirmation' and v_req.status = 'in_progress' then v_allowed := true; end if;
  end if;

  -- Admin can force most transitions (for moderation)
  if v_caller_role = 'admin' then
    v_allowed := true;
  end if;

  if not v_allowed then
    return json_build_object(
      'success', false,
      'message', format('Transition %s → %s is not permitted for your role.', v_req.status, p_new_status)
    );
  end if;

  -- Apply the status change
  update public.service_requests
  set status = p_new_status
  where id = p_request_id;

  -- Record in history
  insert into public.request_status_history (request_id, changed_by, old_status, new_status)
  values (p_request_id, v_caller_id, v_req.status, p_new_status);

  return json_build_object('success', true, 'message', 'Status updated.');
end;
$$;

-- ─── submit_review ───────────────────────────────────────────────────────────
create or replace function public.submit_review(
  p_request_id uuid,
  p_rating     int,
  p_comment    text default ''
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_caller_id uuid := auth.uid();
  v_req       public.service_requests%rowtype;
begin
  select * into v_req from public.service_requests where id = p_request_id;

  -- Only the customer of this request can review
  if v_req.customer_id <> v_caller_id then
    raise exception 'You can only review your own completed requests.';
  end if;

  -- Only 'completed' status allows a review
  if v_req.status <> 'completed' then
    raise exception 'You can only review a completed request.';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  -- Insert review (unique constraint on request_id prevents duplicates)
  insert into public.reviews (request_id, customer_id, professional_id, rating, comment)
  values (p_request_id, v_caller_id, v_req.professional_id, p_rating, nullif(trim(p_comment), ''));

  -- Move request to 'reviewed'
  update public.service_requests set status = 'reviewed' where id = p_request_id;

  insert into public.request_status_history (request_id, changed_by, old_status, new_status)
  values (p_request_id, v_caller_id, 'completed', 'reviewed');

  return json_build_object('success', true);
end;
$$;

-- ─── verify_professional ─────────────────────────────────────────────────────
create or replace function public.verify_professional(
  p_professional_id uuid,
  p_status          verification_status,
  p_reason          text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_caller_role user_role;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role <> 'admin' then
    raise exception 'Only admins can verify professionals.';
  end if;

  update public.professional_profiles
  set verification_status = p_status
  where id = p_professional_id;

  insert into public.admin_actions (admin_id, target_user_id, action, reason)
  values (
    auth.uid(),
    (select user_id from public.professional_profiles where id = p_professional_id),
    'verify_professional_' || p_status::text,
    p_reason
  );

  return json_build_object('success', true);
end;
$$;

-- ─── get_professionals_nearby ────────────────────────────────────────────────
-- Returns professionals with optional distance sorting using Haversine.
-- PostGIS can replace this calculation in production for scalability.
create or replace function public.get_professionals_nearby(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_km    double precision default 50,
  p_category_id  uuid default null,
  p_min_rating   numeric default null,
  p_available_only boolean default false
)
returns table (
  user_id             uuid,
  full_name           text,
  avatar_path         text,
  bio                 text,
  experience_years    int,
  verification_status verification_status,
  availability_status availability_status,
  average_rating      numeric,
  review_count        int,
  service_area        text,
  latitude            double precision,
  longitude           double precision,
  distance_km         double precision,
  categories          text[],
  starting_price      numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with
  pro_categories as (
    select
      ps.professional_id,
      array_agg(sc.name order by sc.name) as cats,
      min(ps.starting_price) as min_price
    from public.professional_services ps
    join public.service_categories sc on sc.id = ps.category_id
    where ps.is_active = true
      and sc.is_active = true
      and (p_category_id is null or ps.category_id = p_category_id)
    group by ps.professional_id
  )
  select
    pp.user_id,
    pr.full_name,
    pr.avatar_path,
    pp.bio,
    pp.experience_years,
    pp.verification_status,
    pp.availability_status,
    pp.average_rating,
    pp.review_count,
    pp.service_area,
    pp.latitude,
    pp.longitude,
    -- Haversine distance in km (null when no location data)
    case
      when pp.latitude is not null and pp.longitude is not null then
        round((6371 * acos(
          cos(radians(p_lat)) * cos(radians(pp.latitude)) *
          cos(radians(pp.longitude) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(pp.latitude))
        ))::numeric, 2)
      else null
    end as distance_km,
    coalesce(pc.cats, '{}'::text[]),
    pc.min_price
  from public.professional_profiles pp
  join public.profiles pr on pr.id = pp.user_id
  left join pro_categories pc on pc.professional_id = pp.id
  where
    -- Category filter: only include if they offer that category
    (p_category_id is null or pc.professional_id is not null)
    -- Availability filter
    and (not p_available_only or pp.availability_status = 'available')
    -- Rating filter
    and (p_min_rating is null or pp.average_rating >= p_min_rating)
    -- Distance filter (skip if no coordinates set)
    and (
      pp.latitude is null or pp.longitude is null
      or (
        p_radius_km >= 9000  -- "search all" mode
        or 6371 * acos(
          cos(radians(p_lat)) * cos(radians(pp.latitude)) *
          cos(radians(pp.longitude) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(pp.latitude))
        ) <= p_radius_km
      )
    )
  order by
    -- Prioritize verified professionals
    case when pp.verification_status = 'verified' then 0 else 1 end,
    -- Then by distance (nulls last)
    case when pp.latitude is not null then
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(pp.latitude)) *
        cos(radians(pp.longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(pp.latitude))
      )
    else 9999 end,
    -- Then by rating
    pp.average_rating desc;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.professional_services enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.professional_documents enable row level security;
alter table public.admin_actions enable row level security;

-- Helper: check if caller is admin (used in RLS policies)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── profiles RLS ────────────────────────────────────────────────────────────
-- Users read their own profile (non-sensitive fields of others are exposed via RPC)
create policy "Users can read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Users cannot change their own role
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Insertion is handled by the trigger (security definer), not by the user
create policy "Service account inserts profile" on public.profiles
  for insert with check (false);  -- trigger bypasses RLS

-- ─── professional_profiles RLS ───────────────────────────────────────────────
-- Public can read (for search) — no sensitive PII exposed here
create policy "Public read professional profiles" on public.professional_profiles
  for select using (true);

-- Only the owner can update (admin-managed fields like verification_status are updated via RPC)
create policy "Owner updates own professional profile" on public.professional_profiles
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- Professionals cannot self-verify
    and verification_status = (select verification_status from public.professional_profiles where user_id = auth.uid())
  );

create policy "Admin manages professional profiles" on public.professional_profiles
  for all using (public.is_admin());

-- ─── service_categories RLS ──────────────────────────────────────────────────
create policy "Anyone reads active categories" on public.service_categories
  for select using (is_active = true or public.is_admin());

create policy "Admin manages categories" on public.service_categories
  for all using (public.is_admin());

-- ─── professional_services RLS ───────────────────────────────────────────────
create policy "Public reads active services" on public.professional_services
  for select using (is_active = true or public.is_admin());

create policy "Owner manages own services" on public.professional_services
  for all using (
    professional_id in (
      select id from public.professional_profiles where user_id = auth.uid()
    )
  );

-- ─── service_requests RLS ────────────────────────────────────────────────────
-- Customers see only their requests; professionals see requests assigned to them.
-- Direct status update is BLOCKED — must use update_request_status() RPC.
create policy "Customer reads own requests" on public.service_requests
  for select using (customer_id = auth.uid() or professional_id = auth.uid() or public.is_admin());

create policy "Service account inserts requests" on public.service_requests
  for insert with check (false);  -- submit_service_request() bypasses RLS

-- Status updates blocked from frontend; RPC functions use security definer
create policy "Service account updates requests" on public.service_requests
  for update using (false);

-- ─── request_status_history RLS ──────────────────────────────────────────────
create policy "Parties read own request history" on public.request_status_history
  for select using (
    request_id in (
      select id from public.service_requests
      where customer_id = auth.uid() or professional_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Service account inserts history" on public.request_status_history
  for insert with check (false);  -- done by security definer functions

-- ─── reviews RLS ─────────────────────────────────────────────────────────────
-- Public can read reviews (for professional profiles)
create policy "Public reads reviews" on public.reviews
  for select using (true);

create policy "Service account inserts reviews" on public.reviews
  for insert with check (false);  -- submit_review() bypasses RLS

create policy "Admin deletes reviews" on public.reviews
  for delete using (public.is_admin());

-- ─── professional_documents RLS ──────────────────────────────────────────────
create policy "Owner reads own docs" on public.professional_documents
  for select using (
    professional_id in (
      select id from public.professional_profiles where user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Owner uploads docs" on public.professional_documents
  for insert with check (
    professional_id in (
      select id from public.professional_profiles where user_id = auth.uid()
    )
  );

create policy "Admin updates doc verification" on public.professional_documents
  for update using (public.is_admin());

-- ─── admin_actions RLS ───────────────────────────────────────────────────────
create policy "Admins read all actions" on public.admin_actions
  for select using (public.is_admin());

create policy "Admins insert actions" on public.admin_actions
  for insert with check (public.is_admin() and admin_id = auth.uid());

-- ============================================================================
-- SEED DATA
-- ============================================================================

insert into public.service_categories (name, description, icon, is_active)
values
  ('Plumbing',           'Pipe repairs, installations, leaks, and drain cleaning.',     '🔧', true),
  ('Electrical Work',    'Wiring, circuit breakers, lighting, and safety inspections.', '⚡', true),
  ('Tap & Faucet Repair','Fix dripping taps, replace faucets, and handle mixer issues.','🚿', true),
  ('Drain Cleaning',     'Unblock and clean kitchen, bathroom, and floor drains.',      '🪣', true),
  ('Water Heater',       'Installation, repair, and maintenance of geysers and boilers.','🌡️', true),
  ('Switchboard Repair', 'Fix faulty switches, sockets, and MCB trips.',                '🔌', true),
  ('Fan Installation',   'Ceiling fan fitting, replacement, and speed regulator repair.','🌀', true),
  ('Pipe Installation',  'New pipe laying, PVC and CPVC fittings, and water supply.',   '🔩', true)
on conflict (name) do nothing;

-- ============================================================================
-- STORAGE BUCKETS
-- (Run after migration in Supabase Dashboard > Storage, or via CLI)
-- ============================================================================
-- bucket: avatars         (public read, authenticated write, max 2MB, images only)
-- bucket: professional-docs (private, authenticated owner write, admin read, max 5MB)
-- See README for exact Storage policy SQL.
