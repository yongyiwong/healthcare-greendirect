
-- Update effective_date and expiration_date data with null values to '0001-01-01 00:00:00'.
UPDATE public.coupon SET effective_date = '0001-01-01 00:00:00' WHERE effective_date IS NULL;
UPDATE public.coupon SET expiration_date = '0001-01-01 00:00:00' WHERE expiration_date IS NULL;

ALTER TABLE public.coupon
  ALTER COLUMN effective_date SET NOT NULL,
  ALTER COLUMN expiration_date SET NOT NULL;
