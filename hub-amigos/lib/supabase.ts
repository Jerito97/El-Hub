import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. Auth in this app is a
// custom name+PIN scheme (not Supabase Auth), so access control lives in
// our server code (see lib/auth.ts), not in Postgres RLS -- this client is
// never sent to the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in."
  );
}

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
