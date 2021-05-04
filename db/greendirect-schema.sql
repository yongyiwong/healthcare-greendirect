--
-- PostgreSQL database dump
--

-- Dumped from database version 10.4 (Debian 10.4-2.pgdg90+1)
-- Dumped by pg_dump version 10.4 (Debian 10.4-2.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: root
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO root;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: root
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO root;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: root
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO root;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: root
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: doctor; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.doctor (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    long_lat point,
    address_line_1 text,
    address_line_2 text,
    city text,
    state_id integer,
    postal_code text,
    phone_number text,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.doctor OWNER TO root;

--
-- Name: doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctor_id_seq OWNER TO root;

--
-- Name: doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.doctor_id_seq OWNED BY public.doctor.id;


--
-- Name: location; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location (
    id integer NOT NULL,
    pos_id integer,
    name text NOT NULL,
    description text,
    thumbnail text,
    organization_id integer,
    location_category_id integer,
    long_lat point,
    timezone text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state_id integer,
    postal_code text,
    phone_number text,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.location OWNER TO root;

--
-- Name: location_category; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_category (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.location_category OWNER TO root;

--
-- Name: location_category_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_category_id_seq OWNER TO root;

--
-- Name: location_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_category_id_seq OWNED BY public.location_category.id;


--
-- Name: location_holiday; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_holiday (
    id integer NOT NULL,
    location_id integer,
    date date NOT NULL,
    is_open boolean DEFAULT false NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.location_holiday OWNER TO root;

--
-- Name: location_holiday_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_holiday_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_holiday_id_seq OWNER TO root;

--
-- Name: location_holiday_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_holiday_id_seq OWNED BY public.location_holiday.id;


--
-- Name: location_hour; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_hour (
    id integer NOT NULL,
    location_id integer,
    day_of_week smallint DEFAULT 0 NOT NULL,
    is_open boolean DEFAULT false NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.location_hour OWNER TO root;

--
-- Name: location_hour_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_hour_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_hour_id_seq OWNER TO root;

--
-- Name: location_hour_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_hour_id_seq OWNED BY public.location_hour.id;


--
-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_id_seq OWNER TO root;

--
-- Name: location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_id_seq OWNED BY public.location.id;


--
-- Name: location_log; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_log (
    id integer NOT NULL,
    location_id integer,
    user_id integer,
    status text NOT NULL,
    message text,
    created timestamp without time zone DEFAULT now() NOT NULL,
    modified timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.location_log OWNER TO root;

--
-- Name: location_log_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_log_id_seq OWNER TO root;

--
-- Name: location_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_log_id_seq OWNED BY public.location_log.id;


--
-- Name: location_promotion; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_promotion (
    id integer NOT NULL,
    location_id integer,
    name text NOT NULL,
    description text,
    image_url text,
    expire_date timestamp without time zone NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.location_promotion OWNER TO root;

--
-- Name: location_promotion_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_promotion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_promotion_id_seq OWNER TO root;

--
-- Name: location_promotion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_promotion_id_seq OWNED BY public.location_promotion.id;


--
-- Name: location_rating; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.location_rating (
    id integer NOT NULL,
    user_id integer,
    location_id integer,
    rating numeric(2,1) NOT NULL,
    review text,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.location_rating OWNER TO root;

--
-- Name: location_rating_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.location_rating_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_rating_id_seq OWNER TO root;

--
-- Name: location_rating_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.location_rating_id_seq OWNED BY public.location_rating.id;


--
-- Name: order; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public."order" (
    id integer NOT NULL,
    pos_id integer,
    user_id integer,
    location_id integer,
    name text,
    order_type text NOT NULL,
    order_source text NOT NULL,
    is_submitted boolean DEFAULT false NOT NULL,
    submitted_date date,
    fullfillment_method text,
    order_total numeric(7,2),
    balance_due numeric(7,2),
    tax_total numeric(7,2),
    coupon_total numeric(7,2),
    order_status text,
    is_payment_complete boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public."order" OWNER TO root;

--
-- Name: order_history; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.order_history (
    id integer NOT NULL,
    order_id integer,
    order_status text NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL
);


ALTER TABLE public.order_history OWNER TO root;

--
-- Name: order_history_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.order_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_history_id_seq OWNER TO root;

--
-- Name: order_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.order_history_id_seq OWNED BY public.order_history.id;


--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_seq OWNER TO root;

--
-- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


--
-- Name: order_product; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.order_product (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    product_pricing_weight_id integer,
    name text NOT NULL,
    quantity integer NOT NULL,
    sold_weight numeric(7,2),
    sold_weight_unit text,
    price numeric(7,2) NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.order_product OWNER TO root;

--
-- Name: order_product_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.order_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_product_id_seq OWNER TO root;

--
-- Name: order_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.order_product_id_seq OWNED BY public.order_product.id;

--
-- Name: organization; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.organization (
    id integer NOT NULL,
    pos_id integer,
    pos text,
    pos_config jsonb,
    name text NOT NULL,
    description text,
    contact_name text,
    contact_email public.citext,
    contact_phone text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state_id integer,
    postal_code text,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.organization OWNER TO root;

--
-- Name: organization_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organization_id_seq OWNER TO root;

--
-- Name: organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.product (
    id integer NOT NULL,
    pos_id integer,
    location_id integer,
    name text NOT NULL,
    description text,
    category text,
    subcategory text,
    is_in_stock boolean DEFAULT true NOT NULL,
    is_medicated boolean DEFAULT false NOT NULL,
    strain_id integer,
    strain_name text,
    pricing_type text,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.product OWNER TO root;

--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_id_seq OWNER TO root;

--
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- Name: product_image; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.product_image (
    id integer NOT NULL,
    product_id integer,
    size text NOT NULL,
    url text NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.product_image OWNER TO root;

--
-- Name: product_image_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.product_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_image_id_seq OWNER TO root;

--
-- Name: product_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.product_image_id_seq OWNED BY public.product_image.id;


--
-- Name: product_log; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.product_log (
    id integer NOT NULL,
    location_log_id integer,
    product_id integer,
    status text NOT NULL,
    message text,
    product_snapshot jsonb,
    created timestamp without time zone DEFAULT now() NOT NULL,
    modified timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_log OWNER TO root;

--
-- Name: product_log_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.product_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_log_id_seq OWNER TO root;

--
-- Name: product_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.product_log_id_seq OWNED BY public.product_log.id;


--
-- Name: product_pricing; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.product_pricing (
    id integer NOT NULL,
    product_id integer,
    price numeric(7,2),
    pricing_group_name text,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.product_pricing OWNER TO root;

--
-- Name: product_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.product_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_pricing_id_seq OWNER TO root;

--
-- Name: product_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.product_pricing_id_seq OWNED BY public.product_pricing.id;


--
-- Name: product_pricing_weight; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.product_pricing_weight (
    id integer NOT NULL,
    pos_id integer,
    product_pricing_id integer,
    name text NOT NULL,
    price numeric(7,2) NOT NULL
);


ALTER TABLE public.product_pricing_weight OWNER TO root;

--
-- Name: product_pricing_weight_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.product_pricing_weight_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_pricing_weight_id_seq OWNER TO root;

--
-- Name: product_pricing_weight_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.product_pricing_weight_id_seq OWNED BY public.product_pricing_weight.id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.role (
    id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.role OWNER TO root;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO root;

--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: state; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.state (
    id integer NOT NULL,
    name text NOT NULL,
    abbreviation character varying(3) NOT NULL,
    country character varying NOT NULL,
    state_type text NOT NULL,
    assoc_press text NOT NULL,
    standard_federal_region text NOT NULL,
    census_region text NOT NULL,
    census_region_name text NOT NULL,
    census_division text NOT NULL,
    census_division_name text NOT NULL,
    circuit_court text NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.state OWNER TO root;

--
-- Name: state_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.state_id_seq OWNER TO root;

--
-- Name: state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.state_id_seq OWNED BY public.state.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    pos_id integer,
    email public.citext NOT NULL,
    password character varying(256) NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    mobile_number text,
    patient_number text,
    verification_code text,
    verification_created timestamp without time zone,
    verified boolean DEFAULT false NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public."user" OWNER TO root;

--
-- Name: user_address; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_address (
    id integer NOT NULL,
    user_id integer,
    address_line_1 text,
    address_line_2 text,
    city text,
    state_pos text,
    state_id integer,
    postal_code text,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.user_address OWNER TO root;

--
-- Name: user_address_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_address_id_seq OWNER TO root;

--
-- Name: user_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_address_id_seq OWNED BY public.user_address.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO root;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: user_identification; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_identification (
    id integer NOT NULL,
    pos_id integer,
    user_id integer,
    type text NOT NULL,
    number text NOT NULL,
    state text,
    is_active boolean DEFAULT true NOT NULL,
    file_id integer,
    expires timestamp with time zone,
    deleted timestamp without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.user_identification OWNER TO root;

--
-- Name: user_identification_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_identification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_identification_id_seq OWNER TO root;

--
-- Name: user_identification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_identification_id_seq OWNED BY public.user_identification.id;


--
-- Name: user_mj_freeway; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_mj_freeway (
    id integer NOT NULL,
    user_id integer,
    gender text,
    birth_date date,
    is_active boolean DEFAULT true NOT NULL,
    preferred_contact text,
    tax_exempt boolean DEFAULT false NOT NULL,
    primary_facility_id integer,
    current_marijuana_provider integer,
    date_provider_can_switch date,
    diagnosis text,
    physician_name text,
    physician_license text,
    physician_address text,
    type text,
    created timestamp without time zone DEFAULT now() NOT NULL,
    modified timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_mj_freeway OWNER TO root;

--
-- Name: user_mj_freeway_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_mj_freeway_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_mj_freeway_id_seq OWNER TO root;

--
-- Name: user_mj_freeway_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_mj_freeway_id_seq OWNED BY public.user_mj_freeway.id;


--
-- Name: user_phone; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_phone (
    id integer NOT NULL,
    pos_id integer,
    user_id integer,
    type text NOT NULL,
    number text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    can_text boolean DEFAULT false NOT NULL,
    deleted timestamp without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    modified timestamp without time zone DEFAULT now() NOT NULL,
    modified_by integer
);


ALTER TABLE public.user_phone OWNER TO root;

--
-- Name: user_phone_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.user_phone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_phone_id_seq OWNER TO root;

--
-- Name: user_phone_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.user_phone_id_seq OWNED BY public.user_phone.id;


--
-- Name: user_role; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_role (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_role OWNER TO root;

--
-- Name: doctor id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.doctor ALTER COLUMN id SET DEFAULT nextval('public.doctor_id_seq'::regclass);


--
-- Name: location id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location ALTER COLUMN id SET DEFAULT nextval('public.location_id_seq'::regclass);


--
-- Name: location_category id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_category ALTER COLUMN id SET DEFAULT nextval('public.location_category_id_seq'::regclass);


--
-- Name: location_holiday id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_holiday ALTER COLUMN id SET DEFAULT nextval('public.location_holiday_id_seq'::regclass);


--
-- Name: location_hour id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_hour ALTER COLUMN id SET DEFAULT nextval('public.location_hour_id_seq'::regclass);


--
-- Name: location_log id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_log ALTER COLUMN id SET DEFAULT nextval('public.location_log_id_seq'::regclass);


--
-- Name: location_promotion id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_promotion ALTER COLUMN id SET DEFAULT nextval('public.location_promotion_id_seq'::regclass);


--
-- Name: location_rating id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_rating ALTER COLUMN id SET DEFAULT nextval('public.location_rating_id_seq'::regclass);


--
-- Name: order id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


--
-- Name: order_history id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);


--
-- Name: order_product id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_product ALTER COLUMN id SET DEFAULT nextval('public.order_product_id_seq'::regclass);


--
-- Name: organization id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);


--
-- Name: product id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- Name: product_image id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_image ALTER COLUMN id SET DEFAULT nextval('public.product_image_id_seq'::regclass);


--
-- Name: product_log id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_log ALTER COLUMN id SET DEFAULT nextval('public.product_log_id_seq'::regclass);


--
-- Name: product_pricing id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing ALTER COLUMN id SET DEFAULT nextval('public.product_pricing_id_seq'::regclass);


--
-- Name: product_pricing_weight id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing_weight ALTER COLUMN id SET DEFAULT nextval('public.product_pricing_weight_id_seq'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- Name: state id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.state ALTER COLUMN id SET DEFAULT nextval('public.state_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_address id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_address ALTER COLUMN id SET DEFAULT nextval('public.user_address_id_seq'::regclass);


--
-- Name: user_identification id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_identification ALTER COLUMN id SET DEFAULT nextval('public.user_identification_id_seq'::regclass);


--
-- Name: user_mj_freeway id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_mj_freeway ALTER COLUMN id SET DEFAULT nextval('public.user_mj_freeway_id_seq'::regclass);


--
-- Name: user_phone id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_phone ALTER COLUMN id SET DEFAULT nextval('public.user_phone_id_seq'::regclass);


--
-- Data for Name: doctor; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.doctor (id, name, description, long_lat, address_line_1, address_line_2, city, state_id, postal_code, phone_number, deleted, created, created_by, modified, modified_by) FROM stdin;
5309	JULIO CORDERO	GENERALISTA	(-67.2531974999999989,18.3423878000000009)	URB. FLAMBOYANES #6 CARRETERA 115 	\N	AGUADA	52	00602	787-868-1515	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5310	CARLOS R. SOTO VILLARUBIA	MEDICINA INTERNA	(-67.1884089999999929,18.3807270000000003)	CALLE MARINA #230 	\N	AGUADA	52	00602	787-868-8200	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5311	YOLANDA VARELA ROSA	GENERALISTA	(-67.1837749999999971,18.3804130000000008)	CALLE COLON #111 	\N	AGUADA	52	00602	787-903-9180	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5312	NELSON E. SANTIAGO CRESPO	GENERALISTA	(-67.1863019999999977,18.3800090000000012)	CALLE SAN NARCISO #161-1 	\N	AGUADA	52	00602	787-546-8643	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5313	JORGE SOTO RIVERA	INTERNISTA	(-67.1887040000000013,18.3801580000000016)	AVE. NATIVO ALERS CARR. 417 KM 1 EDIF. QUIÑONES OFIC. #3 00602	\N	AGUADA	52	00602	787-868-4469	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5314	CARLO MAX ALERS LOPEZ	GENERALISTA	(-67.1662270000000063,18.3905959999999986)	CARR. 115 KM 24.6 BO. ASOMANTE 	\N	AGUADA	52	00602	787-252-4000	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5315	ROBERTO H. GONZALEZ SANCHEZ	MEDICINA INTERNA	(-67.1843099999999964,18.3795430000000017)	CALLE COLON 127-B 	\N	AGUADA	52	00602	787-868-7110	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5316	LUIS J. ACEVEDO LAZZARINI	ORTOPEDA	(-67.1540700000000044,18.4274449999999987)	CALLE JESÚS T. PIÑEIRO #3 AGUADILLA MEDICAL BUILDING 203 	\N	AGUADILLA	52	00603	787-819-1215	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5317	LIZA M. PAULO MALAVE	HEMATOLOGÍA ONCÓLOGA	(-67.152505000000005,18.4506520000000016)	AVE. PEDRO ALBIZU CAMPOS REPARTO LOPEZ #150 AGUADILLA	\N	AGUADILLA	52	00603	787-891-0027	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5318	ILEANA ALBINO CRUZ	GENERALISTA	(-67.095405999999997,18.4939530000000012)	H1803 CALLE KENNEDY AGUADILLA	\N	AGUADILLA	52	00603	787-890-1674	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5319	JANICE M. RODRIGUEZ PIEREZ	GENERALISTA	(-67.1489579999999933,18.444941)	AVE. SEVERIANO CUEVAS, WESTERN MEDICAL PLAZA SUITE 24 	\N	AGUADILLA	52	00605	787-412-7009	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5320	JOSÉ A. TORO TORRES	MEDICINA GENERAL	(-66.1059630000000027,18.2570580000000007)	#4 CALLE RAFAEL LASA AGUAS BUENAS	\N	AGUAS BUENAS	52	00703	787-732-7733	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5321	EDWIN F. RODRÍGUEZ ALLENDE	MEDICINA INTERNA	(-66.263426999999993,18.1416830000000004)	CALLE JULIO CINTRÓN 202 EDIF. GUAYACÁN OF. 107 AIBONITO 	\N	AIBONITO	52	00705	787-735-1830	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5322	NELSON A. ROBLES CARDONA	HEMATÓLOGO ONCÓLOGO	(-66.264874000000006,18.13992)	CALLE JOSÉ C VÁZQUEZ #1 KM 4 INT. CARR 726 AIBONITO PR 	\N	AIBONITO	52	00705	787-735-1888	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5323	EDUARDO J. IBARRA ORTEGA	MEDICINA DEL DOLOR	(-66.2635400000000061,18.141335999999999)	204 CALLE JULIO CINTRÓN SUITE 224 	\N	AIBONITO	52	00705	787-735-8900	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5324	DIAHNARA MERCADO RAMÍREZ	MEDICINA GENERAL	(-67.1411619999999942,18.2820409999999995)	65 DE INFANTERÍA #67 SUITE 104-109 	\N	AÑASCO	52	00610	787-826-2145 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5325	HECTOR J. RAMÍREZ MÉNDEZ	GENERAL PRACTICE	(-67.1607860000000016,18.298722999999999)	CARR. 402 KM 4.1 BO. CARACOL 	\N	AÑASCO	52	00610	787-229-1060	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5326	MARIO O. VELEZ GONZALEZ	GENERALISTA-OCUPACIONAL	(-67.1411619999999942,18.2820409999999995)	#57 CALLE 65 DE INFANTERIA 	\N	AÑASCO	52	00612	787-826-3666	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5327	SEBASTIÁN INFANZÓN SANTOS	CIRUJANO	(-66.721894000000006,18.4739059999999995)	CALLE MANUEL PÉREZ AVILÉS #16 	\N	ARECIBO	52	00612	787-880-0600	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5328	FRANCISCO CARDONA HERNÁNDEZ	GENERALISTA	(-66.6700989999999933,18.4471360000000004)	CARR. #2 KM 68.1 BO. SANTANA	\N	ARECIBO	52	00612	787-222-2137	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5329	VANESSA RAÍCES LÓPEZ	MEDICINA GENERAL	(-66.727446999999998,18.4633199999999995)	TRINA PADILLA DE SANZ #60 	\N	ARECIBO	52	00612	787-436-9691	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5330	ELÍAS JIMÉNEZ OLIVO	PSIQUIATRA	(-66.7629150000000067,18.4798439999999999)	CALLE DR. SALAS #158 ARECIBO	\N	ARECIBO	52	00612	787-879-2425	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5331	DOMENECH A. FIGUEROA RIVERA	GENERALISTA	(-66.6538419999999974,18.4464509999999997)	CARR. #2 KM67.3 BO. SANTANA ARECIBO, PR 00612	\N	ARECIBO	52	00612	787-816-1212	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5332	VANESSA E. VARGAS VILLANUEVA	GENERALISTA	(-66.7245209999999958,18.4723049999999986)	AVE. DE DIEGO 418 OFICINA 4 	\N	ARECIBO	52	00612	787-878-6600	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5333	LUIS A PEREZ PEREZ	MEDICINA INTERNA	(-66.7231139999999954,18.4736440000000002)	CALLE GAUTIER BENITEZ  	\N	ARECIBO	52	00612	787-880-1020	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5334	MAGALI N. OCASIO CARRION	GENERALISTA	(-66.7341380000000015,18.47119)	CARR. 638 KM 4.9 CALLE HERMANOS CARRION INT. MIRAFLORES 	\N	ARECIBO	52	0061	787-650-3128	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5335	JORGE R. ROBLES IRIZARRY	PSIQUIATRA	(-66.7221200000000039,18.4753520000000009)	AVE. VICTOR ROJAS ESQUINA JUAN COLON PADILLA 	\N	ARECIBO	52	00612	787-879-5550	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5336	LUIS ANTONIO MELÉNDEZ GÓMEZ	GENERALISTA	(-66.0638050000000021,17.9632129999999997)	CALLE SOL #7 	\N	ARROYO	52	00714	787-839-0379	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5337	ANA I. OTERO CRUZ	GENERALISTA	(-66.5654499999999985,18.4307799999999986)	1933 CARR. #2 KM 57.9 CRUCE DAVILA SUITE 2 BARCELONETA 	\N	BARCELONETA	52	00617	787-846-3611	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5338	CARLOS A. GIL DELGADO	GENERALISTA	(-66.5383889999999951,18.4547060000000016)	CARR. 140 BO. LLANDAS KM 67.5 NORBITH PLAZA 	\N	BARCELONETA	52	00617	787-846-3145	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5339	FRANCISCO J. FONTANET AVILES	MEDICINA FAMILIAR	(-66.5342959999999977,18.4489540000000005)	CARR. 140 KM 63.5 BO. MAGUEYES 	\N	BARCELONETA	52	00617	787-846-7784	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5340	MADELAINE BERRIOS NÚÑEZ	FAMILIA	(-66.2915169999999989,18.2080370000000009)	CARR. 152 KM. 2.2 BARRIO QUEBRADILLAS 	\N	BARRANQUITAS	52	00794	787-857-8383	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5341	RENE CASAS BENABE	MEDICINA INTERNA	(-66.3058340000000044,18.1861789999999992)	19 CALLE MUÑOZ RIVERA 	\N	BARRANQUITAS	52	00794	787-857-3448	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5342	HECTOR M. ORTIZ VALLADARES	ANESTESIOLOGIA	(-66.1484779999999972,18.3973809999999993)	TORRES SAN PABLO SUITE 103 	\N	BAYAMON	52	00961	787-505-1910	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5343	RODRIGO VELA CORDOVA	GENERALISTA	(-66.1683579999999978,18.3978180000000009)	CALLE 2  H-29 URB. VILLA RICA 	\N	BAYAMON	52	00959	787-785-6611	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5344	ROSANNA BRICEÑO SANCHEZ	GENERALISTA	(-66.1482599999999934,18.4009019999999985)	URB. RIVERVIEW CALLE 1 HH1 	\N	BAYAMON	52	00961	787-240-1240	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5345	PABLO E. IRIZARRY BONILLA	PEDIATRA	(-66.1455160000000006,18.396211000000001)	CALLE SANTA CRUZ #68 SUITE 304 	\N	BAYAMÓN	52	00961	787-780-3920	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5346	RENIER MÉNDEZ GUZMÁN	MANEJO DE DOLOR	(-66.1446739999999949,18.3957319999999989)	CALLE SANTA CRUZ E22 	\N	BAYAMÓN	52	00961	787-740-4286	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5347	SAMUEL G. CASTRO RIVERA	MEDICINA GENERAL	(-66.138694000000001,18.350086000000001)	URB. MIRAFLORES C 43 BLOQUE #34 #1 	\N	BAYAMÓN	52	00957	787-797-5365	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5348	IVÁN G. RAMOS RAMÍREZ	MEDICINA INTERNA	(-66.1637879999999967,18.3975329999999992)	SUITE 607 BAYAMÓN MEDICAL PLAZA CARR. #2 	\N	BAYAMÓN	52	00959	787-405-6612	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5349	ISMAEL TORO GRAJALES	GERIATRÍA	(-66.1528490000000033,18.399871000000001)	URB. SANTA CRUZ CALLE 3 #C-38 	\N	BAYAMÓN	52	00961	787-780-9196	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5350	IVÁN O. SUBERVI	PSIQUIATRÍA EMERGENCIA	(-66.1492999999999967,18.3973109999999984)	EDIF. MEDICO SANTA CRUZ 73 CALLE SANTA CRUZ 	\N	BAYAMÓN	52	00961	939-225-2400	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5351	JOSÉ G. CUMBA GUERRERO	MEDICINA GENERAL	(-66.1683809999999966,18.4069779999999987)	AVE. WESTRAIN CALLE 49 BLOQUE 51 #31 SIERRA 	\N	BAYAMÓN	52	00962	787-778-4821	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5352	MADELINE GARCÍA SOBERAL	HEMATOLOGÍA ONCÓLOGA	(-66.1476650000000035,18.3975089999999994)	EDIF. ARTURO CADILLA SUITE 510 	\N	BAYAMÓN	52	00961	787-993-5294	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5353	YELITZA RUIZ CANDELARIA	HEMATOLOGÍA ONCÓLOGA	(-66.1484779999999972,18.3973809999999993)	EDIF. ARTURO CADILLA PASEO SAN PABLO #100 SUITE 510 	\N	BAYAMÓN	52	00961	787-780-2830	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5354	IVETTE M. CRESPO QUIÑONES	GENERALISTA-OCUPACIONAL	(-66.1641060000000039,18.358588000000001)	URB. SANTA JUANITA R-8 AVE. SANTA JUANITA 	\N	BAYAMÓN	52	00956	787-785-0977	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5355	VÍCTOR M. MONTAÑEZ	GENERALISTA	(-66.1538110000000046,18.3672679999999993)	AVE. LAUREL #100 	\N	BAYAMÓN	52	00956	787-515-8869	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5356	ALEJANDRO A. MEDINA VILAR	MEDICINA FAMILIAR	(-66.155887000000007,18.3970410000000015)	EDIF. JOAQUÍN MONTESINO OFICINA 107 CALLE ISABEL II 	\N	BAYAMÓN	52	00961	787-780-5930	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5357	NORBERT CORREA SARDINA	MEDICINA INTERNA	(-66.1504500000000064,18.3902050000000017)	BAYAMON MEDICAL SUITE 709 CARR. NO. 2 KM 11.3 	\N	BAYAMÓN	52	00959	787-919-7855	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5358	ANDRÉS I. GUTIÉRREZ TORO	GENERALISTA	(-67.1469000000000023,18.0859999999999985)	CALLE CARBONELL #41 	\N	CABO ROJO	52	 00623	787-255-1818	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5359	RAMON A. SOSA GARCIA	GENERALISTA	(-67.1457790000000045,18.0864979999999989)	CALLE RUIZ BELVIS #21 	\N	CABO ROJO	52	 00623	787-255-3244	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5360	CESAR A. VAZQUEZ RODRIGUEZ	MEDICINA GENERAL	(-67.1596569999999957,18.1330349999999996)	CARR. 100 KM 3.1 BO. GUANAJIBO 	\N	CABO ROJO	52	 00623	787-851-2625	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5361	STEVEN RODRÍGUEZ MONGE	MEDICINA INTERNA	(-66.0306640000000016,18.2187529999999995)	HIMA PLAZA I SUITE 511 AVE. DEGETAU 500, 5	\N	CAGUAS	52	 00725	787-743-8305	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5362	MELISSA PERFECTO PERALES	EMERGENCIÓLOGA	(-66.0268990000000002,18.2824629999999999)	VALLES DEL LAGO CALLE GUAJATACA #D17 	\N	CAGUAS	52	 00725	787-988-0111	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5363	MELISSA RODRÍGUEZ MORENO	GENERALISTA	(-66.0359200000000044,18.2341079999999991)	CALLE BETANCES #77 ESQUINA MUÑOZ RIVERA 	\N	CAGUAS	52	 00725	787-678-9798	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5364	WALLACE BELMONTE	MEDICINA INTERNA	(-66.0189100000000053,18.2337670000000003)	AVE. MUÑOZ MARÍN I 17 VILLA CARMEN 	\N	CAGUAS	52	 00725	787-258-0912	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5365	AUGUSTO PINTOR MARTÍNEZ	GENERALISTA	(-66.0410430000000019,18.2181339999999992)	CONSOLIDATED MALL C-1-D EXTERIOR SUITE 70 AVE. JOSÉ GAUTIER BENITEZ #202	\N	CAGUAS	52	 00725	787-245-7572	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5366	CARLOS E. ROBLES MORA	MEDICINA OCUPACIONAL	(-66.0597609999999946,18.2359539999999996)	CALLE ÁNGEL L. ORTIZ A6 CAGUAS, PR 00725 / LOS PADROS 501 SUITE  E	\N	CAGUAS	52	 00725	787-379-1543	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5367	VILMA V. LLERENA-MARTÍNEZ	GENERALISTA	(-66.0440229999999957,18.2237310000000008)	URB. BONNEVILLE HEIGHT D-7 AVE. DEGETAU BO. CAÑABONCITO 	\N	CAGUAS	52	 00727	787-286-1845	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5368	JOSE L. LOZADA RIVERA	GENERALISTA	(-66.0337379999999996,18.2353360000000002)	CALLE CELIS AGUILERA #43 	\N	CAGUAS	52	 00725	787-743-0757	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5369	LUIS CASTRO RIOPEDRE	GENERALISTA	(-66.0500799999999941,18.2380490000000002)	URB. VILLA TURABO CALLE PINO F-22 LOCAL #2 	\N	CAGUAS	52	 00725	787-703-7777	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5370	FRANK MARIN NEGRON	GENERALISTA	(-66.053756000000007,18.2191130000000001)	HIMA PLAZA ONE SUITE 703 	\N	CAGUAS	52	 00726	787-685-4611	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5371	CARMEN R, FIGUEROA COSME	MEDICINA OCUPACIONAL	(-66.0344580000000008,18.2943779999999983)	AVE. JOSÉ VILARES CARR. #189 URB. DELGADO O-13 	\N	CAGUAS	52	 00725	787-961-0199	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5372	MIGUEL A. BRAVO SERRANO	PSIQUIATRA	(-66.0383400000000051,18.2460060000000013)	BAIROA INDUSTRIAL PARK C/E LOTE 11 	\N	CAGUAS	52	 00725	787-996-0232	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5373	SANDRA I. VAZQUEZ GALI	MEDICO INTERNISTA	(-66.0433249999999958,18.2172300000000007)	CENTRO POLICLINICO DEL CARMEN PLAZA DEL CARMEN MALL LOCAL #49	\N	CAGUAS	52	 00725	787-925-3030	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5374	NICOLAS BEZARES TORRES	INTERNISTA	(-66.0335010000000011,18.2353789999999982)	PROLONGACION CELIS AGUILERA #6 	\N	CAGUAS	52	 00725	787-744-5042	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5375	SALVADOR GARRION DE LEON	MEDICINA INTERNA	(-66.0410430000000019,18.2181339999999992)	CONSOLIDATED MALL C-20 	\N	CAGUAS	52	 00725	787-746-0661	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5376	VICTOR J. RIVERA FORASTIERI	GENERALISTA	(-66.0345269999999971,18.236225000000001)	1 CALLE BALDORIOTY 	\N	CAGUAS	52	 00726	787-744-3135	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5377	RAUL REYES MORENO	GENERALISTA	(-66.0503439999999955,18.2147520000000007)	CALLE BORGOÑA 3 B-5 VILLA DEL REY III 	\N	CAGUAS	52	 00727	787-743-4422	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5378	ALMA  C. PONTON NIGAGLIONI	OBGYM	(-66.0304900000000004,18.2182810000000011)	HIMA PLAZA I SUITE 508 	\N	CAGUAS	52	 00725	787-626-9171	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5379	RAMÓN ANSA VILÁ	MEDICINA GENERAL	(-65.9003419999999949,18.3783940000000001)	CALLE BETANCES #80 	\N	CANOVANAS	52	 00729	787-876-8244	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5380	DIEGO JOSÉ COLÓN RODRÍGUEZ	GENERALISTA	(-65.9122430000000037,18.3759440000000005)	LOCAL AA-8 LOIZA VALLEY MALL CALLE BAHUINIA 	\N	CANOVANAS	52	00729	787-256-4541	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5381	OSCAR GARCIA ROMAN	GENERALISTA	(-65.9000570000000039,18.3802939999999992)	CALLE CORCHADO #58 	\N	CANOVANAS	52	00729	787-256-2015	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5382	JORGE L. MÉNDEZ SANTIAGO	GENERALISTA	(-66.0044720000000069,18.4304179999999995)	41 PISCIS URB. LOS ÁNGELES, 	\N	CAROLINA	52	00979	787-791-5712	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5383	ÁNGELO COPPOLA MUÑOZ	MEDICO FAMILIA	(-65.9746090000000009,18.3782819999999987)	CA28 JARDINES DE 	\N	CAROLINA	52	00987	787-257-2040	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5384	JOSÉ SILVA MORALES	GENERALISTA	(-66.0161999999999978,18.4311989999999994)	LAGUNA GARDENS SHOPPING CENTER SUITE 101-A 	\N	CAROLINA	52	00979	787-791-7287	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5385	HAYDEE REDONDO MAYMI	GENERALISTA	(-65.9930300000000045,18.3942499999999995)	2DO PISO ESCORIAL SHOPPING VILLAGE 	\N	CAROLINA	52	00987	787-769-4651	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5386	SALVADOR RIBOT RUIZ	GENERALISTA	(-65.9312950000000058,18.3738589999999995)	CARR 857 KM 0.4 BO. CANOVANILLAS, 	\N	CAROLINA	52	00987	787-776-3840 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5387	DALYA DAVILA CARMONA	GENERALISTA	(-65.9312950000000058,18.3738589999999995)	CARR 857 KM 0.4 BO. CANOVANILLAS, 	\N	CAROLINA	52	00987	787-776-3840 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5388	FERDINAND C. MENÉNDEZ	GENERALISTA	(-66.169148000000007,18.1104480000000017)	LUIS BARRERA #174, HOSP. ÁREA DE CAYEY	\N	CAYEY	52	00736	787-738-0066	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5389	ALVÍN TORRES HERNÁNDEZ	MEDICINA INTERNA	(-66.1683600000000069,18.1119249999999994)	HOSPITAL MUNICIPAL DEL MUNICIPIO AUTÓNOMO DE CAYEY, CALLE LUIS BARRERA 	\N	CAYEY	52	00736	787-263-0340	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5390	MARTA TRINIDAD	MEDICINA GENERAL	(-66.1653259999999932,18.1132600000000004)	CALLE 2 D16 URB. LA PLANICIE 	\N	CAYEY	52	00738	787-263-7459	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5391	FRANCISCO J. VÁZQUEZ REÍLLO	NEURÓLOGO	(-66.1615720000000067,18.1113159999999986)	AVE. LUIS MUÑOZ MARÍN #75 	\N	CAYEY	52	00736	787-738-5122	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5392	ROBERTO ENCARNACION	GENERALISTA	(-66.3036100000000062,18.1861740000000012)	CALLE BARCELO #10 	\N	CAYEY	52	00794	787-263-9338	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5393	CARLOS A. QUILES	GENERALISTA	(-66.1512290000000007,18.1200459999999985)	AVE. ANTONIO R. BARCELO KM 71.6 	\N	CAYEY	52	00736	787-238-5764	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5394	GERALD C. MAZO CRUZADO	MEDICINA INTERNA	(-66.1467289999999934,18.1241079999999997)	BO. RINCON SECTOR LA LOMAS 	\N	CAYEY	52	00736	939-350-9561	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5395	CORALIA L. DELGADO GONZALEZ	MEDICINA GENERAL	(-66.1332689999999985,18.1255710000000008)	EDIFICIO CARIBBEAN CINEMAS SUITE 203 PLAZA CAYEY, 	\N	CAYEY	52	00736	787-263-7451	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5396	JENARO VÉLEZ ARTEAGA	GENERALISTA	(-65.6492199999999997,18.2618560000000016)	URB. CELINA E-17 CALLE TEODORO MEDINA, 	\N	CEIBA	52	00735	787-390-3636	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5397	MARIE I. MUNTANER	MEDICINA INTERNA	(-65.6476700000000051,18.2669759999999997)	205 AVE. LAURO PIÑEIRO 	\N	CEIBA	52	00735	787-885-4446	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5398	ALBERTO SASTRE DE JESÚS	GENERALISTA	(-66.4679239999999965,18.3357789999999987)	CALLE JOSÉ DE DIEGO #10	\N	CIALES	52	00638	787-871-4636	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5399	ANGELES S. VALENTIN GALINDEZ	GENERALISTA	(-66.4679239999999965,18.3357789999999987)	CALLE JOSE DE DIEGO #27 	\N	CIALES	52	00638	787-871-9505	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5400	FRANCISCO A. BERIO ROUSSEL	CIRUJANO GENERALISTA	(-66.3165410000000008,18.3408799999999985)	CALLA LAS MERCEDES #25	\N	COROZAL	52	00783	787-344-9237	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5401	GABRIEL R. CASTRO COLON	MEDICINA INTERNA	(-66.3252289999999931,18.337491)	CARR. 159 KM 15.5 	\N	COROZAL	52	00783	787-859-8318	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5402	RICHARD CONNELLY MONTESINOS	MEDICINA GENERAL	(-66.2873890000000046,18.4606509999999986)	PASEO DEL SOL J-25 CALLE THEBE 	\N	DORADO	52	00646	787-278-1985 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5403	LUIS A. PEÑA FIGUEROA	GENERALISTA	(-66.2665209999999973,18.4735900000000015)	AVE. DR. PEDRO ALBIZU CAMPOS #155 BO. MAMEYAL 	\N	DORADO	52	00646	787-796-7897	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5404	HERNAN ORTIZ CAMACHO	MEDICINA DE FAMILI8A	(-66.3051829999999995,18.4119500000000009)	CARR. #2 JM 27.3 	\N	DORADO	52	00646	787-883-0572	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5405	JOHNNY ONGAY RULLAS	GENERALISTA	(-66.2665680000000066,18.4608910000000002)	PABELLON COMERCIAL RHC CALLE MENDEZ VIGO 349 SUITE 10 	\N	DORADO	52	00646	787-278-1576	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5406	CARMEN D. IRIZARRY CEBALLOS	GENERALISTA	(-65.6515389999999996,18.3262129999999992)	10 B CELIS AGUILERA	\N	FAJARDO	52	00738	787-801-6592	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5407	JOSÉ M. MÉNDEZ-JIMINIAN	MEDICINA GENERAL	(-65.6516419999999954,18.3314100000000018)	353 AVE. GENERAL VALERO 	\N	FAJARDO	52	00738-2010	787-863-4714	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5408	AURORA RODRÍGUEZ MORAN	PEDIATRA	(-65.6512429999999938,18.3297269999999983)	CALLE MUÑOZ RIVERA 265 ESQ. GENERAL VALERO 	\N	FAJARDO	52	00738-2010	787-860-4444 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5409	BENJAMÍN R. VELÁZQUEZ LÓPEZ	GENERALISTA	(-65.6655977000000064,18.3361780000000003)	URB. BARALT I#28 	\N	FAJARDO	52	00738	787-801-7710	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5410	JOSE A. ROSARIO RODRIGUEZ	GENERALISTA	(-65.6547659999999951,18.3370059999999988)	410 AVE. GENERAL VALERO TORRE SUITE 302 HIMA SAN PABLO 	\N	FAJARDO	52	00738	787-863-4058	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5411	ALVIN ROMERO CALES	MEDICINA DE FAMILIA	(-66.1132350000000031,17.9875779999999992)	CALLE PALMER #45 	\N	GUAYAMA	52	00784	787-864-6293	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5412	WILBERT R. DEL VALLE RIVERA	MEDICINA GENERAL	(-66.1119539999999972,17.9797110000000018)	URB. GIBALTRAR CALLE 1 ESQ. PR #3 	\N	GUAYAMA	52	00784	787686-6116	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5413	ALEXIS DUPREY COLON	NEURÓLOGO	(-66.1126339999999999,17.9845189999999988)	CALLE ASHFORD #22 NORTE 	\N	GUAYAMA	52	00784	787-866-8263	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5414	ENID SANTOS CINTRÓN	GENERALISTA	(-66.190607,18.3885730000000009)	URB. SANTA ELENA CALLE ALGORRA C-17 	\N	GUAYANILLA	52	00656	787-835-4574	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5415	CARLOS A. BUJOSA ALICEA	MEDICINA DE FAMILIA	(-66.1110659999999939,18.355637999999999)	CALLE CARAZO #112	\N	GUAYNABO	52	00969	787-708-2984	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5416	JOSÉ A. TORRES TORRES	MEDICINA INTERNA	(-66.1079820000000069,18.3736539999999984)	MARGINAL ACUARELA C-9 HIGHLAND GARDEN	\N	GUAYNABO	52	00969	787-272-6146	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5417	ALFONSO TORRES GARCÍA	GENERALISTA	(-66.0969359999999995,18.3694230000000012)	CALLE MCKINLEY O19 URB. PARKVILLE 	\N	GUAYNABO	52	00969	787-789-5284	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5418	JAN PIERRE ZEGARRA	CIRUGÍA DE MANO	(-66.0842520000000064,18.3642220000000016)	CALLE TURQUEZA #2050 BUCARE 	\N	GUAYNABO	52	00969	787-763-5670	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5419	JORGE D. CARRERA	RADIOLOGÍA	(-66.1185389999999984,18.3872250000000008)	PRADO ALTO CALLE 6 K-58	\N	GUAYNABO	52	00966	787-390-1601	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5420	KARIM A. BENÍTEZ MARCHAND	CIRUGÍA PLÁSTICA	(-66.103588000000002,18.4094030000000011)	COND. MARAMAR PLAZA 101 SUITE 805 AVE. SAN PATRICIO 	\N	GUAYNABO	52	00968	787-620-4070	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5421	OSANA CHACÓN RÍOS	MEDICINA DE FAMILIA	(-66.0937950000000001,18.367443999999999)	VIDA PLUS MEDICAL CLINIC ALTOS CINEMA PLAZA GUAYNABO OFICINA 201	\N	GUAYNABO	52	00969	787-731-4949	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5422	ANÍBAL TORNES ACOSTA	GENERALISTA	(-66.0937950000000001,18.367443999999999)	C2 AVE. ALEJANDRINO VILLA CREMENTINA 	\N	GUAYNABO	52	00969-4704	939-273-3955	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5423	JAVIER CHAPA DAVILA	NEUROLOGO EPILEPTOLOGO	(-66.1101429999999937,18.4229769999999995)	CENTRO INTERNATIONAL DE MERCADEO I SUITE 311 	\N	GUAYNABO	52	00968	787-224-9188	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5424	JOSEPH FERNANDEZ	PEDIATRIA	(-66.0976809999999944,18.362565)	PROFESSIONAL HOSPITAL 199 AVE. LAS CUMBRES OFICINA #2	\N	GUAYNABO	52	00969	787-773-0023	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5425	RICARDO R. SANCHEZ MACEIRA	GENERALISTA	(-66.1110759999999971,18.3553800000000003)	CALLE CARRAZO #122 BAJOS	\N	GUAYNABO	52	00969	787-789-1711	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5426	JOSE MIGUEL PALOU ABASOLO	PSIQUIATRA-ONCOLOGO	(-66.1133909999999929,18.3614819999999987)	AVE. LAS CUMBRES 140 SUITE 201	\N	GUAYNABO	52	00969	787-731-5785	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5427	JULIO C. DE JESÚS CARRIÓN	GENERALISTA	(-66.0410430000000019,18.2181339999999992)	CONSOLIDATED MALL C-1-D EXTERIOR SUITE 70 AVE. JOSÉ GAUTIER BENITEZ #202	\N	GURABO	52	00725	787-717-7279	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5428	ÁNGEL M. ROMÁN VÉLEZ	EMERGENCIÓLOGO	(-66.7753199999999936,18.4066779999999994)	CARR. 129 KM. 8.3 BARRIO CAMPO ALEGRE 	\N	HATILLO	52	00659	787-631-7592	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5429	HÉCTOR M. JUARBE MALAVÉ	MEDICINA DE FAMILIA	(-66.7733889999999946,18.4813130000000001)	CARR. 493 KM 0.5 BO. CARRIZALES 	\N	HATILLO	52	00659	787-878-1839	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5430	LORNA GONZÁLEZ VEGA	GENERALISTA	(-66.8034990000000022,18.4506979999999992)	CARR. 130 KM 5.4 SEC. LECHUGA 	\N	HATILLO	52	00659	787-820-8082 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5431	WILLIE N. MALAVE BONILLA	PEDIATRA	(-66.8253780000000006,18.4862320000000011)	MEDICAL PROFESSIONAL PLAZA SUITE 126 	\N	HATILLO	52	00659	787-650-0333	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5432	CESAR M. CUBANO MARTINEZ	PSIQUIATRA	(-66.8083129999999983,18.4879490000000004)	MARGINAL #2 EDIFICIO TROPICAL PLAZA SUITE #6 	\N	HATILLO	52	00659	787-820-6842	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5433	LUZ M. JIMÉNEZ MORALES	MEDICINAL GENERAL	(-67.1270489999999995,18.1382900000000014)	HORMIGUERO PLAZA SUITE #4, CALLE SAN ANTONIO #14, 	\N	HORMIGUEROS	52	00660	787-849-0099	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5434	ISABEL ÁLAMO VÁZQUEZ	MEDICINA INTERNA	(-65.8232280000000003,18.1502939999999988)	CALLE FONT MARTELO 108 	\N	HUMACAO	52	00791	787-852-1055	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5435	RAMÓN SEPÚLVEDA ABREU	UROLOGÍA	(-65.8232280000000003,18.1502939999999988)	CALLE FONT MARTELO 108 	\N	HUMACAO	52	00791	787-852-1055	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5436	AGUSTÍN LÓPEZ COVAS	MEDICINA INTERNA	(-65.8355719999999991,18.1546519999999987)	FONT MARTELO #334 	\N	HUMACAO	52	00792	787-852-0886	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5437	MARY KAREN PENA DÍAZ	NEURÓLOGA	(-65.8355719999999991,18.1546519999999987)	FONT MARTELO 334 	\N	HUMACAO	52	00791	787-852-0886	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5438	LESLIANE E. CASTRO SANTANA	REUMATÓLOGA	(-65.826155,18.1504520000000014)	CALLE FONT MARTELO #3 	\N	HUMACAO	52	00791	787-656-2424 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5439	MARIELLY RODRÍGUEZ COSS	GENERALISTA	(-65.8374859999999984,18.1622500000000002)	URB. LAS LEANDRAS CALLE #3 R-20 	\N	HUMACAO	52	00791	787-320-0050	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5440	PAUL H. DIXON SELLES	GENERALISTA	(-65.8355719999999991,18.1546519999999987)	AVE. FONTMARTELO 334B 	\N	HUMACAO	52	00791	787-719-4100	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5441	ELBA H. ALGARÍN AYALA	GENERALISTA	(-65.8247250000000008,18.1503769999999989)	CALLE FONTMARTELO #43 	\N	HUMACAO	52	00791	787-285-1544	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5442	PEDRO A. TORRELLAS RUIZ	NEUMÓLOGO	(-65.8330650000000048,18.1526010000000007)	CENTRO NEUMOLÓGICO DE HUMACAO 47 CALLE FONT MARTELO	\N	HUMACAO	52	00791	787-285-5900	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5443	ANDRES R. FUENTES HERENCIA	GENERALISTA	(-65.792814000000007,18.1480490000000003)	BMS HUMACAO OPERATIONS 	\N	HUMACAO	52	00792	787-656-4081	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5444	WILMER LUGO RAMIREZ	GENERALISTA	(-65.832380999999998,18.1521219999999985)	AVE. FONT MARTELLO #170 BAJOS 	\N	HUMACAO	52	00791	787-285-5558	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5445	JOSE F. RODRIGUEZ RODRIGUEZ	INTERNISTA	(-65.8355109999999968,18.1560130000000015)	HOSPITAL RYDER SUITE #401 	\N	HUMACAO	52	00792	787-850-4815	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5446	ADALBERTO LOPEZ TORRES	GENERALISTA	(-65.8231410000000068,18.1503019999999999)	CALLE FLOR GERENA #7 NORTE 	\N	HUMACAO	52	00791	787-914-9498	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5447	LUIS R. NIEVES GONZALEZ	MEDICINA GENERAL	(-67.0173369999999977,18.4726779999999984)	CARR. #2 KM 112.2 BO. MORA 	\N	ISABELA	52	00662	787-969-8866	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5448	MIGUEL A. FRONTERA PHILIPPI	MAXILOFACIAL	(-67.0235820000000047,18.454384000000001)	1356 AVE. FELIX ALDARONDO 	\N	ISABELA	52	00662	787-609-6565	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5449	AMARILIS CORCHADO PEREZ	NEUROLOGIA	(-67.0132720000000006,18.472366000000001)	CARR #2 KM 112.4 MARGINAL	\N	ISABELA	52	00662	787-380-2727	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5450	MARTA D. HAU ROSA	GENERALISTA	(-67.0223919999999964,18.499880000000001)	CALLE OTERO #61 C	\N	ISABELA	52	00662	787-872-6320	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5451	PEDRO J. CRUZ QUILES	MEDICINA GENERAL	(-67.0203479999999985,18.4983189999999986)	3106 AVE. JUAN HERNÁNDEZ ORTIZ 	\N	ISABELA	52	00662	787-872-5042 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5452	AURELIO COLLADO PACHECO	MEDICINA INTERNA	(-66.5050180000000069,18.0531520000000008)	MUÑOZ RIVERA #66 	\N	JUANA DÍAZ	52	00795	787-260-7849	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5453	JOYCE LYNN VARGAS GONZÁLEZ	MEDICINA GENERAL	(-66.4978600000000029,18.0778989999999986)	BO GUAYABAL CARR. 149 KM 63.8 EDIF. GUAYABAL PROFESSIONAL BUILDING SUITE 2001, 	\N	JUANA DÍAZ	52	00795	787-837-5577	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5454	CARLOS COMAS RIVERA	GENERALISTA	(-66.5070790000000045,18.0524419999999992)	DR. VEVE #11 	\N	JUANA DÍAZ	52	00795	787-321-4386	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5455	DANIEL RUIZ SOLER	MEDICINA INTERNA	(-66.5075080000000014,18.0534369999999988)	BO. GUAYABAL EDIF. CRUZ SUITE 4 SEGUNDO PISO	\N	JUANA DÍAZ	52	00795	787-837-5577	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5456	SUZETTE CANDELARIO	PEDIATRA	(-66.505320999999995,18.0478449999999988)	9 CALLE LA CRUZ CENTRO SAN CRISTÓBAL,	\N	JUANA DÍAZ	52	00795	787-837-2265	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5457	WILFREDO J. PÉREZ VARGAS	GENERALISTA	(-66.5075080000000014,18.0534369999999988)	CARR. #1 KM 117.9 BO. ARIS 	\N	JUANA DÍAZ	52	00795	787-260-6116	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5458	CARLOS E. DOMÍNGUEZ MIRANDA	MEDICINA FAMILIA	(-66.4971170000000029,18.0530180000000016)	CALLE LAS FLORES 168-A 	\N	JUANA DÍAZ	52	00795	787-837-2923 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5459	LUIS A. MARCHANY ALFONSO	PSIQUIATRA	(-65.9219010000000054,18.2333880000000015)	40 LÓPEZ ORMAZABAL URB. MADRID	\N	JUNCOS	52	00777	939-332-0288	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5460	AMANDA FERNÁNDEZ MUÑOZ	GENERALISTA	(-65.9226989999999944,18.2276120000000006)	CALLE MARTÍNEZ ESQUINA BETANCES 26 	\N	JUNCOS	52	00777	787-734-8042	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5461	WALTER F. IRIZARRY	GENERALISTA	(-67.0592070000000007,18.0499119999999991)	CALLE 65 DE INFANTERÍA #7 	\N	LAJAS	52	00667	787-899-1768	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5462	YADIRA RODRÍGUEZ CRUZ	MEDICINA FAMILIA	(-66.8816779999999937,18.2969690000000007)	CARR. 111 KM 2.9 AVE. LOS PATRIOTAS 	\N	LARES	52	00669	787-897-1444	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5463	BRENDA L. ORTA CARDONA	MEDICINA FAMILIA	(-67.0096790000000055,18.2449259999999995)	CALLE MATÍAS BREGMAN #81 	\N	LAS MARÍAS	52	00670	787-827-2433	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5464	LIRIBETH RAMÍREZ MARTÍNEZ	MEDICINA GENERAL	(-65.8720299999999952,18.1847110000000001)	CARR. 198 KM 22.0 DESVÍO SURILLO BO. MONTORES 1 	\N	LAS PIEDRAS	52	00771	787-716-0050	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5465	LUIS RIVERA CHICHILLA	GENERALISTA	(-65.8696249999999992,18.183561000000001)	CALLE JESÚS T. PIÑERO #69 	\N	LAS PIEDRAS	52	00771	787-733-2263	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5466	CARLOS M. MORALES PAGAN	GENERALISTA	(-66.4899900000000059,18.4302290000000006)	URB. VILLA MARIA A-7 	\N	MANATI	52	00674	787-884-5946	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5467	JOSÉ A. DELGADO	MEDICINA DE FAMILIA	(-66.4866729999999961,18.4204879999999989)	PROFESIONAL PLAZA OFICINA 512 	\N	MANATÍ	52	00674	787-621-3700	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5468	LOURDES NIEVES VÁZQUEZ	FISIATRA	(-66.4823590000000024,18.4313290000000016)	CALLE3 D15 EDIF. OHARRIZ URB. FLAMBOYÁN 	\N	MANATÍ	52	00674	787-854-0165	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5469	LUIS J. GOVEO ORTIZ	PM REHABILITATION	(-66.4635040000000004,18.4360579999999992)	CLÍNICA LAS VEGAS BARRIO  COTTE NORTE SECTOR CAMPO ALEGRE CARR.2 KM. 46.4 EDIF. LAS VEGAS #420 	\N	MANATÍ	52	00674	787-854-7060	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5470	ÁNGEL L. GELPÍ GUZMÁN	GINECÓLOGO	(-66.4823729999999955,18.4345709999999983)	TORRE MEDICAL 1 SUITE 209 DOCTOR’S CENTER HOSPITAL 	\N	MANATÍ	52	00674	787-884-5094	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5471	MARÍA DEL C. ACEVEDO SÁNCHEZ	MEDICINA GENERAL PEDIATRÍA	(-66.4831669999999946,18.4333010000000002)	URB. ATENAS CALLE JP REYES BLOQUE J-49	\N	MANATÍ	52	00674	787-884-7024	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5472	CARLOS DELGADO REYES	MEDICINA DE FAMILIA	(-66.4815100000000001,18.4341809999999988)	URB. ATENAS CALLE HERNÁNDEZ CARRIÓN E-24 	\N	MANATÍ	52	00674	787-854-5570	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5473	AIXA E. RODRIGUEZ VAZQUEZ	HEMATÓLOGA ONCÓLOGA	(-66.4795589999999947,18.4317390000000003)	1 JOSÉ CANDELAS MANATÍ MEDICAL PLAZA SUITE 110 	\N	MANATÍ	52	00674	787-884-8071	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5474	CARMEN G. SANTIAGO COLÓN	GENERALISTA	(-66.4888880000000029,18.4308709999999998)	URB. VILLA MARÍA B1 	\N	MANATÍ	52	00674	787-854-5473	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5475	RUTH RIVERA MALAVÉ	PSIQUIATRA	(-66.4805400000000049,18.4324709999999996)	URB. ATENAS B36 CALLE ELIOT VÉLEZ,	\N	MANATÍ	52	00674	787-854-5266	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5476	JAVIER I. LUGO	MEDICINA FAMILIAR	(-67.0926639999999992,18.2115299999999998)	740 AVE. HOSTOS MEDICAL CENTER PLAZA #305 	\N	MAYAGUEZ	52	00682	787-652-4864	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5477	MARIA E. JUSTINIANO GARCIA	REUMATOLOGIA	(-67.1446689999999933,18.2047559999999997)	CALLE DE DIEGO 115 ESTE 	\N	MAYAGUEZ	52	00680	787-806-3939	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5478	NATALIE HERNANDEZ KOZMA	MEDICINA GENERAL	(-67.1060350000000057,18.2323230000000009)	740 AVE. HOSTOS MEDICAL CENTER PLAZA SUITE 305 	\N	MAYAGUEZ	52	00682	787-652-4864	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5479	HUMBERTO N. OLIVENCIA RABELLL	MEDICINA INTERNA	(-67.1394399999999933,18.2021750000000004)	14 NORTE CALLE REAL OFICINA 2-B EDIFICIO LA PALMA 	\N	MAYAGUEZ	52	00680	787-834-3535	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5480	ANTONIO R. OLIVENVIA ECHEANDIA	MEDICINA GENERAL	(-67.1394399999999933,18.2021750000000004)	14 NORTE CALLE REAL OFICINA 2-B EDIFICIO LA PALMA 	\N	MAYAGUEZ	52	00680	787-834-3535	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5481	JERRY L. LEON RODRIGUEZ	FISIATRA	(-67.150028000000006,18.1827150000000017)	349 AVE. HOSTOS MEDICAL EMPORIUM II SUITE A-18 	\N	MAYAGUEZ	52	00680	787-805-2255	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5482	NORMANDO G. DURAN GUZMAN	CIRUJANO GENERALISTA	(-67.1402080000000012,18.2025480000000002)	16 OESTE CALLE DE DIEGO #102 	\N	MAYAGUEZ	52	00680	787-832-0454	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5483	ARTURO J. LOPEZ RIVERA	FISIATRA	(-66.0636810000000025,18.4209220000000009)	357 AVE. HOSTOS EDIFICIO OFFICE PARK II SUITE 205 	\N	MAYAGUEZ	52	00680	787-265-0255	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5484	LUZ N. DURAND TORRES	MEDICINA GENERAL	(-67.1274259999999998,18.1719639999999991)	CALLE JOSÉ A FIGUEROA #18, BO. RIO HONDO	\N	MAYAGÜEZ	52	00680	787-652-4231	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5485	ROHEL PASCUAL VILLARONGA	GINECÓLOGO	(-67.1524589999999932,18.1807060000000007)	MAYAGÜEZ MEDICAL CENTER OFICINA I-119 AVE. HOSTOS 410 KM 1.57 BO.  SÁBALOS 	\N	MAYAGÜEZ	52	00680	787-805-5188	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5486	MAYRA BONET QUILES	ANESTESIOLOGÍA	(-67.1192190000000011,18.186827000000001)	CARR. 349 HOSP. BELLA VISTA PISO 3	\N	MAYAGÜEZ	52	00681	787-805-1818	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5487	WALDEMAR PÉREZ ARROYO	MEDICINA GENERAL	(-67.0926950000000062,18.2112750000000005)	CARR. 106 KM 5.6 BO. QUEMADO	\N	MAYAGÜEZ	52	00680	787-831-9696	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5488	JUAN O. RIVERA RODRÍGUEZ	MEDICINA GENERAL	(-67.1686610000000002,18.1823230000000002)	VAL HARBOUR PLAZA SUITE 101 AVE. GONZÁLEZ CLEMENTE #445	\N	MAYAGÜEZ	52	00682	787-625-4355	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5489	CARLOS R. SOTO VILLARUBIA	MEDICINA INTERNA	(-67.1717620000000011,18.2332350000000005)	CARR. 64 KM 3.6 BO. MANÍ 	\N	MAYAGÜEZ	52	00682	787-834-2489	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5490	NATALIA M. SOTO	GENERAL PRACTICE	(-67.1397819999999967,18.2036440000000006)	CALLE BASORA EDIF. MÉDICO 4 OFICINA 202 	\N	MAYAGÜEZ	52	00680-00602	787-833-8352	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5491	ALBERTO J. PIÑOT GONZÁLEZ	MEDICINA INTERNA	(-67.1397819999999967,18.2036440000000006)	CALLE BASORA #55 EDIF. MÉDICO IV OFICINA 202 	\N	MAYAGÜEZ	52	00680	787-833-8352	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5492	ROBERTO L. BAYRON VÉLEZ	ANESTESIÓLOGO	(-66.0641250000000042,18.4218299999999999)	AVE. HOSTOS 351 SUITE 312 	\N	MAYAGÜEZ	52	00680	787-805-1818	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5493	NORBERTO BÁEZ-RÍOS	ORTOPEDA	(-67.1447859999999963,18.1978909999999985)	HOSTOS 770 SUITE 102 	\N	MAYAGÜEZ	52	00681	787-831-0181	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5494	LISPOLDO ORAMA ÁLVAREZ	GENERALISTA	(-67.1463459999999941,18.203285000000001)	PLAZA YAGÜEZ SUITE 205 CALLE MCKINLEY 114	\N	MAYAGÜEZ	52	00680	787-644-6078	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5495	SABDI J. PÉREZ TORRES	MEDICINA FAMILIAR	(-67.1408059999999978,18.2041210000000007)	60 N POST CENTER OFFICE 207 CALLE RAMON E. BETANCES 	\N	MAYAGÜEZ	52	00680	787-831-5831	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5496	JOSÉ R. ZAMORA ÁLVAREZ	PSIQUIATRA	(-67.1436329999999941,18.204775999999999)	CALLA ACACIAS #57 ENSANCHE MARTÍNEZ 	\N	MAYAGÜEZ	52	00680	787-832-8333	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5497	KELVIN GONZÁLEZ-SOTO	GENERALISTA	(-67.1126220000000018,18.3965519999999998)	CARR. 111 KM 5.0 BO PUEBLO 	\N	MOCA	52	00676	787-877-3355	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5498	GRISELLE ORTIZ RIVERA	GENERALISTA	(-66.4383629999999954,18.3546729999999982)	CARR. 633 KM. 4.9 BO BARAHONA 	\N	MOROVIS	52	00687	787-692-4367	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5499	CARLOS M. HEREDIA BURGOS	GENERALISTA	(-66.4078159999999968,18.325410999999999)	CALLE BALDORIOTY #30 	\N	MOROVIS	52	00687	787-613-1415	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5500	LISSETTE DE LOS ANGELES ALVAREZ CORDERO	GENERALISTA	(-66.4069369999999992,18.3255489999999988)	CALLE SAN MIGUEL #7 	\N	MOROVIS	52	00687	787-862-1347	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5501	ZAIDA PÉREZ MALDONADO	PEDIATRA	(-65.7410699999999935,18.2130790000000005)	NAGUABO MEDICAL MALL CDT 	\N	NAGUABO	52	00718	787-874-3152	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5502	JOAQUÍN J. DÁVILA QUIÑONES	MEDICINA INTERNA	(-66.0142840000000035,18.0055699999999987)	CALLE CRISTO #2 	\N	PATILLAS	52	00723	787-839-4088	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5503	HÉCTOR M. DE JESÚS CABRERO	MEDICINA GENERAL	(-66.5916059999999987,18.0425350000000009)	GLENVIEW SHOPPING CENTER LOCAL #4	\N	PONCE	52	00732	787-812-3153	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5504	HEIDI M. PÉREZ ROMÁN	MEDICINA GENERAL	(-66.6454509999999942,18.0341309999999986)	CARR. 123 KM 9.8 CENTRO COMERCIAL LAS DELICIAS LOCAL #7	\N	PONCE	52	00728	787-841-4626	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5505	JOSÉ PANELLI RAMERY	PEDIATRA	(-66.5916059999999987,18.0425350000000009)	GLENVIEW SHOPPING CENTER LOCAL #4 	\N	PONCE	52	00732	787-812-3153	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5506	ARMANDO COLLAZO LEANDRY	OB/GYN	(-66.618668999999997,17.9971910000000008)	PARRA MEDICAL PLAZA, SUITE #409	\N	PONCE	52	00732	787-505-5102	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5507	GLORIBELLE RAMOS NATAL	MEDICINAL GENERAL	(-66.5916059999999987,18.0425350000000009)	GLENVIEW SHOPPING CENTER LOCAL #4 	\N	PONCE	52	00732	787-812-3153	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5508	MORAIMA PAGÁN	GENERALISTA	(-73.9531910000000039,40.7043779999999984)	PLAZOLETA MOREL CAMPOS LOCAL #9	\N	PONCE	52	00732	787-812-3193	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5509	EDITH TORRES RODRÍGUEZ	MEDICINAL INTERNA	(-66.5929500000000019,18.0061029999999995)	URB. BELLA VISTA CALLE NEVADA C-11	\N	PONCE	52	00716	787-615-4095	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5510	JORGE CIORDIA GONZÁLEZ	GENERALISTA	(-73.9531910000000039,40.7043779999999984)	PLAZOLETA MOREL CAMPOS LOCAL #9	\N	PONCE	52	00732	787-812-3193	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5511	LUIS TORRES VÉLEZ	MEDICINA INTERNA	(-66.6493399999999951,18.0435750000000006)	CARR. 123 KM 10.2 BO. MAGUEYES	\N	PONCE	52	00728	787-284-3400	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5512	HILDA ORENGO	GENERALISTA	(-66.6132570000000044,18.0075210000000006)	CALLE MARINA 9105 ESQ. FERROCARRIL 	\N	PONCE	52	00731	787-812-5522	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5513	HÉCTOR SILVA RIVERA	HEMATÓLOGO ONCÓLOGO	(-66.5473219999999941,18.038259)	COND. SAN CRISTOBAL #407B COTTO LAUREL	\N	PONCE	52	00780	787-812-8100	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5514	EDUARDO RAMÍREZ LIZARDI	CIRUGÍA GENERAL	(-66.6373870000000039,17.994527999999999)	COND. CONCORDIA CALLE CONCORDIA 8124 SUITE 6C Y 6D 	\N	PONCE	52	00732	787-746-9798 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5515	ROTCEH COLÓN	MEDICINA GENERAL	(-66.6236789999999957,18.0034869999999998)	2132 BLVD. LUIS A. FERRE VILLA GRILLASCA 	\N	PONCE	52	00717	787-259-2696	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5516	MARÍA PADILLA RODRÍGUEZ	INTERNISTA	(-66.5485919999999993,18.0388309999999983)	TORRES SAN CRISTÓBAL 206 COTO LAUREL	\N	PONCE	52	00780	787-848-5194	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5517	JOSÉ CRUZ CESTERO	ANESTESIÓLOGO	(-66.5485919999999993,18.0388309999999983)	TORRE SAN CRISTÓBAL #402 COTTO LAUREL 	\N	PONCE	52	00780	787-842-2200	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5518	ALBERTO RIVERA SÁNCHEZ	MANEJO DE DOLOR	(-66.5858300000000014,18.0375680000000003)	1255 PASEO LAS MONJITAS SUITE 3123 AVE. TITO CASTRO 	\N	PONCE	52	4222	787-709-0574	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5519	GEORGE P. FAHED	NEUMÓLOGO	(-66.5939709999999963,18.0307269999999988)	TORRE MÉDICA SAN LUCAS SUITE 701 	\N	PONCE	52	00730	787-290-5557	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5520	JAIME DEMAIO BELLON	GENERALISTA	(-66.5914120000000054,18.0427959999999992)	GLENVIEW GARDENS SHOPPING CENTER LOCAL #4 	\N	PONCE	52	00731	787-812-3153	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5521	LISANDRA CORDERO NIEVES	GINECÓLOGA	(-66.5914120000000054,18.0427959999999992)	GLENVIEW GARDEN SHOPPING CENTER LOCAL #4 	\N	PONCE	52	00731	787-812-3153	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5522	ANNA DI MARCO SERRA	HEMATÓLOGA ONCÓLOGA	(-66.6112439999999992,18.0111699999999999)	1378 CALLE SALUD 	\N	PONCE	52	00730	787-813-3552	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5523	GERARDO J. VENDRELL	MEDICINA GENERAL	(-66.6321049999999957,17.9987950000000012)	#2525 AVE. EDUARDO RUBERTÉ SUITE 111 COLISEO SHOPPING CENTER	\N	PONCE	52	00728	787-812-5631	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5524	JOSÉ L. CRUZ MELÉNDEZ	PEDIATRA	(-73.9531910000000039,40.7043779999999984)	PLAZOLETA MOREL CAMPOS LOCAL #9 	\N	PONCE	52	00732	787-944-0707	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5525	FRANCIS J. TORRES	PEDIATRA	(-66.598795999999993,18.0133520000000011)	URB. JARDINES FAGOT CALLE 15 T1	\N	PONCE	52	00732	787-841-3057	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5526	ROSA E. SANTIAGO SERRANO	ANESTESIÓLOGA	(-66.618668999999997,17.9971910000000008)	PARRA 1005 PONCE BYPASS 	\N	PONCE	52	00731	787-840-0231	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5527	GERARDO GONZÁLEZ DE JESÚS	MEDICINA GENERAL	(-66.5969000000000051,18.0116200000000006)	PASEO DEL PRÍNCIPE APT. 315	\N	PONCE	52	00716-2852	787-944-0770	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5528	LUIS CUMMINGS CARRERO	MANEJO DEL DOLOR	(-66.5939709999999963,18.0307269999999988)	TORRE MEDICA HOSPITAL SAN LUCAS 909 AVE. TITO CASTRO SUITE 501	\N	PONCE	52	00716-4721	787-840-7130	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5529	CARLOS F. GARCÍA GUBERN	MEDICO EMERGENCIA	(-66.5946449999999999,18.031092000000001)	HOSPITAL EPISCOPAL SAN LUCAS 	\N	PONCE	52	0073	787-843-3031	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5530	FERNANDO J. RIVERA MUÑOZ	GENERALISTA	(-66.5939709999999963,18.0307269999999988)	909 AVE. TITO CASTRO TORRE MEDICA HOSPITAL SAN LUCAS SUITE 19	\N	PONCE	52	00716	787-651-1435	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5531	RICARDO ORTIZ MERCADO	MEDICINA GENERAL	(-66.6330669999999969,18.0062330000000017)	URB. SAN ANTONIO CALLE DONCELLA #1646	\N	PONCE	52	00728	787-284-7256	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5532	GABRIEL DE LA TORRE BISOT	GENERALISTA	(-66.5995010000000036,18.0260110000000005)	909 AVE. TITO CASTRO SUITE 502 	\N	PONCE	52	00716	787651-3888	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5533	DAIANA FERNANDEZ GONZALEZ	PEDIATRA	(-66.6209810000000004,18.0016490000000005)	1203 AVE. MUÑOZ RIVERA VILLA GRILLASCA 	\N	PONCE	52	00717	787-843-4588	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5534	MARYKNOLL DE LA PAZ LOPEZ	HEMATOLOGÍA ONCÓLOGA	(-66.618668999999997,17.9971910000000008)	EDIFICIO PARRA SUITE 101  2225 	\N	PONCE	52	00717	787-284-4830	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5535	JULIO CORDERO	GENERALISTA	(-66.9341229999999996,18.4702850000000005)	CALLE SOCORRO #62 	\N	QUEBRADILLAS	52		787-895-3684	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5536	ERNESTO J. GONZALEZ CEBOLLERO	MEDICINA GENERAL	(-67.2500749999999954,18.3400229999999986)	MUÑOZ RIVERA #55 OESTE 	\N	RINCON	52	00677	787-823-6831	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5537	CARMEN LOPEZ DE LA CRUZ	GENERALISTA	(-65.8437749999999937,18.3830050000000007)	CALL 4 L-1 VILLAS DE RIO GRANDE	\N	RIO GRANDE	52		787-888-7336	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5538	BALBINO AYALA ROSA	GENERALISTA	(-65.8409860000000009,18.3736519999999999)	CALLE 6 L2 VILLAS DE RÍO GRAND	\N	RÍO GRANDE	52	00745	787-394-8886	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5539	CARMEN JULIA DE LEON	GENERALISTA	(-66.0888240000000025,18.4125750000000004)	TORRE SAN FRANCISCO SUITE 405 AVE. DE DIEGO 369	\N	RIO PIEDRAS	52	00923	787-767-0828	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5540	DIANA P. MARTÍNEZ-RODRÍGUEZ	OFTALMOLOGÍA	(-66.0483049999999992,18.3973790000000008)	CALLE ARZUAGA 112 SUITE 802 	\N	RÍO PIEDRAS	52	00925	787-767-6915	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5541	ZORAIDA RIVERA MOLINA	GENERALISTA	(-66.0454380000000043,18.3967589999999994)	CALLE ARIZMENDI #210	\N	RÍO PIEDRAS	52	00925	787-754-7133	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5542	SANDRA T. BERDECÍA TEJADA	MEDICINA INTERNA	(-66.0485010000000017,18.3973709999999997)	MEDINA PROFESSIONAL CENTER CALLE ARZUAGA #112 OFICINA 902 	\N	RÍO PIEDRAS	52	00926	787-753-3024	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5543	RADAMES A. MARÍN VIEIRA	MEDICINA DE FAMILIA	(-66.9604360000000014,18.0784489999999991)	35 CALLE DR. FÉLIX TÍO 	\N	SABANA GRANDE	52	00637	787-873-7733	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5544	CARLOS H. DAVIS GONZÁLEZ	CIRUGÍA GENERAL	(-66.2964840000000066,17.9771579999999993)	CALLE SEGUNDO DIAZ #3 	\N	SALINAS	52	00751	787-824-7058	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5545	LUIS M. MERCADO GHIGLIOTTY	MEDICINA INTERNA	(-67.0411100000000033,18.0807080000000013)	CALLE INTERAMERICANA ESQUINA FUERZA EDIF. SAN JOSÉ #3 	\N	SAN GERMAN	52	00683	787-892-4357	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5546	YUSSEL C. GARCÍA-AMADOR	MEDICINA INTERNA	(-67.0411100000000033,18.0807080000000013)	AVE. LOS ATLÉTICOS #187 EDIF. RALI SUITE 104 	\N	SAN GERMAN	52	00683	787-470-9444	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5547	ROBERTO ALMODOVAR OLMEDA	GENERALISTA	(-67.0411100000000033,18.0807080000000013)	CALLE LORENZA RAMIREZ #11	\N	SAN GERMAN	52	00683	787-892-6226	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5548	MICHAEL F. SOLER BONILLA	GENERALISTA	(-66.0543859999999938,18.3745839999999987)	1700 SANTA AGUEDA URB. SAN GERARDO	\N	SAN JUAN	52	00926	787-754-1059	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5549	VANESSA VÉLEZ MARTÍNEZ	GENERALISTA	(-66.0634349999999984,18.4474370000000008)	CALLE CONVENTO #256 	\N	SAN JUAN	52	00912	787-518-6374	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5550	LUIS ROMÁN MARRERO	MEDICINA INTERNA	(-66.0671710000000019,18.4180129999999984)	CABO H ALVERIO #574	\N	SAN JUAN	52	00918	787-296-0617	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5551	JOHN V. RULLÁN	MEDICINA PREVENTIVA	(-66.0888259999999974,18.4620940000000004)	550 AVE. CONSTITUCIÓN #404	\N	SAN JUAN	52	00901	787-944-0770	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5552	RAFAEL LUZARDO MEJÍAS	GENERALISTA	(-66.1122579999999971,18.4667279999999998)	405 SAN FRANCISCO OF. 2C VIEJO 	\N	SAN JUAN	52	00901	787-725-4548 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5553	CARMEN M. MARRERO NARVÁEZ	GERIATRÍA	(-66.0454050000000024,18.3755419999999994)	URB. PURPLE TREE/ 488 CARR. 845 	\N	SAN JUAN	52	00926	787-761-1945	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5554	REYNALDO PEZZOTTI ÁLVAREZ	EMERGENCIÓLOGO	(-66.0654710000000023,18.4560020000000016)	ASHFORD PRESBITERIAN 1451 ASHFORD AVENUE SAN JUAN CITY FIRST FLOOR 	\N	SAN JUAN	52	00907	787-721-2160	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5555	YARI VALE MORENO	GINECÓLOGA	(-66.0874249999999961,18.4618870000000008)	DARLINGTON BUILDING SUITE L 1 MUÑOZ RIVERA 	\N	SAN JUAN	52	00926	787-600-7798	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5556	JOSÉ TAVAREZ VALLE	MEDICINA GENERAL	(-66.0920229999999975,18.3945439999999998)	864 AVE. SAN PATRICIO URB. LAS LOMAS 	\N	SAN JUAN	52	00921	787-792-3202	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5557	VÍCTOR A. MARCIAL VEGA	RADIONCOLOGIA	(-66.0588199999999972,18.4205310000000004)	122 ELEANOR ROOSEVELT 	\N	SAN JUAN	52	00918	787-767-2587	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5558	NIDZA T. GÓMEZ COLON	MEDICINA INTERNA	(-66.0739930000000015,18.4455570000000009)	CALLE SAN RAFAEL 1396 MEDICAL PABILLEON SUITE 11 	\N	SAN JUAN	52	00910	787-724-6590	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5559	JAIME J. CLAUDIO VILLAMIL	MEDICINA DE FAMILIA	(-66.1080460000000016,18.398537000000001)	SIRIO 496 ALTAMIRA 	\N	SAN JUAN	52	00920	787-792-9026	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5560	CARMEN L. MASSANET PASTRANA	GENERALISTA	(-66.0100460000000027,18.3928060000000002)	800 RAFAEL HERNÁNDEZ MARÍN MONTE CARLO AVE.	\N	SAN JUAN	52	00924	787-776-7630	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5561	LUIS A. FONT APONTE	ENDOCRINÓLOGO PEDIÁTRICO	(-66.0630149999999929,18.4472939999999994)	252 CALLE SAN JORGE SUITE 206 	\N	SAN JUAN	52	00912	787-999-9450 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5562	ROBERTO ROSSO QUEVEDO	GERIATRÍA	(-66.0751640000000009,18.4001699999999992)	957 AVE. AMÉRICO MIRANDA REPARTO METROPOLITANO 	\N	SAN JUAN	52	00921-2801	787-771-5151	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5563	DWIGHT M. SANTIAGO	MEDICINA DEPORTIVA	(-66.0660390000000035,18.4553009999999986)	29 CALLE WASHINGTON ASHFORD MEDICAL CENTER SUITE 306	\N	SAN JUAN	52	00907	787-722-5513	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5564	ÁNGEL M. OTERO DIAZ	ODONTÓLOGO	(-66.0744150000000019,18.4220900000000007)	TORRE PLAZA LAS AMÉRICAS SUITE 611 AVE. ROOSEVELT 	\N	SAN JUAN	52	00918	787-638-1000 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5565	ÁNGEL R. CHINEA MARTÍNEZ	NEURÓLOGO	(-66.0445749999999947,18.4522580000000005)	CALLE GENERAL DEL VALLE #2211 	\N	SAN JUAN	52	00913	787-793-7984	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5566	JOHNNY A. RODRÍGUEZ ESPINOSA	MEDICINA INTERNA	(-66.068996999999996,18.4126300000000001)	EDIF. LAS AMÉRICAS PROFESSIONAL CENTER SUITE 207 	\N	SAN JUAN	52	00918	787-765-3694	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5567	ALEXANDER L. SEGAL POMALES	OBSTETRA GINECÓLOGO	(-66.0660390000000035,18.4553009999999986)	ASHFORD MEDICAL CENTER SUITE 101 	\N	SAN JUAN	52	00907	787-413-0297	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5568	ROBERTO F. UNDA GÓMEZ	MEDICINA GENERAL	(-66.0660390000000035,18.4553009999999986)	ASHFORD MEDICAL CENTER SUITE 106 	\N	SAN JUAN	52	00907	787-644-6451	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5569	DANIEL DÍAZ GARCIA	GINECÓLOGO	(-66.05274,18.4089600000000004)	TORRE MEDICA AUXILIO MUTUO AVE. PONCE DE LEÓN 735 SUITE 714 	\N	SAN JUAN	52	00917	787-753-0185	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5570	JOSÉ O. ROMANO AGRAMONTE	GENERALISTA	(-66.0529379999999975,18.3789310000000015)	370 AVE. SAN CLAUDIO 	\N	SAN JUAN	52		939-333-3250	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5571	EUGENIO R. BARBOSA DEL VALLE	MEDICINA GENERAL	(-66.0942969999999974,18.3791639999999994)	AVE. SAN IGNACIO 1476 URB. ALTAMESA 	\N	SAN JUAN	52	00921	787-277-5477	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5572	RAMÓN LUIS LOPEZ ACOSTA	MEDICINA FAMILIA	(-66.0703699999999969,18.4455549999999988)	CALLE LLOVERAS #650 CENTRO PLAZA SUITE 207 	\N	SAN JUAN	52	00909-0000	787-725-7888	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5573	SALLY PRIESTER	MEDICINA GENERAL	(-66.0660390000000035,18.4553009999999986)	ASHFORD MEDICAL CENTER CALLE WASHINGTON #29 SUITE 204 	\N	SAN JUAN	52	00907-1509	305-746-3073	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5574	LOURDES J. FELICIANO LOPEZ	HEMA-ONCO	(-66.0707400000000007,18.4452819999999988)	1427 AVE. FERNÁNDEZ JUNCOS 	\N	SAN JUAN	52	00910	787-722-9030	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5575	ÁNGEL L. PACHECO RIVERA	GENERALISTA	(-66.066703000000004,18.4131339999999994)	AVE. DOMENECH 372	\N	SAN JUAN	52	00936	787-250-7204 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5576	CARLA A. ROSSOTTI VÁZQUEZ	MEDICINA GENERAL	(-66.1730340000000012,18.3849799999999988)	J-23 AVE. BETANCES HERMANOS DÁVILA BAYAMÓN	\N	SAN JUAN	52	00959	787-2427306	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5577	ARNALDO R. QUIÑONES APONTE	MEDICINA INTERNA	(-66.0050489999999996,18.4009549999999997)	AVE. CAMPO RICO #929 	\N	SAN JUAN	52	00924	(202) 316-9579	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5578	RICARDO A. RIEFKOHL CUADRA	FISIATRA	(-66.0661230000000046,18.3752139999999997)	1672 AVE. PARANA 	\N	SAN JUAN	52	00926	787-439-5326	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5579	ARIEL ROSADO ROSA	INTERNISTA	(-66.0391630000000021,-66.0391630000000021)	TORRE SAN FRANCISCO 369 DE DIEGO OFIC. 609	\N	SAN JUAN	52	00923	787-763-0909	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5580	VÍCTOR M. GORDO GONZÁLEZ	INTERNISTA	(-66.0586729999999989,18.4301439999999985)	108 AVE. PONCE DE LEÓN OFICINA 203	\N	SAN JUAN	52	00918	787-756-8186	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5581	ALODIA LAMEIRO AGUAYO	MEDICINA EMERGENCIA	(-66.0517179999999939,18.3630120000000012)	CUPEY GARDENS PLAZA AVE. CUPER GARDENS #200  11-W 	\N	SAN JUAN	52	00926	787-760-4425	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5582	ALEXIS M. CRUZ CHACÓN	HEMATOLOGÍA ONCÓLOGO	(-66.0537070000000028,18.4110550000000011)	AVE. PONCE DE LEÓN #715 PDA. 37 ½ 	\N	SAN JUAN	52	00918	787-758-2000 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5583	JOSÉ M. CARDONA RAMÍREZ	CARDIÓLOGO	(-66.0787830000000014,18.4406469999999985)	516 JUAN J. JIMENEZ PARQUE CENTRAL 	\N	SAN JUAN	52	00918	787-241-8469	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5584	ISMAEL GUSTAVO CUEVAS	MEDICINA GENERAL	(18.3994320000000009,-66.0647210000000058)	CALLE 32 URB. VILLA NEVARES #332 	\N	SAN JUAN	52	00927	787-751-5995	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5585	YOLANDA RODRIGUEZ RAMÍREZ	INFECTOLOGÍA	(-66.0721369999999979,18.4227759999999989)	519 CALLE ALVERIO URB. ROOSEVELT 	\N	SAN JUAN	52	00918	787-403-6232	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5586	JOSE A. MARTINO VALDES	ANESTESIOLOGIA	(-66.067346999999998,18.413253000000001)	AVE. DOMENECH # 383, HATO REY, 	\N	SAN JUAN	52	00918	787-758-4005	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5587	ANTONIO DOMINGUEZ ROMERO	GINECÓLOGO	(-66.0558149999999955,18.4005849999999995)	1007 AVE. MUÑOZ RIVERA, EDIF. DARLINGTON GL1 RIO PIRDRAS, 	\N	SAN JUAN	52	00925	787-600-7798	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5588	ROBERTO A. CALDERON	INTERNISTA	(-66.0691949999999935,18.4448129999999999)	AUGUSTO RODRIGUEZ #1503 EDIFICIO ASIA 600 	\N	SAN JUAN	52	00909	787-497-0800	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5589	RONALDO LUIS MARTINEZ GARCIA	MEDINA INTERNA	(-66.0573870000000056,18.4247599999999991)	AVE. PONCE DE LEON 735 SUITE 706 SAN JUAN, PR 0017	\N	SAN JUAN	52	0017	787-765-0670	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5590	CLAUDIA VILLATE MONTEJO	MEDICINA INTERNA	(-66.0799039999999991,18.453793000000001)	AVE. PONCE DE LEON 954 MIRAMAR PLAZA SUITE 701 SAN JUAN, PR 00907	\N	SAN JUAN	52	00907	787-722-6030	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5591	HENRY CATALA ZAYAS	MEDICINA INTERNA INFECTOLOGO	(-66.0798599999999965,18.4539200000000001)	954 AVE. PONCE DE LEON MIRAMAR PLAZA SUITE 701 	\N	SAN JUAN	52	00907	787-722-6030	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5592	FELIX D. LUGO ADAMS	CARDIOLOGIA	(-66.0882220000000018,18.4555509999999998)	1429 AVE. FERNANDEZ JUNCOS 2DO PISO 	\N	SAN JUAN	52	0090	787-925-1409	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5593	JORGE R. DE JESUS MIRANDA	ENDO-METABOLICO	(-66.0291780000000017,18.3974179999999983)	DE DIEGO 572 SAN JUAN, PR 00924	\N	SAN JUAN	52	00924	787-754-9586	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5594	KAREN L. SOTO MEDINA	PSIQUIATRA	(-66.0834519999999941,18.3894359999999999)	URB. LAS LOMAS CALLE 21 B U-34 	\N	SAN JUAN	52	00921	787-995-7611	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5595	MELVIN MELENDEZ RIOS	GASTROENTEROLOGO	(-66.0981270000000052,18.3896300000000004)	TORRE DEL METROPOLITANO 1789 SUITE 209 CARR.  21 	\N	SAN JUAN	52	00921	787-793-2462	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5596	MARIBEL ACEVEDO QUIÑONEZ	GENERALISTA	(-66.0695869999999985,18.4439610000000016)	700 CALLE DOCTOR PAVIA FERNANDEZ 	\N	SAN JUAN	52	00909	787-496-0818	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5597	TANIA RIVERA RODRIGUEZ	INTERNISTA	(-66.0706260000000043,18.4418189999999989)	1511 PONCE DE LEON KELLOGG BUILDING SUITE 3	\N	SAN JUAN	52	00909	787-339-2639	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5598	JOED M. LABOY DESCARTES	GENERALISTA	(-66.0620470000000068,18.4515780000000014)	1604 CALLE LOIZA APT. 2 	\N	SAN JUAN	52	00911	787-467-2722	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5599	FRANCISCO J. PLA MENDEZ	MEDICINA GENERAL	(-66.0662190000000038,18.3744440000000004)	1732 CALLE TINTO RIO PIEDRAS HEIGHTS 	\N	SAN JUAN	52	00926	787-963-0003	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5600	JOSE ANGEL RODRIGUEZ ARCHILLA	FISIATRA	(-66.0662190000000038,18.3744440000000004)	1733 CALLE THEIS RIO PIEDRAS HEIGHTS 	\N	SAN JUAN	52	00926	787-692-3646	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5601	ONNIS ACOSTA RIVERA	GENERALISTA	(-66.034402,18.3853749999999998)	CALLE TORTOSA 193 SUITE 28 	\N	SAN JUAN	52	00926	787-359-6637	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5602	JUAN L. ROBLES NIEVES	GENERALISTA	(-66.9942719999999952,18.3384059999999991)	CALLE PAVIA FERNANDEZ #120 	\N	SAN SEBASTIAN	52	00685	787-546-1532	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5603	AGUSTÍN CAYERE MORALES	GENERALISTA	(-66.4047240000000016,17.9655810000000002)	CALLE BETANCES #14 	\N	SANTA ISABEL	52	00757	787-845-6000	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5604	NELSON A. MATOS FERNÁNDEZ	HEMATÓLOGO ONCÓLOGO	(-66.3805030000000045,18.0171770000000002)	CARR. #153 KM 7.3 PLAZA SANTA ISABEL SUITE #8 	\N	SANTA ISABEL	52	00757	787-845-0805	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5605	CLAUDIO SAMUEL SANTOS GARCIA	GENERALISTA	(-66.4408260000000013,17.9830550000000002)	CARR. 537 FINAL MINI MALL #10 PLAYITA CANTADA 	\N	SANTA ISABEL	52	00757	787-975-1279	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5606	RAEL BERNIER SOTO	FISIATRA	(-66.3988760000000013,17.9647690000000004)	PLAZA OASIS EDIFICIO D#6 CARR. 153 AVE. MUÑOZ RIVERA 00757	\N	SANTA ISABEL	52	00757	787-845-3000	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5607	MARIELA DIAZ HADERTHAUER	FISIATRA	(-66.3855240000000038,18.0098999999999982)	CARR. 153 EDIFICIO D6 	\N	SANTA ISABEL	52	00757	787-845-2100	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5608	SAMUEL BORRERO DE JESUS	GENERALISTA	(-66.384522000000004,18.0129769999999994)	PLAZA OASIS 909 SUITE 1 CARR. 153 	\N	SANTA ISABEL	52	00757	787-845-4466	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5609	NYDIA M. LÓPEZ-DÍAZ	MEDICINA GENERAL	(-66.2037289999999956,18.315926000000001)	CARR. 828 KM 0.1 BARRIO PIÑAS 	\N	TOA ALTA	52	00953	787-279-3297	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5610	JOSÉ A. BÁEZ CÓRDOVA	FISIATRA	(-66.1654750000000007,18.4455449999999992)	P1449 AVE. BOULEVARD LEVITTOWN 	\N	TOA BAJA	52	00949	787-784-0158	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5611	RAMÓN GERENA DELGADO	GENERALISTA	(-66.1699870000000061,18.4372989999999994)	LIZZIE GRAHAN JR4 LEVITTOWN 	\N	TOA BAJA	52	00949-000	787-261-0740	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5612	JOSÉ L. GARCÍA GREGORY	GENERALISTA	(-66.1074859999999944,18.465757)	URB. COVADONGA AVE. DON PELAYO 1-C-13 	\N	TOA BAJA	52	00949	787-740-4994	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5613	JORGE CEDEÑO ESPAILLAT	GENERALISTA	(-66.1657759999999939,18.4402779999999993)	610 AVE. COMERIO LEVITTOWN 	\N	TOA BAJA	52	00949	787-784-2218	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5614	EDGAR TORRES ALAMO	GENERALISTA	(-66.0252109999999988,18.3796700000000008)	EXPRESO MANUEL RIVERA MORALES (EXPRESO TRUJILLO ALTO) ENTRADA SAINT JUST OFICINA 205 	\N	TRUJILLO ALTO	52	00976	787-760-1632	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5615	AWILDA MARTÍNEZ RODRÍGUEZ	MEDICINA INTERNA	(-65.9966150000000056,18.3408419999999985)	CARR. 181 KM 8.4 ENTRADA AL BO. LA GLORIA	\N	TRUJILLO ALTO	52	00976	787-748-3072	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5616	JANET PEREZ CHIESA	NEUROLOGIA	(-66.0184789999999992,18.3656770000000016)	EDIFICIO CENTRO 4 SUITE 202 CARR. 848 KM O.O. 	\N	TRUJILLO ALTO	52	00976	787-761-2305 	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5617	JORGE R. MENDEZ LOPEZ	GENERALISTA	(-66.024045000000001,18.3794159999999991)	CARR. 876 KM 2.0 BO. LAS CUEVAS	\N	TRUJILLO ALTO	52	 00976	787-766-2400	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5618	SHIRLEY RAMOS PÉREZ	MEDICINA DE FAMILIA	(-66.7028849999999949,18.2672489999999996)	URB. PÉREZ MATOS CALLE LAS PALMAS #66,	\N	UTUADO	52	00641	787-894-2593	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5619	ROBERTO Y. ABREU VALENTIN	GENERALISTA	(-66.7040460000000053,18.2660890000000009)	137 CALLE DR. CUETO 	\N	UTUADO	52	00641	787-933-7851	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5620	FERNANDO A. GARCÍA CRUZ	GENERALISTA	(-66.3253780000000006,18.4127189999999992)	CALLE LUIS MUÑOZ RIVERA #3 	\N	VEGA ALTA	52	00692	787-883-0124	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5621	SAUL LUIS RIVERA ORTEGA	MEDICINA GENERAL	(-66.3438270000000045,18.4018000000000015)	CARR. PR-2 KM 29.1 PARCELAS CARMEN CALLE JILGUERO 76-A 	\N	VEGA ALTA	52	00692	787-654-9198	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5622	LOIDA MIRANDA GONZALEZ	GENERALISTA	(-66.3915590000000009,18.4468910000000008)	CALL D #35 URB. MONTE CARLO 	\N	VEGA BAJA	52	00693	787-858-9094	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5623	BRENDA M. AGUAYO VICENTE	MEDICINA GENERAL	(-66.3869130000000069,18.4441780000000008)	CALLE BETANCES #29B 	\N	VEGA BAJA	52	00694	787-855-0586	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5624	JUAN R. GÓMEZ-LÓPEZ	MEDICINA INTERNA	(-65.8815239999999989,18.0442479999999996)	URB. VILLA HILDA CALLE 1 A5 	\N	YABUCOA	52	00767	787-893-5030	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5625	CARLOS CARRION RÍOS	GENERALISTA	(-65.878272999999993,18.0511879999999998)	CALLE LUIS MUÑOZ RIVERA #40 	\N	YABUCOA	52	00767	787-893-3290	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5626	AWILDA SOLIS DIAZ	GENERALISTA	(-65.8793560000000014,18.0497119999999995)	CALLE CRISTOBAL COLON #10 	\N	YABUCOA	52	00767	787-893-8204	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5627	ARTURO TORRES BORGES	MEDICINA FAMILIA	(-65.8793289999999985,18.0505199999999988)	CALLE LUIS M. RIVERA #3 	\N	YABUCOA	52	00767	787-243-8848	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5628	DRA. JANICE RAMOS COLÓN	MEDICINA GENERAL	(-66.8528600000000068,18.0344569999999997)	CALLE COMERCIO #55 	\N	YAUCO	52	00698	787-246-5248	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5629	ÁNGEL L. RAMOS CASANOVA	MEDICINA INTERNA	(-66.8496600000000001,18.0358230000000006)	CALLE MATTEI LLUBERAS #56 	\N	YAUCO	52	00698	787-267-1648	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5630	MARITZA ORTIZ ACOSTA	PSIQUIATRA	(-66.8577229999999929,18.031410000000001)	HOSPITAL METROPOLITANO DE YAUCO OFIC. 115 	\N	YAUCO	52	00698	787-856-1000	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5631	YAMIL A. ZAIDI ALLEN	GENERALISTA	(-66.8478350000000034,18.0326640000000005)	CALLE MATIENZO CINTRON #1 	\N	YAUCO	52	00698	787-967-0819	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
5632	PABLO J. DECASTRO CARLO	GENERALISTA	(-66.8514640000000071,18.0374750000000006)	#14 BAJOS CALLE DR. PASARELL	\N	YAUCO	52	00698	787-987-8002	f	2018-07-27 12:51:43.197685	\N	2018-07-27 12:51:43.197685	\N
\.


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location (id, pos_id, name, description, thumbnail, organization_id, location_category_id, long_lat, timezone, address_line_1, address_line_2, city, state_id, postal_code, phone_number, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: location_category; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_category (id, name) FROM stdin;
\.


--
-- Data for Name: location_holiday; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_holiday (id, location_id, date, is_open, start_time, end_time, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: location_hour; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_hour (id, location_id, day_of_week, is_open, start_time, end_time, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: location_log; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_log (id, location_id, user_id, status, message, created, modified) FROM stdin;
\.


--
-- Data for Name: location_promotion; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_promotion (id, location_id, name, description, image_url, expire_date, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: location_rating; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.location_rating (id, user_id, location_id, rating, review, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public."order" (id, pos_id, user_id, location_id, name, order_type, order_source, is_submitted, submitted_date, fullfillment_method, order_total, balance_due, tax_total, coupon_total, order_status, is_payment_complete, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: order_history; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.order_history (id, order_id, order_status, created, created_by) FROM stdin;
\.


--
-- Data for Name: order_product; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.order_product (id, order_id, product_id, product_pricing_weight_id, name, quantity, sold_weight, sold_weight_unit, price, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.organization (id, pos_id, pos, pos_config, name, description, contact_name, contact_email, contact_phone, address_line_1, address_line_2, city, state_id, postal_code, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.product (id, pos_id, location_id, name, description, category, subcategory, is_in_stock, is_medicated, strain_id, strain_name, pricing_type, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: product_image; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.product_image (id, product_id, size, url, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: product_log; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.product_log (id, location_log_id, product_id, status, message, product_snapshot, created, modified) FROM stdin;
\.


--
-- Data for Name: product_pricing; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.product_pricing (id, product_id, price, pricing_group_name, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: product_pricing_weight; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.product_pricing_weight (id, pos_id, product_pricing_id, name, price) FROM stdin;
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.role (id, name) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: state; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.state (id, name, abbreviation, country, state_type, assoc_press, standard_federal_region, census_region, census_region_name, census_division, census_division_name, circuit_court, created) FROM stdin;
1	Alabama	AL	USA	state	Ala.	IV	3	South	6	East South Central	11	2018-07-26 16:28:52.816032
2	Alaska	AK	USA	state	Alaska	X	4	West	9	Pacific	9	2018-07-26 16:28:52.816032
3	Arizona	AZ	USA	state	Ariz.	IX	4	West	8	Mountain	9	2018-07-26 16:28:52.816032
4	Arkansas	AR	USA	state	Ark.	VI	3	South	7	West South Central	8	2018-07-26 16:28:52.816032
5	California	CA	USA	state	Calif.	IX	4	West	9	Pacific	9	2018-07-26 16:28:52.816032
6	Colorado	CO	USA	state	Colo.	VIII	4	West	8	Mountain	10	2018-07-26 16:28:52.816032
7	Connecticut	CT	USA	state	Conn.	I	1	Northeast	1	New England	2	2018-07-26 16:28:52.816032
8	Delaware	DE	USA	state	Del.	III	3	South	5	South Atlantic	3	2018-07-26 16:28:52.816032
9	Florida	FL	USA	state	Fla.	IV	3	South	5	South Atlantic	11	2018-07-26 16:28:52.816032
10	Georgia	GA	USA	state	Ga.	IV	3	South	5	South Atlantic	11	2018-07-26 16:28:52.816032
11	Hawaii	HI	USA	state	Hawaii	IX	4	West	9	Pacific	9	2018-07-26 16:28:52.816032
12	Idaho	ID	USA	state	Idaho	X	4	West	8	Mountain	9	2018-07-26 16:28:52.816032
13	Illinois	IL	USA	state	Ill.	V	2	Midwest	3	East North Central	7	2018-07-26 16:28:52.816032
14	Indiana	IN	USA	state	Ind.	V	2	Midwest	3	East North Central	7	2018-07-26 16:28:52.816032
15	Iowa	IA	USA	state	Iowa	VII	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
16	Kansas	KS	USA	state	Kan.	VII	2	Midwest	4	West North Central	10	2018-07-26 16:28:52.816032
17	Kentucky	KY	USA	state	Ky.	IV	3	South	6	East South Central	6	2018-07-26 16:28:52.816032
18	Louisiana	LA	USA	state	La.	VI	3	South	7	West South Central	5	2018-07-26 16:28:52.816032
19	Maine	ME	USA	state	Maine	I	1	Northeast	1	New England	1	2018-07-26 16:28:52.816032
20	Maryland	MD	USA	state	Md.	III	3	South	5	South Atlantic	4	2018-07-26 16:28:52.816032
21	Massachusetts	MA	USA	state	Mass.	I	1	Northeast	1	New England	1	2018-07-26 16:28:52.816032
22	Michigan	MI	USA	state	Mich.	V	2	Midwest	3	East North Central	6	2018-07-26 16:28:52.816032
23	Minnesota	MN	USA	state	Minn.	V	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
24	Mississippi	MS	USA	state	Miss.	IV	3	South	6	East South Central	5	2018-07-26 16:28:52.816032
25	Missouri	MO	USA	state	Mo.	VII	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
26	Montana	MT	USA	state	Mont.	VIII	4	West	8	Mountain	9	2018-07-26 16:28:52.816032
27	Nebraska	NE	USA	state	Neb.	VII	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
28	Nevada	NV	USA	state	Nev.	IX	4	West	8	Mountain	9	2018-07-26 16:28:52.816032
29	New Hampshire	NH	USA	state	N.H.	I	1	Northeast	1	New England	1	2018-07-26 16:28:52.816032
30	New Jersey	NJ	USA	state	N.J.	II	1	Northeast	2	Mid-Atlantic	3	2018-07-26 16:28:52.816032
31	New Mexico	NM	USA	state	N.M.	VI	4	West	8	Mountain	10	2018-07-26 16:28:52.816032
32	New York	NY	USA	state	N.Y.	II	1	Northeast	2	Mid-Atlantic	2	2018-07-26 16:28:52.816032
33	North Carolina	NC	USA	state	N.C.	IV	3	South	5	South Atlantic	4	2018-07-26 16:28:52.816032
34	North Dakota	ND	USA	state	N.D.	VIII	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
35	Ohio	OH	USA	state	Ohio	V	2	Midwest	3	East North Central	6	2018-07-26 16:28:52.816032
36	Oklahoma	OK	USA	state	Okla.	VI	3	South	7	West South Central	10	2018-07-26 16:28:52.816032
37	Oregon	OR	USA	state	Ore.	X	4	West	9	Pacific	9	2018-07-26 16:28:52.816032
38	Pennsylvania	PA	USA	state	Pa.	III	1	Northeast	2	Mid-Atlantic	3	2018-07-26 16:28:52.816032
39	Rhode Island	RI	USA	state	R.I.	I	1	Northeast	1	New England	1	2018-07-26 16:28:52.816032
40	South Carolina	SC	USA	state	S.C.	IV	3	South	5	South Atlantic	4	2018-07-26 16:28:52.816032
41	South Dakota	SD	USA	state	S.D.	VIII	2	Midwest	4	West North Central	8	2018-07-26 16:28:52.816032
42	Tennessee	TN	USA	state	Tenn.	IV	3	South	6	East South Central	6	2018-07-26 16:28:52.816032
43	Texas	TX	USA	state	Texas	VI	3	South	7	West South Central	5	2018-07-26 16:28:52.816032
44	Utah	UT	USA	state	Utah	VIII	4	West	8	Mountain	10	2018-07-26 16:28:52.816032
45	Vermont	VT	USA	state	Vt.	I	1	Northeast	1	New England	2	2018-07-26 16:28:52.816032
46	Virginia	VA	USA	state	Va.	III	3	South	5	South Atlantic	4	2018-07-26 16:28:52.816032
47	Washington	WA	USA	state	Wash.	X	4	West	9	Pacific	9	2018-07-26 16:28:52.816032
48	West Virginia	WV	USA	state	W.Va.	III	3	South	5	South Atlantic	4	2018-07-26 16:28:52.816032
49	Wisconsin	WI	USA	state	Wis.	V	2	Midwest	3	East North Central	7	2018-07-26 16:28:52.816032
50	Wyoming	WY	USA	state	Wyo.	VIII	4	West	8	Mountain	10	2018-07-26 16:28:52.816032
51	Washington DC	DC	USA	capitol		III	3	South	5	South Atlantic	D.C.	2018-07-26 16:28:52.816032
52	Puerto Rico	PR	USA	commonwealth		II					1	2018-07-26 16:28:52.816032
53	U.S. Virgin Islands	VI	USA	territory		II					3	2018-07-26 16:28:52.816032
54	American Samoa	AS	USA	territory		IX						2018-07-26 16:28:52.816032
55	Guam	GU	USA	territory		IX					9	2018-07-26 16:28:52.816032
56	Northern Mariana Islands	MP	USA	commonwealth		IX					9	2018-07-26 16:28:52.816032
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public."user" (id, pos_id, email, password, first_name, last_name, mobile_number, patient_number, verification_code, verification_created, verified, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: user_address; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_address (id, user_id, address_line_1, address_line_2, city, state_pos, state_id, postal_code, is_primary, is_active, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: user_identification; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_identification (id, pos_id, user_id, type, number, state, is_active, file_id, expires, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: user_mj_freeway; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_mj_freeway (id, user_id, gender, birth_date, is_active, preferred_contact, tax_exempt, primary_facility_id, current_marijuana_provider, date_provider_can_switch, diagnosis, physician_name, physician_license, physician_address, type, created, modified) FROM stdin;
\.


--
-- Data for Name: user_phone; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_phone (id, pos_id, user_id, type, number, is_primary, is_active, can_text, deleted, created, created_by, modified, modified_by) FROM stdin;
\.


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_role (user_id, role_id) FROM stdin;
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: root
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: root
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: root
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: root
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: root
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: root
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.doctor_id_seq', 5632, true);


--
-- Name: location_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_category_id_seq', 1, false);


--
-- Name: location_holiday_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_holiday_id_seq', 1, false);


--
-- Name: location_hour_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_hour_id_seq', 1, false);


--
-- Name: location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_id_seq', 1, false);


--
-- Name: location_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_log_id_seq', 1, false);


--
-- Name: location_promotion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_promotion_id_seq', 1, false);


--
-- Name: location_rating_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.location_rating_id_seq', 1, false);


--
-- Name: order_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.order_history_id_seq', 1, false);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.order_id_seq', 1, false);


--
-- Name: order_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.order_product_id_seq', 1, false);


--
-- Name: organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.organization_id_seq', 1, false);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.product_id_seq', 1, false);


--
-- Name: product_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.product_image_id_seq', 1, false);


--
-- Name: product_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.product_log_id_seq', 1, false);


--
-- Name: product_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.product_pricing_id_seq', 1, false);


--
-- Name: product_pricing_weight_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.product_pricing_weight_id_seq', 1, false);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.role_id_seq', 1, false);


--
-- Name: state_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.state_id_seq', 1, false);


--
-- Name: user_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_address_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_id_seq', 1, false);


--
-- Name: user_identification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_identification_id_seq', 1, false);


--
-- Name: user_mj_freeway_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_mj_freeway_id_seq', 1, false);


--
-- Name: user_phone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_phone_id_seq', 1, false);


--
-- Name: user_mj_freeway REL_1fc9d6266720a7509b4a2d26dd; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_mj_freeway
    ADD CONSTRAINT "REL_1fc9d6266720a7509b4a2d26dd" UNIQUE (user_id);


--
-- Name: doctor doctor__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.doctor
    ADD CONSTRAINT doctor__id__pk PRIMARY KEY (id);


--
-- Name: location location__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location__id__pk PRIMARY KEY (id);


--
-- Name: location_category location_category__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_category
    ADD CONSTRAINT location_category__id__pk PRIMARY KEY (id);


--
-- Name: location_holiday location_holiday__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_holiday
    ADD CONSTRAINT location_holiday__id__pk PRIMARY KEY (id);


--
-- Name: location_hour location_hour__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_hour
    ADD CONSTRAINT location_hour__id__pk PRIMARY KEY (id);


--
-- Name: location_log location_log__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_log
    ADD CONSTRAINT location_log__id__pk PRIMARY KEY (id);


--
-- Name: location_promotion location_promotion__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_promotion
    ADD CONSTRAINT location_promotion__id__pk PRIMARY KEY (id);


--
-- Name: location_rating location_rating__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_rating
    ADD CONSTRAINT location_rating__id__pk PRIMARY KEY (id);


--
-- Name: order order__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order__id__pk PRIMARY KEY (id);


--
-- Name: order_history order_history__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history__id__pk PRIMARY KEY (id);


--
-- Name: order_product order_product__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product__id__pk PRIMARY KEY (id);


--
-- Name: organization organization__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization__id__pk PRIMARY KEY (id);


--
-- Name: product product__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product__id__pk PRIMARY KEY (id);


--
-- Name: product_image product_image__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image__id__pk PRIMARY KEY (id);


--
-- Name: product_log product_log__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_log
    ADD CONSTRAINT product_log__id__pk PRIMARY KEY (id);


--
-- Name: product_pricing product_pricing__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT product_pricing__id__pk PRIMARY KEY (id);


--
-- Name: product_pricing product_pricing__product_id__uq; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT product_pricing__product_id__uq UNIQUE (product_id);


--
-- Name: product_pricing_weight product_pricing_weight__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing_weight
    ADD CONSTRAINT product_pricing_weight__id__pk PRIMARY KEY (id);


--
-- Name: role role__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role__id__pk PRIMARY KEY (id);


--
-- Name: state state__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state__id__pk PRIMARY KEY (id);


--
-- Name: user user__email__uq; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user__email__uq UNIQUE (email);


--
-- Name: user user__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user__id__pk PRIMARY KEY (id);


--
-- Name: user_address user_address__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address__id__pk PRIMARY KEY (id);


--
-- Name: user_identification user_identification__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_identification
    ADD CONSTRAINT user_identification__id__pk PRIMARY KEY (id);


--
-- Name: user_mj_freeway user_mj_freeway__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_mj_freeway
    ADD CONSTRAINT user_mj_freeway__id__pk PRIMARY KEY (id);


--
-- Name: user_phone user_phone__id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_phone
    ADD CONSTRAINT user_phone__id__pk PRIMARY KEY (id);


--
-- Name: user_role user_role__role_id__user_id__pk; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role__role_id__user_id__pk PRIMARY KEY (user_id, role_id);


--
-- Name: doctor__long_lat__idx; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX doctor__long_lat__idx ON public.doctor USING gist (public.st_setsrid(public.st_makepoint(long_lat[0], long_lat[1]), 4326));


--
-- Name: location__long_lat__idx; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX location__long_lat__idx ON public.location USING gist (public.st_setsrid(public.st_makepoint(long_lat[0], long_lat[1]), 4326));


--
-- Name: doctor doctor__state_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.doctor
    ADD CONSTRAINT doctor__state_id__fk FOREIGN KEY (state_id) REFERENCES public.state(id);


--
-- Name: location location__location_category_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location__location_category_id__fk FOREIGN KEY (location_category_id) REFERENCES public.location_category(id);


--
-- Name: location location__organization_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location__organization_id__fk FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: location location__state_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location__state_id__fk FOREIGN KEY (state_id) REFERENCES public.state(id);


--
-- Name: location_holiday location_holiday__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_holiday
    ADD CONSTRAINT location_holiday__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_hour location_hour__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_hour
    ADD CONSTRAINT location_hour__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_log location_log__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_log
    ADD CONSTRAINT location_log__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_log location_log__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_log
    ADD CONSTRAINT location_log__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: location_promotion location_promotion__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_promotion
    ADD CONSTRAINT location_promotion__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_rating location_rating__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_rating
    ADD CONSTRAINT location_rating__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_rating location_rating__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.location_rating
    ADD CONSTRAINT location_rating__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: order order__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: order order__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: order_history order_history__order_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history__order_id__fk FOREIGN KEY (order_id) REFERENCES public."order"(id);


--
-- Name: order_product order_product__order_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product__order_id__fk FOREIGN KEY (order_id) REFERENCES public."order"(id);


--
-- Name: order_product order_product__product_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product__product_id__fk FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: order_product order_product__product_pricing_weight_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.order_product
    ADD CONSTRAINT order_product__product_pricing_weight_id__fk FOREIGN KEY (product_pricing_weight_id) REFERENCES public.product_pricing_weight(id);

--
-- Name: organization organization__state_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization__state_id__fk FOREIGN KEY (state_id) REFERENCES public.state(id);


--
-- Name: product product__location_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product__location_id__fk FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: product_image product_image__product_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image__product_id__fk FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: product_log product_log__location_log_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_log
    ADD CONSTRAINT product_log__location_log_id__fk FOREIGN KEY (location_log_id) REFERENCES public.location_log(id);


--
-- Name: product_log product_log__product_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_log
    ADD CONSTRAINT product_log__product_id__fk FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: product_pricing product_pricing__product_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing
    ADD CONSTRAINT product_pricing__product_id__fk FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: product_pricing_weight product_pricing_weight__product_pricing_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.product_pricing_weight
    ADD CONSTRAINT product_pricing_weight__product_pricing_id__fk FOREIGN KEY (product_pricing_id) REFERENCES public.product_pricing(id);


--
-- Name: user_address user_address__state_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address__state_id__fk FOREIGN KEY (state_id) REFERENCES public.state(id);


--
-- Name: user_address user_address__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: user_identification user_identification__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_identification
    ADD CONSTRAINT user_identification__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: user_mj_freeway user_mj_freeway__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_mj_freeway
    ADD CONSTRAINT user_mj_freeway__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: user_phone user_phone__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_phone
    ADD CONSTRAINT user_phone__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: user_role user_role__role_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role__role_id__fk FOREIGN KEY (role_id) REFERENCES public.role(id) ON DELETE CASCADE;


--
-- Name: user_role user_role__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role__user_id__fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

