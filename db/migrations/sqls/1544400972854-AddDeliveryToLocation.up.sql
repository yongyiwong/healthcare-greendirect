ALTER TABLE public.location
  ADD COLUMN is_delivery_available boolean DEFAULT false,
  ADD COLUMN delivery_mile_radius  int     NULL;
