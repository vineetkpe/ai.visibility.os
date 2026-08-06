# Project Rules

## pgTAP Test Plan Counts
- Before finalizing any future pgTAP test file in `supabase/tests/`, count every assertion call (`is`, `throws_ok`, `pass`, `ok`, etc.) exactly and set `plan()` to that exact count — do not estimate.
