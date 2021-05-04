ALTER TABLE public.user_assignment
RENAME TO user_location;

ALTER TABLE public.user_location
DROP COLUMN role_id;
