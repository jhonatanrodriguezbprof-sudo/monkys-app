-- ============================================================
-- Monkys Kids Hair Salon — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- SALONS (multi-tenant root)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  primary_color TEXT DEFAULT '#6DC926',
  logo_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- USERS (mirrors auth.users, stores role + salon)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'stylist', 'client')),
  salon_id   UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  full_name  TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- SERVICES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id         UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- STYLISTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stylists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id   UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id      UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_name   TEXT NOT NULL,
  client_phone  TEXT NOT NULL,
  child_name    TEXT NOT NULL,
  child_age     INTEGER NOT NULL,
  stylist_id    UUID NOT NULL REFERENCES public.stylists(id) ON DELETE RESTRICT,
  service_id    UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  date          DATE NOT NULL,
  time_slot     TEXT NOT NULL,         -- e.g. '09:00', '09:30'
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','completed','cancelled','no-show')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent double-booking (same stylist + date + time, not cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_book
  ON public.appointments (stylist_id, date, time_slot)
  WHERE status NOT IN ('cancelled', 'no-show');

-- ──────────────────────────────────────────────────────────
-- TIME_SLOTS (optional — for pre-generating availability)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id     UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  stylist_id   UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  time         TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stylist_id, date, time)
);

-- ──────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.salons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots  ENABLE ROW LEVEL SECURITY;

-- Salons: anyone can read
CREATE POLICY "salons_read_all" ON public.salons
  FOR SELECT USING (true);

-- Services: anyone can read (needed for booking flow)
CREATE POLICY "services_read_all" ON public.services
  FOR SELECT USING (true);

-- Stylists: anyone can read active stylists
CREATE POLICY "stylists_read_active" ON public.stylists
  FOR SELECT USING (is_active = true);

-- Stylists: admin of same salon can manage
CREATE POLICY "stylists_admin_manage" ON public.stylists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.salon_id = stylists.salon_id
    )
  );

-- Users: users can read their own profile
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Users: admins can read all users in their salon
CREATE POLICY "users_admin_read" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.salon_id = users.salon_id
    )
  );

-- Appointments: public insert (booking flow — no auth required)
CREATE POLICY "appointments_public_insert" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Appointments: stylists can read their own appointments
CREATE POLICY "appointments_stylist_read" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stylists s
      WHERE s.id = appointments.stylist_id AND s.user_id = auth.uid()
    )
  );

-- Appointments: stylists can update their own (mark complete/no-show)
CREATE POLICY "appointments_stylist_update" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stylists s
      WHERE s.id = appointments.stylist_id AND s.user_id = auth.uid()
    )
  );

-- Appointments: admins can do everything in their salon
CREATE POLICY "appointments_admin_all" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.salon_id = appointments.salon_id
    )
  );

-- Time slots: read all
CREATE POLICY "time_slots_read_all" ON public.time_slots
  FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- TRIGGER: auto-create user profile on sign-up
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only insert if not already created (e.g. admin-created users)
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- SEED DATA — Monkys salon + default services
-- ──────────────────────────────────────────────────────────
INSERT INTO public.salons (id, name, slug, primary_color)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Monkys Kids Hair Salon',
  'monkys',
  '#6DC926'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (salon_id, name, duration_minutes, price) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Corte infantil',       30,  25000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Lavado + Corte',        45,  35000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Peinado especial',      30,  30000)
ON CONFLICT DO NOTHING;
