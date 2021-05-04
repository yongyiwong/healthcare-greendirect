CREATE TABLE public.order_tax (
    id integer NOT NULL,
    state_tax numeric NOT NULL DEFAULT 0,
    muni_tax numeric NOT NULL DEFAULT 0,
    others numeric(5,2),
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);
ALTER TABLE public.order_tax OWNER TO root;
COMMENT ON COLUMN public.order_tax.state_tax IS 'state tax stored by face value (ie, 100% stored as 100.0) Divide by 100 to use in calculations';
COMMENT ON COLUMN public.order_tax.muni_tax IS 'muni tax stored by face value (ie, 100% stored as 100.0) Divide by 100 to use in calculations';
-- Primary key
ALTER TABLE public.order_tax
    ADD CONSTRAINT order_tax__id_pk PRIMARY KEY (id);

-- Auto increment primary key
CREATE SEQUENCE public.order_tax_id__seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.order_tax_id__seq OWNER TO root;
ALTER SEQUENCE public.order_tax_id__seq OWNED BY public.order_tax.id;
ALTER TABLE ONLY public.order_tax ALTER COLUMN id SET DEFAULT nextval('public.order_tax_id__seq'::regclass);

-- Add foreign key to order
ALTER TABLE ONLY public.order 
  ADD COLUMN order_tax_id integer NULL,
  ADD CONSTRAINT order__order_tax_id__fk 
    FOREIGN KEY (order_tax_id) 
    REFERENCES public.order_tax(id);
