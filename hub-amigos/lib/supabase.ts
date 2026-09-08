import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. Auth in this app is a
// custom name+PIN scheme (not Supabase Auth), so access control lives in
// our server code (see lib/auth.ts), not in Postgres RLS -- this client is
// never sent to the browser.
//
// Deliberately does NOT throw when the env vars are missing: Next.js
// evaluates this module while collecting page data at build time, before
// any env vars are necessarily set (e.g. a first Vercel deploy before the
// Supabase project exists yet). Falling back to placeholders lets the build
// succeed; actual DB calls will fail at request time with a clear Supabase
// error until the real env vars are set and the app is redeployed.
const url = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set -- using placeholders. " +
      "Set them in .env.local (or your Vercel project's Environment Variables) and redeploy."
  );
}

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
