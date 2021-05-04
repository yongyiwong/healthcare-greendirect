
DROP TABLE public.user_assignment cascade;
ALTER TABLE public.role DROP CONSTRAINT role__name__uq;

BEGIN;
DELETE FROM public."user" WHERE email IN ('gd_admin@isbx.com', 'gd_site_admin@isbx.com', 'gd_employee@isbx.com');

-- Retains Admin, we don't know if it existed before the migration
DELETE FROM public."role" WHERE name IN ('SITE_ADMIN','EMPLOYEE','PATIENT');
COMMIT;


