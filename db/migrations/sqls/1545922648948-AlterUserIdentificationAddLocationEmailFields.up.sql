ALTER TABLE public.user_identification
  ADD COLUMN email public.citext NULL,
  ADD COLUMN location_id INT NULL REFERENCES public.location(id);

