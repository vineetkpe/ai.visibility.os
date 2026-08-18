-- Tracked entities are a shared server-maintained knowledge table.
-- Clients may read the normalized entity catalog but must not inject arbitrary rows.
DROP POLICY IF EXISTS tracked_entities_insert_all ON public.tracked_entities;
