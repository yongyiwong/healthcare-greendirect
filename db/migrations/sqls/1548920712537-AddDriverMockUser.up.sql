-- Add Seed Role and Mock user
-- * DRIVER
-- --------------------------------------------------------------
BEGIN;
--
-- Inserts (Updates if exist)
-- IMPORTANT: avoid using DO UPDATE if possible:
-- https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql


-- * New Role: DRIVER
-- * New Mock User: Driver
-- * Password: password
WITH
  NEW_ROLE AS
  (
    INSERT INTO public.role (id, name)
    VALUES (default, 'DRIVER')
    ON CONFLICT ON CONSTRAINT role__name__uq
    DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  ),
  NEW_MOCK_USER AS
  (
    INSERT INTO public."user" (email, password, first_name, last_name, verified)
    VALUES ('gd_driver@isbx.com', '$2b$14$8kqtODxvfopt1.nUjVYUTOxEzfbpCbdQdH6u3z30QOCc9otT.3a8y', 'Driver', 'GD', true)
    RETURNING id
  )
INSERT INTO public.user_role(user_id, role_id)
(SELECT nu.id, nr.id  FROM NEW_MOCK_USER nu CROSS JOIN NEW_ROLE nr);

COMMIT;
