-- Enable Realtime for `wait_times` so clients receive postgres_changes (INSERT/UPDATE/DELETE).
-- Run once in Supabase → SQL Editor. If the table is already in the publication, this errors harmlessly
-- or use Dashboard → Database → Replication → add `wait_times`.

ALTER PUBLICATION supabase_realtime ADD TABLE public.wait_times;
