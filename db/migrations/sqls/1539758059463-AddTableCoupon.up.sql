CREATE TABLE public.coupon (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  effective_date timestamp without time zone NOT NULL,
  expiration_date timestamp without time zone NOT NULL,
  discount_type text NOT NULL,
  discount_amount numeric(7,2) NOT NULL,
  discount_application text NOT NULL,
  applicable_item_count integer,
  apply_with_other boolean DEFAULT false NOT NULL,
  coupon_sku text NOT NULL,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
ALTER TABLE public.coupon OWNER TO root;

CREATE TABLE public.location_coupon (
  id serial PRIMARY KEY,
  coupon_id integer REFERENCES public.coupon(id) ON DELETE CASCADE,
  location_id integer REFERENCES public.location(id) ON DELETE CASCADE,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
ALTER TABLE public.location_coupon OWNER TO root;

CREATE TABLE public.coupon_day (
  id serial PRIMARY KEY,
  coupon_id integer REFERENCES public.coupon(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
ALTER TABLE public.coupon_day OWNER TO root;

CREATE TABLE public.order_coupon (
  id serial PRIMARY KEY,
  order_id integer REFERENCES public.order(id) ON DELETE CASCADE,
  coupon_id integer REFERENCES public.coupon(id) ON DELETE CASCADE,
  applied boolean DEFAULT true NOT NULL,
  deleted boolean DEFAULT false NOT NULL,
  created timestamp without time zone DEFAULT now() NOT NULL,
  created_by integer,
  modified timestamp without time zone DEFAULT now() NOT NULL,
  modified_by integer
);
ALTER TABLE public.order_coupon OWNER TO ROOT;
