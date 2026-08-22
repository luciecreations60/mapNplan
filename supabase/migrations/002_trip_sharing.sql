-- À coller dans Supabase : SQL Editor -> New query -> Run
-- Partage réel des voyages entre comptes.

-- 1. Qui a accès à quel voyage.
-- L'invitation se fait par email, car la personne invitée n'a pas forcément
-- encore de compte. L'accès est résolu à la lecture via l'email du jeton de
-- session, ce qui évite d'avoir à rattacher un identifiant plus tard.
create table if not exists public.trip_members (
  trip_id text not null references public.trips(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (trip_id, email)
);

create index if not exists trip_members_email_idx on public.trip_members (lower(email));

-- 2. Fonctions d'accès.
-- SECURITY DEFINER : elles ignorent la sécurité au niveau ligne, ce qui évite
-- une récursion infinie (la règle de trips interrogerait trip_members, dont la
-- règle interrogerait trips, etc.).
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.owns_trip(target_trip_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = target_trip_id and t.owner_id = auth.uid()
  );
$$;

create or replace function public.can_access_trip(target_trip_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.owns_trip(target_trip_id)
    or exists (
      select 1 from public.trip_members m
      where m.trip_id = target_trip_id
        and lower(m.email) = public.current_user_email()
    );
$$;

create or replace function public.can_edit_trip(target_trip_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.owns_trip(target_trip_id)
    or exists (
      select 1 from public.trip_members m
      where m.trip_id = target_trip_id
        and lower(m.email) = public.current_user_email()
        and m.role = 'editor'
    );
$$;

-- 3. Le propriétaire ne change jamais lors d'une modification.
-- Sans cela, un membre qui enregistre le voyage s'en attribuerait la propriété.
create or replace function public.preserve_trip_owner()
returns trigger
language plpgsql
as $$
begin
  new.owner_id := old.owner_id;
  return new;
end;
$$;

drop trigger if exists trips_preserve_owner on public.trips;
create trigger trips_preserve_owner
  before update on public.trips
  for each row execute function public.preserve_trip_owner();

-- 4. Règles d'accès aux voyages : on remplace les anciennes.
drop policy if exists "Users can view their own trips" on public.trips;
drop policy if exists "Users can update their own trips" on public.trips;
drop policy if exists "Users can delete their own trips" on public.trips;

create policy "Members and owners can view a trip"
  on public.trips for select
  using (public.can_access_trip(id));

create policy "Editors and owners can update a trip"
  on public.trips for update
  using (public.can_edit_trip(id))
  with check (public.can_edit_trip(id));

-- Seul le propriétaire peut supprimer un voyage : un invité qui quitte le
-- voyage retire son accès, il ne détruit pas le travail de tout le monde.
create policy "Only the owner can delete a trip"
  on public.trips for delete
  using (auth.uid() = owner_id);

-- 5. Règles d'accès à la table des membres.
alter table public.trip_members enable row level security;

create policy "See members of trips you can access"
  on public.trip_members for select
  using (public.can_access_trip(trip_id) or lower(email) = public.current_user_email());

create policy "Only the owner invites"
  on public.trip_members for insert
  with check (public.owns_trip(trip_id));

create policy "Only the owner changes a role"
  on public.trip_members for update
  using (public.owns_trip(trip_id))
  with check (public.owns_trip(trip_id));

-- Le propriétaire peut retirer quelqu'un, et chacun peut se retirer soi-même.
create policy "Owner removes anyone, members remove themselves"
  on public.trip_members for delete
  using (public.owns_trip(trip_id) or lower(email) = public.current_user_email());
