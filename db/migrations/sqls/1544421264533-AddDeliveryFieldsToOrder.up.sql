ALTER TABLE public.order
  ADD COLUMN is_delivery boolean DEFAULT false,
  ADD COLUMN delivery_address_line_1 TEXT,
  ADD COLUMN delivery_address_line_2 TEXT NULL,
  ADD COLUMN delivery_city TEXT NULL,
  ADD COLUMN delivery_state_id INT NULL REFERENCES public.state(id),
  ADD COLUMN delivery_postal_code TEXT NULL,
  ADD COLUMN delivery_instruction TEXT NULL,
  ADD COLUMN delivery_fee numeric(7,2) NULL

