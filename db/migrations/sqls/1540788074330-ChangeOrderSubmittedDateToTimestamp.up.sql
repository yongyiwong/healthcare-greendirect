BEGIN;
ALTER TABLE public.order
  ADD COLUMN tmp_time_holder TIMESTAMP without time zone NULL;

UPDATE public.order SET tmp_time_holder = submitted_date::TIMESTAMP;

ALTER TABLE public.order
  ALTER COLUMN submitted_date TYPE TIMESTAMP without time zone USING tmp_time_holder;

ALTER TABLE public.order
  DROP COLUMN tmp_time_holder;

COMMIT;
