-- FRANCHISE OS operational checklists
-- Apply after supabase/schema.sql and supabase/role_access.sql.

create table if not exists checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  role text not null check (role in ('manager','master')),
  title text not null,
  description text not null default '',
  frequency text not null check (frequency in ('shift_open','shift_close','daily','weekly')),
  active boolean not null default true,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checklist_completions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references checklist_templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  work_date date not null default current_date,
  completed_item_ids jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id,user_id,location_id,work_date)
);

alter table checklist_templates enable row level security;
alter table checklist_completions enable row level security;

create policy "checklist templates owner manage" on checklist_templates
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "checklist templates role read" on checklist_templates
for select using (
  owner_id=auth.uid()
  or (
    role=franchise_role()
    and (location_id is null or franchise_has_location(location_id))
  )
);

create policy "checklist completions owner read" on checklist_completions
for select using (owner_id=auth.uid());

create policy "checklist completions self read" on checklist_completions
for select using (user_id=auth.uid());

create policy "checklist completions manager read location" on checklist_completions
for select using (
  franchise_role()='manager' and franchise_has_location(location_id)
);

create policy "checklist completions self insert" on checklist_completions
for insert with check (
  user_id=auth.uid()
  and franchise_has_location(location_id)
);

create policy "checklist completions self update" on checklist_completions
for update using (
  user_id=auth.uid()
  and franchise_has_location(location_id)
) with check (
  user_id=auth.uid()
  and franchise_has_location(location_id)
);

create index if not exists checklist_templates_location_role_idx
  on checklist_templates(location_id,role,active);

create index if not exists checklist_completions_date_location_idx
  on checklist_completions(work_date,location_id);

create index if not exists checklist_completions_user_date_idx
  on checklist_completions(user_id,work_date);
