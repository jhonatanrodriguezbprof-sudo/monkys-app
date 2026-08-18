-- ============================================================
-- Monkys Kids Hair Salon — Seed Data
-- Run this in Supabase SQL Editor after schema.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- ── Salon ────────────────────────────────────────────────
INSERT INTO public.salons (id, name, slug, primary_color)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Monkys Kids Hair Salon',
  'monkys',
  '#6DC926'
) ON CONFLICT (id) DO NOTHING;

-- ── Services ─────────────────────────────────────────────
INSERT INTO public.services (id, salon_id, name, duration_minutes, price)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Corte infantil', 30, 25000
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Lavado + Corte', 45, 35000
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Peinado especial', 30, 30000
  )
ON CONFLICT (id) DO NOTHING;

-- ── Stylists (no auth user required for booking) ─────────
INSERT INTO public.stylists (id, salon_id, name, is_active)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Laura', true
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Sofia', true
  )
ON CONFLICT (id) DO NOTHING;

-- ── Time slots for next 14 days ──────────────────────────
-- Generates slots for Laura and Sofia across the next 14 days.
-- Uses generate_series so it's always relative to today.
DO $$
DECLARE
  stylist_ids UUID[] := ARRAY[
    'c1000000-0000-0000-0000-000000000001'::UUID,
    'c1000000-0000-0000-0000-000000000002'::UUID
  ];
  slot_times TEXT[] := ARRAY['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
  d DATE;
  s UUID;
  t TEXT;
BEGIN
  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', '1 day')::DATE LOOP
    -- Skip Sundays (dow = 0)
    IF EXTRACT(DOW FROM d) = 0 THEN CONTINUE; END IF;
    FOREACH s IN ARRAY stylist_ids LOOP
      FOREACH t IN ARRAY slot_times LOOP
        INSERT INTO public.time_slots (salon_id, stylist_id, date, time, is_available)
        VALUES (
          'a1b2c3d4-0000-0000-0000-000000000001',
          s, d, t, true
        )
        ON CONFLICT (stylist_id, date, time) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
