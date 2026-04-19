-- 소비요정 shopping list schema
-- Runs inside a dedicated `sobiyojung` schema so it can coexist safely
-- with other apps sharing the same Supabase project.
--
-- AFTER running this: go to Integrations → Data API → Settings and add
-- `sobiyojung` to both "Exposed schemas" and "Extra search path", then Save.
-- (The dropdown only lists schemas that already exist, so the order matters.)

set check_function_bodies = off;

------------------------------------------------------------
-- SCHEMA
------------------------------------------------------------

create schema if not exists sobiyojung;

-- Let Supabase roles use the schema
grant usage on schema sobiyojung to anon, authenticated, service_role;
alter default privileges in schema sobiyojung
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema sobiyojung
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema sobiyojung
  grant all on functions to anon, authenticated, service_role;

------------------------------------------------------------
-- TABLES
------------------------------------------------------------

create table if not exists sobiyojung.households (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists sobiyojung.household_members (
  household_id uuid not null references sobiyojung.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists household_members_user_id_idx
  on sobiyojung.household_members(user_id);

create table if not exists sobiyojung.stores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references sobiyojung.households(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  color text,
  sort_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, slug)
);

create index if not exists stores_household_id_idx
  on sobiyojung.stores(household_id);

create table if not exists sobiyojung.items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references sobiyojung.stores(id) on delete cascade,
  text text not null,
  checked boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);

create index if not exists items_store_id_idx
  on sobiyojung.items(store_id);

grant all on sobiyojung.households to anon, authenticated, service_role;
grant all on sobiyojung.household_members to anon, authenticated, service_role;
grant all on sobiyojung.stores to anon, authenticated, service_role;
grant all on sobiyojung.items to anon, authenticated, service_role;

------------------------------------------------------------
-- HELPER: is current user a member of this household
------------------------------------------------------------

create or replace function sobiyojung.is_household_member(h_id uuid)
returns boolean
language sql
security definer
set search_path = sobiyojung, public
stable
as $$
  select exists (
    select 1 from sobiyojung.household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

grant execute on function sobiyojung.is_household_member(uuid)
  to anon, authenticated, service_role;

------------------------------------------------------------
-- ROW LEVEL SECURITY
------------------------------------------------------------

alter table sobiyojung.households enable row level security;
alter table sobiyojung.household_members enable row level security;
alter table sobiyojung.stores enable row level security;
alter table sobiyojung.items enable row level security;

-- households
drop policy if exists "household: member can select" on sobiyojung.households;
create policy "household: member can select"
  on sobiyojung.households for select
  using (sobiyojung.is_household_member(id));

drop policy if exists "household: any authed can insert" on sobiyojung.households;
create policy "household: any authed can insert"
  on sobiyojung.households for insert
  with check (auth.uid() is not null);

drop policy if exists "household: member can update" on sobiyojung.households;
create policy "household: member can update"
  on sobiyojung.households for update
  using (sobiyojung.is_household_member(id));

-- household_members
drop policy if exists "member: see own and peers" on sobiyojung.household_members;
create policy "member: see own and peers"
  on sobiyojung.household_members for select
  using (
    user_id = auth.uid()
    or sobiyojung.is_household_member(household_id)
  );

drop policy if exists "member: user adds self" on sobiyojung.household_members;
create policy "member: user adds self"
  on sobiyojung.household_members for insert
  with check (user_id = auth.uid());

drop policy if exists "member: user removes self" on sobiyojung.household_members;
create policy "member: user removes self"
  on sobiyojung.household_members for delete
  using (user_id = auth.uid());

-- stores
drop policy if exists "store: household member all" on sobiyojung.stores;
create policy "store: household member all"
  on sobiyojung.stores for all
  using (sobiyojung.is_household_member(household_id))
  with check (sobiyojung.is_household_member(household_id));

-- items
drop policy if exists "item: household member all" on sobiyojung.items;
create policy "item: household member all"
  on sobiyojung.items for all
  using (
    exists (
      select 1 from sobiyojung.stores s
      where s.id = items.store_id
        and sobiyojung.is_household_member(s.household_id)
    )
  )
  with check (
    exists (
      select 1 from sobiyojung.stores s
      where s.id = items.store_id
        and sobiyojung.is_household_member(s.household_id)
    )
  );

------------------------------------------------------------
-- REALTIME
------------------------------------------------------------

alter publication supabase_realtime add table sobiyojung.items;
alter publication supabase_realtime add table sobiyojung.stores;
