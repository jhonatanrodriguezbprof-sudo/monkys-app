-- ============================================================
-- Monkys — Stylist PIN access functions
-- Run in Supabase SQL Editor before using /estilista
-- ============================================================

-- 1. Add pin column to stylists if not already present
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS pin TEXT;

-- 2. Read a stylist's appointments (SECURITY DEFINER bypasses RLS for PIN auth)
CREATE OR REPLACE FUNCTION public.stylist_appointments(
  p_stylist_id UUID,
  p_date_start DATE,
  p_date_end   DATE
)
RETURNS TABLE (
  id           UUID,
  client_name  TEXT,
  client_phone TEXT,
  child_name   TEXT,
  child_age    INTEGER,
  service_name TEXT,
  date         DATE,
  time_slot    TEXT,
  status       TEXT,
  notes        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.client_name,
    a.client_phone,
    a.child_name,
    a.child_age,
    svc.name  AS service_name,
    a.date,
    a.time_slot,
    a.status,
    a.notes
  FROM public.appointments a
  LEFT JOIN public.services svc ON svc.id = a.service_id
  WHERE a.stylist_id = p_stylist_id
    AND a.date BETWEEN p_date_start AND p_date_end
    AND a.status NOT IN ('cancelled')
  ORDER BY a.date, a.time_slot;
END;
$$;

-- 3. Update appointment status — validates ownership before updating
CREATE OR REPLACE FUNCTION public.stylist_update_status(
  p_appointment_id UUID,
  p_stylist_id     UUID,
  p_status         TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Only allow transitions that make sense for a stylist
  IF p_status NOT IN ('completed', 'no-show') THEN
    RETURN FALSE;
  END IF;

  UPDATE public.appointments
  SET status = p_status
  WHERE id = p_appointment_id
    AND stylist_id = p_stylist_id
    AND status IN ('pending', 'confirmed');

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- 4. Verify: set a test PIN on an existing stylist to try the flow
-- UPDATE public.stylists SET pin = '1234' WHERE name = 'Laura';
