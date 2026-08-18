-- Run this in Supabase SQL Editor before using the updated stylist form
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS phone     TEXT;
