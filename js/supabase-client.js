/* ===================== SUPABASE CLIENT ===================== */
/* Loaded first on every page, right after the @supabase/supabase-js UMD
   script tag (which sets the global `supabase` to the library namespace —
   our client instance below is deliberately named `sb`, not `supabase`,
   so it doesn't collide with that namespace). */
const SUPABASE_URL = 'https://rymkwiaaeopzerviomnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bWt3aWFhZW9wemVydmlvbW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTMzMTEsImV4cCI6MjEwNzg2OTMxMX0.pWs2pbUN_lm-Cz_bvqqjmWwPTTxZ57CSVjz2_cH6dhw';

/* Safe to be public: every table this key can touch is governed by Row
   Level Security policies (see supabase/schema.sql), not by hiding this key. */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
