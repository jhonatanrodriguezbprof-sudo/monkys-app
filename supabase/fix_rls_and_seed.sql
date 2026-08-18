-- ============================================================
-- Monkys — Fix: ensure public INSERT policy + seed data
-- Run this in Supabase SQL Editor if appointments aren't saving
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

-- 1. Re-create the public INSERT policy in case it was missed
DROP POLICY IF EXISTS "appointments_public_insert" ON public.appointments;
CREATE POLICY "appointments_public_insert" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- 2. Add specialty / phone columns to stylists (idempotent)
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS phone     TEXT;

-- 3. Ensure salon exists
INSERT INTO public.salons (id, name, slug, primary_color)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Monkys Kids Hair Salon',
  'monkys',
  '#6DC926'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Ensure services with STABLE UUIDs exist (match app fallbacks)
INSERT INTO public.services (id, salon_id, name, duration_minutes, price)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Corte infantil',   30, 25000),
  ('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lavado + Corte',   45, 35000),
  ('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Peinado especial', 30, 30000)
ON CONFLICT (id) DO NOTHING;

-- 5. Ensure stylists with STABLE UUIDs exist (match app fallbacks)
INSERT INTO public.stylists (id, salon_id, name, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Laura', true),
  ('c1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Sofia', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Verify: run this SELECT to confirm everything is correct
SELECT 'salon'    AS type, id::text, name FROM public.salons   WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001'
UNION ALL
SELECT 'service'  AS type, id::text, name FROM public.services WHERE salon_id = 'a1b2c3d4-0000-0000-0000-000000000001'
UNION ALL
SELECT 'stylist'  AS type, id::text, name FROM public.stylists WHERE salon_id = 'a1b2c3d4-0000-0000-0000-000000000001'
ORDER BY type, name;
