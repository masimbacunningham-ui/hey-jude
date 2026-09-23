-- HEY JUDE DATABASE
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,8)),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (household_id,user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'ZAR',
  description text not null,
  category text not null default 'Other',
  paid_by uuid references auth.users(id) on delete set null,
  account_name text,
  project text,
  transaction_date date not null default current_date,
  receipt_path text,
  ai_confidence numeric(4,3),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_household_date_idx on public.transactions(household_id, transaction_date desc);
create index if not exists transactions_project_idx on public.transactions(household_id, project);

-- Profile creation
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id, first_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'first_name',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Create a household for current user
create or replace function public.create_household(p_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare hid uuid;
begin
  insert into public.households(name) values(trim(p_name)) returning id into hid;
  insert into public.household_members(household_id,user_id,role) values(hid,auth.uid(),'owner');
  return hid;
end; $$;

-- Join by code
create or replace function public.join_household(p_join_code text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare hid uuid;
begin
  select id into hid from public.households where join_code=upper(trim(p_join_code));
  if hid is null then raise exception 'Invalid household code'; end if;
  insert into public.household_members(household_id,user_id,role)
  values(hid,auth.uid(),'member')
  on conflict do nothing;
  return hid;
end; $$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.transactions enable row level security;

-- Profiles: members can see names within their household
create policy "profiles household read" on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.household_members hm
    where hm.user_id=profiles.id
      and exists (select 1 from public.household_members me where me.user_id=auth.uid() and me.household_id=hm.household_id)
  )
);
create policy "own profile insert" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy "members read household" on public.households for select to authenticated
using (exists(select 1 from public.household_members hm where hm.household_id=households.id and hm.user_id=auth.uid()));

create policy "members read membership" on public.household_members for select to authenticated
using (exists(select 1 from public.household_members me where me.household_id=household_members.household_id and me.user_id=auth.uid()));

create policy "members read transactions" on public.transactions for select to authenticated
using (exists(select 1 from public.household_members hm where hm.household_id=transactions.household_id and hm.user_id=auth.uid()));

create policy "members insert transactions" on public.transactions for insert to authenticated
with check (exists(select 1 from public.household_members hm where hm.household_id=transactions.household_id and hm.user_id=auth.uid()));

create policy "members update transactions" on public.transactions for update to authenticated
using (exists(select 1 from public.household_members hm where hm.household_id=transactions.household_id and hm.user_id=auth.uid()))
with check (exists(select 1 from public.household_members hm where hm.household_id=transactions.household_id and hm.user_id=auth.uid()));

create policy "members delete transactions" on public.transactions for delete to authenticated
using (exists(select 1 from public.household_members hm where hm.household_id=transactions.household_id and hm.user_id=auth.uid()));

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.households, public.household_members to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

-- RPCs need execute permission; they perform their own auth checks.
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- Storage bucket for receipts.
insert into storage.buckets (id,name,public) values ('receipts','receipts',false)
on conflict (id) do nothing;

-- Receipt storage policies: files live under household id prefix.
create policy "receipt read members" on storage.objects for select to authenticated
using (
  bucket_id='receipts'
  and exists (
    select 1 from public.household_members hm
    where hm.household_id=(split_part(name,'/',1))::uuid
    and hm.user_id=auth.uid()
  )
);
create policy "receipt upload members" on storage.objects for insert to authenticated
with check (
  bucket_id='receipts'
  and exists (
    select 1 from public.household_members hm
    where hm.household_id=(split_part(name,'/',1))::uuid
    and hm.user_id=auth.uid()
  )
);