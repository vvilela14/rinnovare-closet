
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_4_days numeric,
  ADD COLUMN IF NOT EXISTS price_7_days numeric,
  ADD COLUMN IF NOT EXISTS price_12_days numeric,
  ADD COLUMN IF NOT EXISTS installments integer;
