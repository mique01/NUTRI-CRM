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

  if not exists (select 1 from pg_type where typname = 'access_request_status') then
    create type public.access_request_status as enum ('pending', 'approved', 'rejected');
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

alter table if exists public.profiles
  add column if not exists professional_title text,
  add column if not exists specialty text;

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

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text,
  status public.access_request_status not null default 'pending',
  approval_token uuid not null unique default gen_random_uuid(),
  requested_at timestamptz not null default timezone('utc', now()),
  last_requested_at timestamptz not null default timezone('utc', now()),
  notified_at timestamptz,
  approved_at timestamptz,
  approved_by_email text,
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
  alerts text not null default '',
  status public.patient_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.patients
  add column if not exists alerts text not null default '';

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

create table if not exists public.patient_consultations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  consultation_type text not null default 'Consulta',
  notes text not null default '',
  criteria jsonb not null default '[]'::jsonb,
  consulted_at timestamptz not null default timezone('utc', now()),
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

create unique index if not exists access_requests_unique_pending_email
  on public.access_requests (lower(email))
  where status = 'pending';

create index if not exists clinic_memberships_profile_id_idx on public.clinic_memberships (profile_id);
create index if not exists patients_clinic_id_idx on public.patients (clinic_id);
create index if not exists patient_notes_patient_id_idx on public.patient_notes (patient_id, created_at desc);
create index if not exists patient_consultations_patient_id_idx
  on public.patient_consultations (patient_id, consulted_at desc);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id, starts_at asc);
create index if not exists appointments_nutritionist_id_idx on public.appointments (nutritionist_profile_id, starts_at asc);
create index if not exists appointments_clinic_id_starts_at_idx on public.appointments (clinic_id, starts_at asc);
create index if not exists appointments_patient_scheduled_starts_at_idx
  on public.appointments (patient_id, starts_at asc)
  where status = 'scheduled';
create index if not exists appointments_patient_non_cancelled_starts_at_idx
  on public.appointments (patient_id, starts_at desc)
  where status <> 'cancelled';
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

drop trigger if exists set_access_requests_updated_at on public.access_requests;
create trigger set_access_requests_updated_at before update on public.access_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_clinical_histories_updated_at on public.patient_clinical_histories;
create trigger set_patient_clinical_histories_updated_at before update on public.patient_clinical_histories
for each row execute function public.set_updated_at();

drop trigger if exists set_patient_consultations_updated_at on public.patient_consultations;
create trigger set_patient_consultations_updated_at before update on public.patient_consultations
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
    raise exception 'Debes iniciar sesion.';
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

create or replace function public.list_patients_overview()
returns table (
  id uuid,
  clinic_id uuid,
  first_name text,
  last_name text,
  birth_date date,
  profession text,
  email text,
  phone text,
  alerts text,
  status public.patient_status,
  created_at timestamptz,
  updated_at timestamptz,
  next_appointment_at timestamptz,
  last_appointment_at timestamptz
)
language sql
stable
set search_path = public, app
as $$
  select
    patients.id,
    patients.clinic_id,
    patients.first_name,
    patients.last_name,
    patients.birth_date,
    patients.profession,
    patients.email,
    patients.phone,
    coalesce(patients.alerts, '') as alerts,
    patients.status,
    patients.created_at,
    patients.updated_at,
    next_appointment.starts_at as next_appointment_at,
    last_appointment.starts_at as last_appointment_at
  from public.patients
  left join lateral (
    select appointments.starts_at
    from public.appointments
    where appointments.patient_id = patients.id
      and appointments.status = 'scheduled'
      and appointments.starts_at >= timezone('utc', now())
    order by appointments.starts_at asc
    limit 1
  ) as next_appointment on true
  left join lateral (
    select appointments.starts_at
    from public.appointments
    where appointments.patient_id = patients.id
      and appointments.status <> 'cancelled'
    order by appointments.starts_at desc
    limit 1
  ) as last_appointment on true
  where patients.clinic_id = app.current_clinic_id()
  order by patients.created_at desc;
$$;

create or replace function public.list_dashboard_consultations(
  month_start timestamptz,
  month_end timestamptz
)
returns table (
  id uuid,
  patient_id uuid,
  patient_name text,
  starts_at timestamptz,
  status public.appointment_status
)
language sql
stable
set search_path = public, app
as $$
  select
    appointments.id,
    appointments.patient_id,
    trim(concat(patients.first_name, ' ', patients.last_name)) as patient_name,
    appointments.starts_at,
    appointments.status
  from public.appointments
  join public.patients on patients.id = appointments.patient_id
  where appointments.clinic_id = app.current_clinic_id()
    and appointments.starts_at >= month_start
    and appointments.starts_at < month_end
  order by appointments.starts_at asc;
$$;

create or replace function public.get_patient_detail_bundle(target_patient_id uuid)
returns jsonb
language plpgsql
stable
set search_path = public, app
as $$
declare
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select jsonb_build_object(
    'patient',
    to_jsonb(patient_row),
    'current_professional_profile',
    coalesce(
      (
        select to_jsonb(profile_row)
        from (
          select
            profiles.id,
            profiles.email,
            profiles.full_name,
            profiles.professional_title,
            profiles.specialty,
            profiles.avatar_url
          from public.profiles
          where profiles.id = auth.uid()
          limit 1
        ) as profile_row
      ),
      'null'::jsonb
    ),
    'history',
    coalesce(
      (
        select to_jsonb(history_row)
        from (
          select
            patient_clinical_histories.patient_id,
            patient_clinical_histories.consultation_reason,
            patient_clinical_histories.objective,
            patient_clinical_histories.pathologies_history_surgeries,
            patient_clinical_histories.medications_supplements,
            patient_clinical_histories.eating_habits,
            patient_clinical_histories.allergies_intolerances,
            patient_clinical_histories.physical_activity,
            patient_clinical_histories.stress,
            patient_clinical_histories.sleep,
            patient_clinical_histories.digestive_system,
            patient_clinical_histories.menstrual_cycles,
            patient_clinical_histories.other_observations,
            patient_clinical_histories.updated_at
          from public.patient_clinical_histories
          where patient_clinical_histories.patient_id = patient_row.id
          limit 1
        ) as history_row
      ),
      'null'::jsonb
    ),
    'consultations',
    coalesce(
      (
        select jsonb_agg(to_jsonb(consultation_row) order by consultation_row.consulted_at desc)
        from (
          select
            patient_consultations.id,
            patient_consultations.clinic_id,
            patient_consultations.patient_id,
            patient_consultations.author_profile_id,
            patient_consultations.consultation_type,
            patient_consultations.notes,
            patient_consultations.criteria,
            patient_consultations.consulted_at,
            patient_consultations.created_at,
            coalesce(author_profiles.professional_title, author_profiles.full_name, author_profiles.email, 'Profesional del equipo') as author_name,
            coalesce(author_profiles.professional_title, '') as author_professional_title,
            coalesce(author_profiles.specialty, '') as author_specialty
          from public.patient_consultations
          left join public.profiles as author_profiles
            on author_profiles.id = patient_consultations.author_profile_id
          where patient_consultations.patient_id = patient_row.id
          order by patient_consultations.consulted_at desc
        ) as consultation_row
      ),
      '[]'::jsonb
    ),
    'notes',
    coalesce(
      (
        select jsonb_agg(to_jsonb(note_row) order by note_row.created_at desc)
        from (
          select
            patient_notes.id,
            patient_notes.clinic_id,
            patient_notes.patient_id,
            patient_notes.author_profile_id,
            patient_notes.content,
            patient_notes.created_at
          from public.patient_notes
          where patient_notes.patient_id = patient_row.id
          order by patient_notes.created_at desc
        ) as note_row
      ),
      '[]'::jsonb
    ),
    'appointments',
    coalesce(
      (
        select jsonb_agg(to_jsonb(appointment_row) order by appointment_row.starts_at asc)
        from (
          select
            appointments.id,
            appointments.clinic_id,
            appointments.patient_id,
            appointments.nutritionist_profile_id,
            appointments.starts_at,
            appointments.ends_at,
            appointments.appointment_type,
            appointments.notes,
            appointments.status,
            appointments.external_provider,
            appointments.external_event_id,
            appointments.sync_state
          from public.appointments
          where appointments.patient_id = patient_row.id
          order by appointments.starts_at asc
        ) as appointment_row
      ),
      '[]'::jsonb
    ),
    'nutrition_plans',
    coalesce(
      (
        select jsonb_agg(to_jsonb(plan_row) order by plan_row.effective_date desc)
        from (
          select
            nutrition_plans.id,
            nutrition_plans.clinic_id,
            nutrition_plans.patient_id,
            nutrition_plans.title,
            nutrition_plans.effective_date,
            nutrition_plans.storage_path,
            nutrition_plans.file_name,
            nutrition_plans.mime_type,
            nutrition_plans.size_bytes,
            nutrition_plans.created_at
          from public.nutrition_plans
          where nutrition_plans.patient_id = patient_row.id
          order by nutrition_plans.effective_date desc
        ) as plan_row
      ),
      '[]'::jsonb
    ),
    'medical_studies',
    coalesce(
      (
        select jsonb_agg(to_jsonb(study_row) order by study_row.study_date desc)
        from (
          select
            medical_studies.id,
            medical_studies.clinic_id,
            medical_studies.patient_id,
            medical_studies.title,
            medical_studies.study_date,
            medical_studies.file_type,
            medical_studies.storage_path,
            medical_studies.file_name,
            medical_studies.mime_type,
            medical_studies.size_bytes,
            medical_studies.created_at
          from public.medical_studies
          where medical_studies.patient_id = patient_row.id
          order by medical_studies.study_date desc
        ) as study_row
      ),
      '[]'::jsonb
    )
  )
  into payload
  from (
    select
      patients.id,
      patients.clinic_id,
      patients.first_name,
      patients.last_name,
      patients.birth_date,
      patients.profession,
      patients.email,
      patients.phone,
      coalesce(patients.alerts, '') as alerts,
      patients.status,
      patients.created_at,
      patients.updated_at,
      next_appointment.starts_at as next_appointment_at,
      last_appointment.starts_at as last_appointment_at
    from public.patients
    left join lateral (
      select appointments.starts_at
      from public.appointments
      where appointments.patient_id = patients.id
        and appointments.status = 'scheduled'
        and appointments.starts_at >= timezone('utc', now())
      order by appointments.starts_at asc
      limit 1
    ) as next_appointment on true
    left join lateral (
      select appointments.starts_at
      from public.appointments
      where appointments.patient_id = patients.id
        and appointments.status <> 'cancelled'
      order by appointments.starts_at desc
      limit 1
    ) as last_appointment on true
    where patients.id = target_patient_id
      and patients.clinic_id = app.current_clinic_id()
    limit 1
  ) as patient_row;

  return payload;
end;
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
    raise exception 'Debes iniciar sesion.';
  end if;

  if trim(coalesce(clinic_name, '')) = '' then
    raise exception 'El nombre del consultorio es obligatorio.';
  end if;

  if exists (
    select 1
    from public.clinics
  ) then
    raise exception 'El consultorio principal ya fue creado. Pedi una invitacion desde Supabase.';
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
    raise exception 'Debes iniciar sesion.';
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
    raise exception 'No perteneces a ningun consultorio.';
  end if;

  if current_membership.role <> 'admin' then
    raise exception 'Solo un admin puede invitar nutricionistas.';
  end if;

  update public.clinic_invites
  set
    status = 'revoked',
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
    raise exception 'Debes iniciar sesion.';
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
    raise exception 'La invitacion no existe o ya fue usada.';
  end if;

  if target_invite.expires_at < timezone('utc', now()) then
    update public.clinic_invites
    set
      status = 'expired',
      updated_at = timezone('utc', now())
    where id = target_invite.id;

    raise exception 'La invitacion esta vencida.';
  end if;

  if lower(target_invite.invited_email) <> normalized_email then
    raise exception 'La invitacion fue emitida para otro email.';
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

create or replace function public.get_my_access_state()
returns table (
  access_status text,
  clinic_id uuid,
  clinic_name text,
  invited_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_membership public.clinic_memberships;
  target_invite public.clinic_invites;
  target_clinic_name text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  perform public.ensure_current_profile();

  select *
  into current_membership
  from public.clinic_memberships
  where profile_id = auth.uid()
  order by created_at asc
  limit 1;

  if current_membership is not null then
    return query
    select
      'member'::text,
      current_membership.clinic_id,
      clinics.name,
      app.current_user_email()
    from public.clinics
    where clinics.id = current_membership.clinic_id;
    return;
  end if;

  select invites.*
  into target_invite
  from public.clinic_invites as invites
  where lower(invites.invited_email) = app.current_user_email()
    and invites.status = 'pending'
  order by invites.created_at desc
  limit 1;

  if target_invite is not null then
    select clinics.name
    into target_clinic_name
    from public.clinics
    where clinics.id = target_invite.clinic_id;

    if target_invite.expires_at < timezone('utc', now()) then
      update public.clinic_invites
      set
        status = 'expired',
        updated_at = timezone('utc', now())
      where id = target_invite.id;
    else
      return query
      select
        'denied'::text,
        target_invite.clinic_id,
        target_clinic_name,
        lower(target_invite.invited_email);
      return;
    end if;
  end if;

  if exists (
    select 1
    from public.clinics
  ) then
    return query
    select
      'denied'::text,
      null::uuid,
      null::text,
      null::text;
    return;
  end if;

  return query
  select
    'pending_bootstrap'::text,
    null::uuid,
    null::text,
    null::text;
end;
$$;

create or replace function public.accept_my_clinic_invite()
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
    raise exception 'Debes iniciar sesion.';
  end if;

  current_profile := public.ensure_current_profile();
  normalized_email := app.current_user_email();

  select *
  into target_invite
  from public.clinic_invites
  where lower(invited_email) = normalized_email
    and status = 'pending'
  order by created_at desc
  limit 1;

  if target_invite is null then
    raise exception 'No existe una invitacion pendiente para este email.';
  end if;

  if target_invite.expires_at < timezone('utc', now()) then
    update public.clinic_invites
    set
      status = 'expired',
      updated_at = timezone('utc', now())
    where id = target_invite.id;

    raise exception 'La invitacion esta vencida.';
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

create or replace function public.try_accept_supabase_auth_invite()
returns public.clinic_memberships
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_profile uuid;
  current_membership public.clinic_memberships;
  primary_clinic_id uuid;
  was_supabase_invited boolean;
  resulting_membership public.clinic_memberships;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  current_profile := public.ensure_current_profile();

  select *
  into current_membership
  from public.clinic_memberships
  where profile_id = current_profile
  order by created_at asc
  limit 1;

  if current_membership is not null then
    return current_membership;
  end if;

  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and invited_at is not null
      and deleted_at is null
  )
  into was_supabase_invited;

  if not was_supabase_invited then
    return null;
  end if;

  select id
  into primary_clinic_id
  from public.clinics
  order by created_at asc
  limit 1;

  if primary_clinic_id is null then
    return null;
  end if;

  insert into public.clinic_memberships (clinic_id, profile_id, role)
  values (primary_clinic_id, current_profile, 'nutritionist')
  on conflict (clinic_id, profile_id) do update
  set updated_at = timezone('utc', now())
  returning * into resulting_membership;

  return resulting_membership;
end;
$$;

grant execute on function public.try_accept_supabase_auth_invite() to anon, authenticated, service_role;
grant execute on function public.list_patients_overview() to authenticated, service_role;
grant execute on function public.list_dashboard_consultations(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.get_patient_detail_bundle(uuid) to authenticated, service_role;
notify pgrst, 'reload schema';

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_invites enable row level security;
alter table public.access_requests enable row level security;
alter table public.patients enable row level security;
alter table public.patient_clinical_histories enable row level security;
alter table public.patient_consultations enable row level security;
alter table public.patient_notes enable row level security;
alter table public.appointments enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.medical_studies enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are viewable by same clinic" on public.profiles;
create policy "Profiles are viewable by same clinic"
on public.profiles for select
using (
  exists (
    select 1
    from public.clinic_memberships as current_membership
    join public.clinic_memberships as target_membership
      on target_membership.clinic_id = current_membership.clinic_id
    where current_membership.profile_id = auth.uid()
      and target_membership.profile_id = profiles.id
  )
);

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

drop policy if exists "Access requests are viewable by admins" on public.access_requests;
create policy "Access requests are viewable by admins"
on public.access_requests for select
using (clinic_id is not null and app.is_clinic_admin(clinic_id));

drop policy if exists "Access requests are updatable by admins" on public.access_requests;
create policy "Access requests are updatable by admins"
on public.access_requests for update
using (clinic_id is not null and app.is_clinic_admin(clinic_id))
with check (clinic_id is not null and app.is_clinic_admin(clinic_id));

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

drop policy if exists "Consultations are manageable by clinic members" on public.patient_consultations;
create policy "Consultations are manageable by clinic members"
on public.patient_consultations for all
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
