create extension if not exists pgcrypto;

create schema if not exists app;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'clinic_membership_role') then
    create type public.clinic_membership_role as enum ('admin', 'nutritionist');
  end if;

  if not exists (select 1 from pg_type where typname = 'patient_status') then
    create type public.patient_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
  end if;

  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');
  end if;

  if not exists (select 1 from pg_type where typname = 'study_file_type') then
    create type public.study_file_type as enum ('pdf', 'image');
  end if;

  if not exists (select 1 from pg_type where typname = 'external_provider') then
    create type public.external_provider as enum ('google_calendar');
  end if;

  if not exists (select 1 from pg_type where typname = 'sync_state') then
    create type public.sync_state as enum ('not_connected', 'local_only', 'synced', 'sync_error');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.clinic_membership_role not null default 'nutritionist',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (clinic_id, profile_id)
);

create table if not exists public.clinic_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invited_email text not null,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  invite_token uuid not null unique default gen_random_uuid(),
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  profession text,
  email text,
  phone text,
  status public.patient_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patient_clinical_histories (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  consultation_reason text not null default '',
  objective text not null default '',
  pathologies_history_surgeries text not null default '',
  medications_supplements text not null default '',
  eating_habits text not null default '',
  allergies_intolerances text not null default '',
  physical_activity text not null default '',
  stress text not null default '',
  sleep text not null default '',
  digestive_system text not null default '',
  menstrual_cycles text not null default '',
  other_observations text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_profile_id uuid not null references public.profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  appointment_type text not null,
  notes text not null default '',
  status public.appointment_status not null default 'scheduled',
  external_provider public.external_provider,
  external_event_id text,
  sync_state public.sync_state not null default 'not_connected',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  effective_date date not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.medical_studies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  study_date date not null,
  file_type public.study_file_type not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists clinic_invites_unique_pending_email
  on public.clinic_invites (clinic_id, lower(invited_email))
  where status = 'pending';

create index if not exists clinic_memberships_profile_id_idx on public.clinic_memberships (profile_id);
create index if not exists patients_clinic_id_idx on public.patients (clinic_id);
create index if not exists patient_notes_patient_id_idx on public.patient_notes (patient_id, created_at desc);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id, starts_at asc);
create index if not exists appointments_nutritionist_id_idx on public.appointments (nutritionist_profile_id, starts_at asc);
create index if not exists nutrition_plans_patient_id_idx on public.nutrition_plans (patient_id, effective_date desc);
create index if not exists medical_studies_patient_id_idx on public.medical_studies (patient_id, study_date desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_default_clinical_history()
returns trigger
language plpgsql
as $$
begin
  insert into public.patient_clinical_histories (patient_id)
  values (new.id)
  on conflict (patient_id) do nothing;

  return new;
end;
$$;

drop trigger if exists patients_create_default_clinical_history on public.patients;
create trigger patients_create_default_clinical_history
  after insert on public.patients
  for each row execute function public.create_default_clinical_history();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_clinics_updated_at on public.clinics;
create trigger set_clinics_updated_at before update on public.clinics
for each row execute function public.set_updated_at();

drop trigger if exists set_clinic_memberships_updated_at on public.clinic_memberships;
create trigger set_clinic_memberships_updated_at before update on public.clinic_memberships
for each row execute function public.set_updated_at();

drop trigger if exists set_clinic_invites_updated_at on public.clinic_invites;
create trigger set_clinic_invites_updated_at before update on public.clinic_invites
for each row execute function public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_clinical_histories_updated_at on public.patient_clinical_histories;
create trigger set_patient_clinical_histories_updated_at before update on public.patient_clinical_histories
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_notes_updated_at on public.patient_notes;
create trigger set_patient_notes_updated_at before update on public.patient_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_plans_updated_at on public.nutrition_plans;
create trigger set_nutrition_plans_updated_at before update on public.nutrition_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_medical_studies_updated_at on public.medical_studies;
create trigger set_medical_studies_updated_at before update on public.medical_studies
for each row execute function public.set_updated_at();

create or replace function app.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function app.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.ensure_current_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  current_profile_id := auth.uid();

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    current_profile_id,
    app.current_user_email(),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name'),
    auth.jwt() -> 'user_metadata' ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc', now());

  return current_profile_id;
end;
$$;

create or replace function app.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from public.clinic_memberships
  where profile_id = auth.uid()
  order by created_at asc
  limit 1;
$$;

create or replace function app.is_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships
    where clinic_id = target_clinic_id
      and profile_id = auth.uid()
  );
$$;

create or replace function app.is_clinic_admin(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships
    where clinic_id = target_clinic_id
      and profile_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.bootstrap_clinic(clinic_name text)
returns public.clinics
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile uuid;
  created_clinic public.clinics;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if trim(coalesce(clinic_name, '')) = '' then
    raise exception 'El nombre del consultorio es obligatorio.';
  end if;

  if exists (
    select 1
    from public.clinic_memberships
    where profile_id = auth.uid()
  ) then
    raise exception 'Tu usuario ya pertenece a un consultorio.';
  end if;

  current_profile := public.ensure_current_profile();

  insert into public.clinics (name, created_by)
  values (trim(clinic_name), current_profile)
  returning * into created_clinic;

  insert into public.clinic_memberships (clinic_id, profile_id, role)
  values (created_clinic.id, current_profile, 'admin');

  return created_clinic;
end;
$$;

create or replace function public.create_clinic_invite(invited_email text)
returns public.clinic_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  current_membership public.clinic_memberships;
  created_invite public.clinic_invites;
  normalized_email text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  normalized_email := lower(trim(coalesce(invited_email, '')));
  if normalized_email = '' then
    raise exception 'El email es obligatorio.';
  end if;

  select *
  into current_membership
  from public.clinic_memberships
  where profile_id = auth.uid()
  order by created_at asc
  limit 1;

  if current_membership is null then
    raise exception 'No perteneces a ningún consultorio.';
  end if;

  if current_membership.role <> 'admin' then
    raise exception 'Solo un admin puede invitar nutricionistas.';
  end if;

  update public.clinic_invites
  set status = 'revoked',
      updated_at = timezone('utc', now())
  where clinic_id = current_membership.clinic_id
    and lower(invited_email) = normalized_email
    and status = 'pending';

  insert into public.clinic_invites (
    clinic_id,
    invited_email,
    invited_by
  )
  values (
    current_membership.clinic_id,
    normalized_email,
    auth.uid()
  )
  returning * into created_invite;

  return created_invite;
end;
$$;

create or replace function public.accept_clinic_invite(invite_token uuid)
returns public.clinic_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile uuid;
  normalized_email text;
  target_invite public.clinic_invites;
  resulting_membership public.clinic_memberships;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  current_profile := public.ensure_current_profile();
  normalized_email := app.current_user_email();

  select *
  into target_invite
  from public.clinic_invites
  where invite_token = accept_clinic_invite.invite_token
    and status = 'pending'
  limit 1;

  if target_invite is null then
    raise exception 'La invitación no existe o ya fue usada.';
  end if;

  if target_invite.expires_at < timezone('utc', now()) then
    update public.clinic_invites
    set status = 'expired',
        updated_at = timezone('utc', now())
    where id = target_invite.id;

    raise exception 'La invitación está vencida.';
  end if;

  if lower(target_invite.invited_email) <> normalized_email then
    raise exception 'La invitación fue emitida para otro email.';
  end if;

  insert into public.clinic_memberships (clinic_id, profile_id, role)
  values (target_invite.clinic_id, current_profile, 'nutritionist')
  on conflict (clinic_id, profile_id) do update
  set updated_at = timezone('utc', now())
  returning * into resulting_membership;

  update public.clinic_invites
  set
    status = 'accepted',
    accepted_at = timezone('utc', now()),
    accepted_by = current_profile,
    updated_at = timezone('utc', now())
  where id = target_invite.id;

  return resulting_membership;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_invites enable row level security;
alter table public.patients enable row level security;
alter table public.patient_clinical_histories enable row level security;
alter table public.patient_notes enable row level security;
alter table public.appointments enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.medical_studies enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Clinics are viewable by members" on public.clinics;
create policy "Clinics are viewable by members"
on public.clinics for select
using (app.is_clinic_member(id));

drop policy if exists "Clinics are updatable by admins" on public.clinics;
create policy "Clinics are updatable by admins"
on public.clinics for update
using (app.is_clinic_admin(id))
with check (app.is_clinic_admin(id));

drop policy if exists "Memberships are viewable by same clinic" on public.clinic_memberships;
create policy "Memberships are viewable by same clinic"
on public.clinic_memberships for select
using (app.is_clinic_member(clinic_id));

drop policy if exists "Memberships are manageable by admins" on public.clinic_memberships;
create policy "Memberships are manageable by admins"
on public.clinic_memberships for all
using (app.is_clinic_admin(clinic_id))
with check (app.is_clinic_admin(clinic_id));

drop policy if exists "Invites are viewable by admins" on public.clinic_invites;
create policy "Invites are viewable by admins"
on public.clinic_invites for select
using (app.is_clinic_admin(clinic_id));

drop policy if exists "Invites are insertable by admins" on public.clinic_invites;
create policy "Invites are insertable by admins"
on public.clinic_invites for insert
with check (app.is_clinic_admin(clinic_id));

drop policy if exists "Invites are updatable by admins" on public.clinic_invites;
create policy "Invites are updatable by admins"
on public.clinic_invites for update
using (app.is_clinic_admin(clinic_id))
with check (app.is_clinic_admin(clinic_id));

drop policy if exists "Patients are readable by clinic members" on public.patients;
create policy "Patients are readable by clinic members"
on public.patients for select
using (app.is_clinic_member(clinic_id));

drop policy if exists "Patients are insertable by clinic members" on public.patients;
create policy "Patients are insertable by clinic members"
on public.patients for insert
with check (app.is_clinic_member(clinic_id));

drop policy if exists "Patients are updatable by clinic members" on public.patients;
create policy "Patients are updatable by clinic members"
on public.patients for update
using (app.is_clinic_member(clinic_id))
with check (app.is_clinic_member(clinic_id));

drop policy if exists "Patients are deletable by clinic members" on public.patients;
create policy "Patients are deletable by clinic members"
on public.patients for delete
using (app.is_clinic_member(clinic_id));

drop policy if exists "Clinical histories are readable by clinic members" on public.patient_clinical_histories;
create policy "Clinical histories are readable by clinic members"
on public.patient_clinical_histories for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_clinical_histories.patient_id
      and app.is_clinic_member(patients.clinic_id)
  )
);

drop policy if exists "Clinical histories are insertable by clinic members" on public.patient_clinical_histories;
create policy "Clinical histories are insertable by clinic members"
on public.patient_clinical_histories for insert
with check (
  exists (
    select 1
    from public.patients
    where patients.id = patient_clinical_histories.patient_id
      and app.is_clinic_member(patients.clinic_id)
  )
);

drop policy if exists "Clinical histories are updatable by clinic members" on public.patient_clinical_histories;
create policy "Clinical histories are updatable by clinic members"
on public.patient_clinical_histories for update
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_clinical_histories.patient_id
      and app.is_clinic_member(patients.clinic_id)
  )
)
with check (
  exists (
    select 1
    from public.patients
    where patients.id = patient_clinical_histories.patient_id
      and app.is_clinic_member(patients.clinic_id)
  )
);

drop policy if exists "Notes are manageable by clinic members" on public.patient_notes;
create policy "Notes are manageable by clinic members"
on public.patient_notes for all
using (app.is_clinic_member(clinic_id))
with check (app.is_clinic_member(clinic_id));

drop policy if exists "Appointments are manageable by clinic members" on public.appointments;
create policy "Appointments are manageable by clinic members"
on public.appointments for all
using (app.is_clinic_member(clinic_id))
with check (app.is_clinic_member(clinic_id));

drop policy if exists "Nutrition plans are manageable by clinic members" on public.nutrition_plans;
create policy "Nutrition plans are manageable by clinic members"
on public.nutrition_plans for all
using (app.is_clinic_member(clinic_id))
with check (app.is_clinic_member(clinic_id));

drop policy if exists "Medical studies are manageable by clinic members" on public.medical_studies;
create policy "Medical studies are manageable by clinic members"
on public.medical_studies for all
using (app.is_clinic_member(clinic_id))
with check (app.is_clinic_member(clinic_id));

insert into storage.buckets (id, name, public)
values
  ('nutrition-plans', 'nutrition-plans', false),
  ('medical-studies', 'medical-studies', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Nutrition plan files are readable by clinic members" on storage.objects;
create policy "Nutrition plan files are readable by clinic members"
on storage.objects for select
using (
  bucket_id = 'nutrition-plans'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Nutrition plan files are insertable by clinic members" on storage.objects;
create policy "Nutrition plan files are insertable by clinic members"
on storage.objects for insert
with check (
  bucket_id = 'nutrition-plans'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Nutrition plan files are updatable by clinic members" on storage.objects;
create policy "Nutrition plan files are updatable by clinic members"
on storage.objects for update
using (
  bucket_id = 'nutrition-plans'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'nutrition-plans'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Nutrition plan files are deletable by clinic members" on storage.objects;
create policy "Nutrition plan files are deletable by clinic members"
on storage.objects for delete
using (
  bucket_id = 'nutrition-plans'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Medical study files are readable by clinic members" on storage.objects;
create policy "Medical study files are readable by clinic members"
on storage.objects for select
using (
  bucket_id = 'medical-studies'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Medical study files are insertable by clinic members" on storage.objects;
create policy "Medical study files are insertable by clinic members"
on storage.objects for insert
with check (
  bucket_id = 'medical-studies'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Medical study files are updatable by clinic members" on storage.objects;
create policy "Medical study files are updatable by clinic members"
on storage.objects for update
using (
  bucket_id = 'medical-studies'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'medical-studies'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "Medical study files are deletable by clinic members" on storage.objects;
create policy "Medical study files are deletable by clinic members"
on storage.objects for delete
using (
  bucket_id = 'medical-studies'
  and app.is_clinic_member((split_part(name, '/', 1))::uuid)
);
