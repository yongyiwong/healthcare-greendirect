CREATE TABLE public.form_business_listing
(
  id serial PRIMARY KEY,
  user_id INT NULL REFERENCES public.user(id),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email public.citext NOT NULL,
  business_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT,
  state_id INT NULL REFERENCES public.state(id),
  postal_code TEXT NOT NULL,
  website TEXT,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer);
