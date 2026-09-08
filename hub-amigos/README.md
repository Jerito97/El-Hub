# El Hub

A real (not-a-prototype) implementation of the "Hub de amigos" design from
`../project/Hub Amigos.dc.html` — birthdays/anniversaries + Splitwise-style
shared expenses for a friend group, with real name+PIN login.

Stack: **Next.js (App Router) on Vercel** + **Supabase** (Postgres) for
persistence. Auth is a custom name+PIN scheme (not Supabase Auth), enforced
server-side; there is no client-side use of Supabase at all.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`.
3. Grab **Project Settings → API**: the Project URL and the `service_role` key.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — your project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — the service-role key. **Server-only, never
  exposed to the browser.** All DB access goes through Next.js server code
  (Server Components / Server Actions) using this key — Postgres Row Level
  Security is intentionally left off since access control is enforced by
  the app's own session checks, not by the DB.
- `SESSION_SECRET` — random secret for signing session cookies. Generate
  with `openssl rand -base64 32`.

## 3. Install, seed, run

```bash
npm install
npm run seed    # optional: loads the same demo users/birthdays/events
                 # the original prototype shipped with
npm run dev
```

Demo logins after seeding: `Nacho`/1234, `Sofi`/1234, `Mica`/2580,
`Facu`/4321, `Caro`/9999. Or just register a brand-new name — that's the
real signup flow (new name → creates an account with that PIN).

## 4. Deploy to Vercel

1. Push this repo (or just the `hub-amigos/` folder as its own repo) and
   import it in Vercel.
2. Set the **Root Directory** to `hub-amigos` if deploying from the
   monorepo.
3. Add the same three environment variables from step 2 in the Vercel
   project settings.
4. Deploy. No build config needed beyond the defaults (`next build`).

## How auth works

- Login screen takes a name + 4–6 digit PIN.
  - New name → account is created with that PIN (after a short "your
    birthday + optional alias" onboarding step).
  - Existing name → PIN is checked (bcrypt) against the stored hash; wrong
    PIN shows an inline error.
  - If the name matches someone already pre-loaded as a birthday-only
    entry (no account yet), you're offered to link your new account to
    that existing entry instead of creating a duplicate person.
- A signed, httpOnly session cookie (`jose`/JWT, `SESSION_SECRET`) is set
  on login and read on every request via `lib/auth.ts`. Sessions last 180
  days and are independent per device — the same person can be logged in
  on several phones at once, each with its own cookie.

## Project layout

- `lib/domain.ts` — pure business logic (balances, debt-simplification/
  settlements, notifications, list views), ported from the prototype's
  in-canvas JS.
- `lib/data.ts` — Supabase reads, memoized per-request.
- `lib/actions/*.ts` — Server Actions (writes): auth, people (birthdays/
  anniversaries), events/expenses/payments, profile, prefs, notifications.
- `app/(app)/*` — the authenticated app (home, fechas, gastos, personas,
  config), gated by a session check in `app/(app)/layout.tsx`.
- `app/login` — the login/link/setup flow.
- `components/`, `components/ui/` — shared UI (header, drawer, notification
  panel, modals, form primitives) styled per the Modernist design system
  tokens in `app/globals.css`.
