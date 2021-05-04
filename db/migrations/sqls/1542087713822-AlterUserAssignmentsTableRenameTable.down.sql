ALTER TABLE public.user_location
ADD COLUMN role_id integer NOT NULL REFERENCES public.role(id) DEFAULT 1;

-- remove provided default value for NOT NULL constraint
ALTER TABLE public.user_location
ALTER COLUMN role_id DROP DEFAULT;

ALTER TABLE public.user_location
RENAME TO user_assignment;
