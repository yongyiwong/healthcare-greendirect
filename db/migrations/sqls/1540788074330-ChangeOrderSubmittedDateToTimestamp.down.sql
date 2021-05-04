BEGIN;
-- Warning: This permanently removes time from existing data
-- It will not be returned even if migration up is run again.
ALTER TABLE public.order
  ADD COLUMN tmp_date_holder DATE NULL;

UPDATE public.order SET tmp_date_holder = submitted_date::DATE;

ALTER TABLE public.order
  ALTER COLUMN submitted_date TYPE DATE USING tmp_date_holder;

ALTER TABLE public.order
  DROP COLUMN tmp_date_holder;

COMMIT;
