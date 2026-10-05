-- FRANCHISE OS internal staff communication, requests and purchasing
-- Apply after supabase/schema.sql, supabase/role_access.sql and supabase/checklists.sql.

create table if not exists work_requests (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  category text not null check (category in ('supplies','repair','equipment','household','incident','other')),
  title text not null,
  description text not null default '',
  items jsonb not null default '[]'::jsonb,
  priority text not null default 'normal' check (priority in ('low','normal','urgent')),
  status text not null default 'new' check (status in ('new','accepted','ordered','resolved','rejected')),
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_notifications (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  notification_type text not null check (notification_type in ('checklist_complete','shift_ready','request_new','request_status')),
  title text not null,
  body text not null default '',
  request_id uuid references work_requests(id) on delete cascade,
  checklist_completion_id uuid references checklist_completions(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table work_requests enable row level security;
alter table staff_notifications enable row level security;

create policy "work requests owner full access" on work_requests
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "work requests master insert own" on work_requests
for insert with check (
  from_user_id=auth.uid()
  and franchise_role()='master'
  and franchise_has_location(location_id)
);

create policy "work requests master read own" on work_requests
for select using (
  from_user_id=auth.uid()
);

create policy "work requests manager read location" on work_requests
for select using (
  franchise_role()='manager'
  and franchise_has_location(location_id)
);

create policy "work requests manager update location" on work_requests
for update using (
  franchise_role()='manager'
  and franchise_has_location(location_id)
) with check (
  franchise_role()='manager'
  and franchise_has_location(location_id)
);

create policy "staff notifications owner full access" on staff_notifications
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "staff notifications self read" on staff_notifications
for select using (user_id=auth.uid());

create policy "staff notifications self mark read" on staff_notifications
for update using (user_id=auth.uid()) with check (user_id=auth.uid());

create index if not exists work_requests_location_status_idx on work_requests(location_id,status,created_at desc);
create index if not exists work_requests_from_user_idx on work_requests(from_user_id,created_at desc);
create index if not exists staff_notifications_user_read_idx on staff_notifications(user_id,read_at,created_at desc);
