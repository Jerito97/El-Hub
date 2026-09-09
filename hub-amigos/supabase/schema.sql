-- LinkUp -- schema
--
-- All application access to these tables goes through the Next.js server
-- using the Supabase service-role key (see lib/supabase.ts). Auth is custom
-- (name + PIN, not Supabase Auth), so access control is enforced in the
-- server code, not via Postgres RLS. Row Level Security is left disabled
-- (the default) since the anon/publishable key is never used against
-- these tables from the client.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text generated always as (lower(trim(name))) stored,
  pin_hash text,
  alias text not null default '',
  is_admin boolean not null default false,
  is_guest boolean not null default false,
  collector_id uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint users_pin_hash_required check (is_guest or pin_hash is not null)
);
-- Real accounts still need a globally unique name; temporary guests (is_guest)
-- are scoped to one event and may share a name with anyone.
create unique index if not exists users_name_key_uidx on users (name_key) where not is_guest;

create table if not exists prefs (
  user_id uuid primary key references users (id) on delete cascade,
  notif_cumple boolean not null default true,
  notif_gasto boolean not null default true,
  notif_resumen boolean not null default false,
  theme text not null default 'claro' check (theme in ('claro', 'oscuro'))
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'cumple' check (kind in ('cumple', 'aniversario')),
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  year int not null,
  user_id uuid references users (id) on delete set null,
  added_by_id uuid not null references users (id) on delete cascade,
  is_private boolean not null default false,
  remind boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists people_user_id_idx on people (user_id);
create index if not exists people_added_by_id_idx on people (added_by_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references users (id) on delete cascade,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists event_participants (
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  shares int not null default 1 check (shares >= 1),
  primary key (event_id, user_id)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  payer_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists expenses_event_id_idx on expenses (event_id);

create table if not exists expense_shares (
  expense_id uuid not null references expenses (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  primary key (expense_id, user_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  from_id uuid not null references users (id) on delete cascade,
  to_id uuid not null references users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists payments_event_id_idx on payments (event_id);

create table if not exists notification_reads (
  user_id uuid not null references users (id) on delete cascade,
  notif_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notif_id)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);
