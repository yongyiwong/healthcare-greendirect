CREATE TABLE public.form_contact (
  id serial PRIMARY KEY,
  user_id INT NULL REFERENCES public.user(id),
  full_name text NOT NULL,
  phone_number text,
  email public.citext NOT NULL,
  city text,
  state_id INT NULL REFERENCES public.state(id),
  postal_code text,
  reason text,
  message text,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
