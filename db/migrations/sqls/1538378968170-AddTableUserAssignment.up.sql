-- create user_assignment_table
CREATE TABLE public.user_assignment (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer,
    role_id integer NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);
ALTER TABLE public.user_assignment OWNER TO root;

-- auto increment sequence
CREATE SEQUENCE public.user_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.user_assignment_id_seq OWNER TO root;
ALTER SEQUENCE public.user_assignment_id_seq OWNED BY public.user_assignment.id;
ALTER TABLE ONLY public.user_assignment ALTER COLUMN id SET DEFAULT nextval('public.user_assignment_id_seq'::regclass);

-- primary key
ALTER TABLE ONLY public.user_assignment
    ADD CONSTRAINT user_assignment_pkey PRIMARY KEY (id);

-- foreign keys
ALTER TABLE ONLY public.user_assignment
    ADD CONSTRAINT user_assignment_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(id);
ALTER TABLE ONLY public.user_assignment
    ADD CONSTRAINT user_assignment_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id);
ALTER TABLE ONLY public.user_assignment
    ADD CONSTRAINT user_assignment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


ALTER TABLE ONLY public.role
    ADD CONSTRAINT role__name__uq UNIQUE (name);

-- Seed Roles and Mock users
-- * Admin (carried over from sierralabs-identity)
-- * SITE_ADMIN
-- * EMPLOYEE
-- * PATIENT (default)
-- --------------------------------------------------------------
BEGIN;
--
-- Inserts (Updates if exist)
-- IMPORTANT: avoid using DO UPDATE if possible:
-- https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql

-- * New Role: 'Admin'
-- * New Mock User: Administrator II
-- * Password: password
WITH
  NEW_ROLE AS
  (
    INSERT INTO public.role (id, name)
    VALUES (default, 'Admin')
    ON CONFLICT ON CONSTRAINT role__name__uq
    DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  ),
  NEW_MOCK_USER AS
  (
    INSERT INTO public."user" (email, password, first_name, last_name, verified)
    VALUES ('gd_admin@isbx.com', '$2b$14$8kqtODxvfopt1.nUjVYUTOxEzfbpCbdQdH6u3z30QOCc9otT.3a8y', 'Administrator', 'II', true)
    RETURNING id
  ),
  NEW_MOCK_USER_ASSIGNMENT AS
  (
    INSERT INTO public.user_assignment(user_id, location_id, role_id)
    (SELECT nu.id, null, nr.id  FROM NEW_MOCK_USER nu CROSS JOIN NEW_ROLE nr)
    RETURNING id, user_id, location_id, role_id
  )
INSERT INTO public.user_role(user_id, role_id)
(SELECT na.user_id, na.role_id  FROM NEW_MOCK_USER_ASSIGNMENT na);

-- * New Role: SITE_ADMIN
-- * New Mock User: SiteAdmin
-- * Password: password
WITH
  NEW_ROLE AS
  (
    INSERT INTO public.role (id, name)
    VALUES (default,  'SITE_ADMIN')
    ON CONFLICT ON CONSTRAINT role__name__uq
    DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  ),
  NEW_MOCK_USER AS
  (
    INSERT INTO public."user" (email, password, first_name, last_name, verified)
    VALUES ('gd_site_admin@isbx.com', '$2b$14$8kqtODxvfopt1.nUjVYUTOxEzfbpCbdQdH6u3z30QOCc9otT.3a8y', 'SiteAdmin', 'GD', true)
    RETURNING id
  ),
  NEW_MOCK_USER_ASSIGNMENT AS
  (
    INSERT INTO public.user_assignment(user_id, location_id, role_id)
    (SELECT nu.id, null, nr.id  FROM NEW_MOCK_USER nu CROSS JOIN NEW_ROLE nr)
    RETURNING id, user_id, location_id, role_id
  )
INSERT INTO public.user_role(user_id, role_id)
(SELECT na.user_id, na.role_id  FROM NEW_MOCK_USER_ASSIGNMENT na);

-- * New Role: EMPLOYEE
-- * New Mock User: Employee
-- * Password: password
WITH
  NEW_ROLE AS
  (
    INSERT INTO public.role (id, name)
    VALUES (default, 'EMPLOYEE')
    ON CONFLICT ON CONSTRAINT role__name__uq
    DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  ),
  NEW_MOCK_USER AS
  (
    INSERT INTO public."user" (email, password, first_name, last_name, verified)
    VALUES ('gd_employee@isbx.com', '$2b$14$8kqtODxvfopt1.nUjVYUTOxEzfbpCbdQdH6u3z30QOCc9otT.3a8y', 'Employee', 'GD', true)
    RETURNING id
  ),
  NEW_MOCK_USER_ASSIGNMENT AS
  (
    INSERT INTO public.user_assignment(user_id, location_id, role_id)
    (SELECT nu.id, null, nr.id  FROM NEW_MOCK_USER nu CROSS JOIN NEW_ROLE nr)
    RETURNING id, user_id, location_id, role_id
  )
INSERT INTO public.user_role(user_id, role_id)
(SELECT na.user_id, na.role_id  FROM NEW_MOCK_USER_ASSIGNMENT na);


-- * New Role: PATIENT
-- * New Mock User: (none, defaults)
INSERT INTO public.role (id, name)
VALUES (default, 'PATIENT')
ON CONFLICT ON CONSTRAINT role__name__uq
DO NOTHING;
-- Use DO NOTHING since we dont need RETURING

COMMIT;
