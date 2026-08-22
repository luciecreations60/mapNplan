-- À coller dans Supabase : SQL Editor -> New query -> Run
-- Suggestions et votes des participants.
--
-- Les suggestions ne modifient jamais le voyage : elles s'ajoutent les unes
-- aux autres dans leur propre table. Deux participants ne peuvent donc pas
-- entrer en conflit, et seul le propriétaire (ou un co-organisateur) décide de
-- ce qui est appliqué.

-- 1. Le rôle de co-organisateur s'ajoute aux rôles existants.
alter table public.trip_members drop constraint if exists trip_members_role_check;
alter table public.trip_members add constraint trip_members_role_check
  check (role in ('coorganizer', 'contributor', 'viewer'));

-- Les anciens "editor" deviennent co-organisateurs, les autres contributeurs.
update public.trip_members set role = 'coorganizer' where role not in ('coorganizer', 'contributor', 'viewer');

-- 2. Seuls le propriétaire et les co-organisateurs écrivent le voyage.
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
        and m.role = 'coorganizer'
    );
$$;

-- 3. Les suggestions.
create table if not exists public.trip_suggestions (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references public.trips(id) on delete cascade,
  author_email text not null,
  author_name text not null default '',
  kind text not null check (kind in ('place', 'change', 'comment')),
  title text not null default '',
  body text not null default '',
  -- Détail libre selon le type : coordonnées d'un lieu, champ visé et valeur
  -- proposée pour un changement. Laissé en JSON pour ne pas figer le format
  -- avant d'avoir vu ce que les gens suggèrent réellement.
  payload jsonb not null default '{}'::jsonb,
  target_entity_id text default null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz default null,
  created_at timestamptz not null default now()
);

create index if not exists trip_suggestions_trip_idx on public.trip_suggestions (trip_id, created_at desc);

-- 4. Les votes : un seul par personne et par suggestion.
create table if not exists public.trip_suggestion_votes (
  suggestion_id uuid not null references public.trip_suggestions(id) on delete cascade,
  voter_email text not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (suggestion_id, voter_email)
);

-- 5. Accès aux suggestions.
alter table public.trip_suggestions enable row level security;

create policy "Anyone on the trip reads suggestions"
  on public.trip_suggestions for select
  using (public.can_access_trip(trip_id));

-- Tout participant peut suggérer, et l'auteur enregistré est toujours celui
-- qui écrit : impossible de suggérer au nom de quelqu'un d'autre.
create policy "Anyone on the trip suggests"
  on public.trip_suggestions for insert
  with check (public.can_access_trip(trip_id) and lower(author_email) = public.current_user_email());

-- L'auteur peut corriger sa suggestion tant qu'elle est en attente ; les
-- organisateurs peuvent l'accepter ou la refuser.
create policy "Author edits a pending suggestion, organizers resolve it"
  on public.trip_suggestions for update
  using (
    (lower(author_email) = public.current_user_email() and status = 'pending')
    or public.can_edit_trip(trip_id)
  )
  with check (public.can_access_trip(trip_id));

create policy "Author or organizers delete a suggestion"
  on public.trip_suggestions for delete
  using (lower(author_email) = public.current_user_email() or public.can_edit_trip(trip_id));

-- 6. Accès aux votes.
alter table public.trip_suggestion_votes enable row level security;

create or replace function public.can_access_suggestion(target_suggestion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_suggestions s
    where s.id = target_suggestion_id and public.can_access_trip(s.trip_id)
  );
$$;

create policy "Anyone on the trip reads votes"
  on public.trip_suggestion_votes for select
  using (public.can_access_suggestion(suggestion_id));

create policy "Vote only as yourself"
  on public.trip_suggestion_votes for insert
  with check (public.can_access_suggestion(suggestion_id) and lower(voter_email) = public.current_user_email());

create policy "Change only your own vote"
  on public.trip_suggestion_votes for update
  using (lower(voter_email) = public.current_user_email())
  with check (lower(voter_email) = public.current_user_email());

create policy "Withdraw only your own vote"
  on public.trip_suggestion_votes for delete
  using (lower(voter_email) = public.current_user_email());
