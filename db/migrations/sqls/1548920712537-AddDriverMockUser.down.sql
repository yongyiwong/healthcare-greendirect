BEGIN;
DELETE FROM public."user" WHERE email IN ('gd_driver@isbx.com');
DELETE FROM public."role" WHERE name IN ('DRIVER');
COMMIT;
