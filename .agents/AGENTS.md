# Project Rules

## pgTAP Test Plan Counts

- Before finalizing any future pgTAP test file in `supabase/tests/`, count every assertion call (`is`, `throws_ok`, `pass`, `ok`, etc.) exactly and set `plan()` to that exact count — do not estimate.

## Data API Grants in Migrations

- Every NEW migration in this project that creates a table or function must include explicit `GRANT` statements granting Data API access to `authenticated` matching the table's RLS policies (e.g. `GRANT SELECT, INSERT, UPDATE ON public.my_table TO authenticated;`). Do not grant anything to `anon` unless logged-out access is explicitly requested.
