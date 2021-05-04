CREATE TABLE public.coupon_limit (
  id serial PRIMARY KEY,
  coupon_id INT NOT NULL REFERENCES public.coupon(id),
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);

CREATE TABLE public.coupon_limit_category (
  id serial PRIMARY KEY,
  coupon_limit_id INT NOT NULL REFERENCES public.coupon_limit(id),
  category TEXT NOT NULL,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
