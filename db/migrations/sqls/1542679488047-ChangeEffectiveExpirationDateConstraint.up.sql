ALTER TABLE public.coupon
  ALTER COLUMN effective_date DROP NOT NULL,
  ALTER COLUMN expiration_date DROP NOT NULL;
