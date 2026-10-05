-- FRANCHISE OS role model
-- Apply after supabase/schema.sql.
-- Roles are stored outside user-editable profiles so a manager/master cannot promote themselves.

create table if not exists memberships (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','master')),
  employee_id uuid references employees(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(owner_id,user_id)
);

create table if not exists user_location_access (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  can_manage_team boolean not null default false,
  can_edit_actuals boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id,location_id)
);

alter table employees add column if not exists user_id uuid references auth.users(id) on delete set null;

create table if not exists work_shifts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  shift_date date not null,
  starts_at time not null,
  ends_at time not null,
  status text not null default 'planned' check (status in ('planned','completed','missed','dayoff')),
  created_at timestamptz not null default now()
);

-- Operational data safe for a manager. Do not put owner net profit/capital here.
create table if not exists location_operational_metrics (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  month date not null,
  revenue numeric not null default 0,
  procedures integer not null default 0,
  payroll numeric not null default 0,
  materials numeric not null default 0,
  acquiring numeric not null default 0,
  rent numeric not null default 0,
  marketing numeric not null default 0,
  other_operating numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  unique(location_id,month)
);

-- Owner-only layer. Never expose this table to manager/master roles.
create table if not exists owner_financials (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  month date not null,
  net_profit numeric not null default 0,
  tax numeric not null default 0,
  free_cash_flow numeric not null default 0,
  capex numeric not null default 0,
  reserved_funds numeric not null default 0,
  owner_withdrawals numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  unique(location_id,month)
);

-- Personal master statistics only.
create table if not exists master_metrics (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  month date not null,
  revenue numeric not null default 0,
  procedures integer not null default 0,
  accrued_salary numeric not null default 0,
  bonus numeric not null default 0,
  shifts integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  unique(employee_id,month)
);

create or replace function franchise_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from memberships m
  where m.user_id=auth.uid() and m.active=true
  order by case m.role when 'owner' then 1 when 'manager' then 2 else 3 end
  limit 1;
$$;

create or replace function franchise_has_location(p_location uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from user_location_access a
    where a.user_id=auth.uid() and a.location_id=p_location
  );
$$;

alter table memberships enable row level security;
alter table user_location_access enable row level security;
alter table work_shifts enable row level security;
alter table location_operational_metrics enable row level security;
alter table owner_financials enable row level security;
alter table master_metrics enable row level security;

drop policy if exists "membership read self" on memberships;
create policy "membership read self" on memberships
for select using (user_id=auth.uid() or owner_id=auth.uid());

drop policy if exists "owner manages memberships" on memberships;
create policy "owner manages memberships" on memberships
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

drop policy if exists "location access read self" on user_location_access;
create policy "location access read self" on user_location_access
for select using (user_id=auth.uid() or owner_id=auth.uid());

drop policy if exists "owner manages location access" on user_location_access;
create policy "owner manages location access" on user_location_access
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

drop policy if exists "role locations read" on locations;
create policy "role locations read" on locations
for select using (owner_id=auth.uid() or franchise_has_location(id));

drop policy if exists "role employees read" on employees;
create policy "role employees read" on employees
for select using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
  or (franchise_role()='master' and user_id=auth.uid())
);

drop policy if exists "manager employees update" on employees;
create policy "manager employees update" on employees
for update using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
) with check (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
);

create policy "work shifts read" on work_shifts
for select using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
  or exists(select 1 from employees e where e.id=employee_id and e.user_id=auth.uid())
);

create policy "work shifts manage" on work_shifts
for all using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
) with check (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
);

create policy "operational metrics read" on location_operational_metrics
for select using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
);

create policy "operational metrics write" on location_operational_metrics
for all using (
  owner_id=auth.uid()
  or (
    franchise_role()='manager'
    and franchise_has_location(location_id)
    and exists(
      select 1 from user_location_access a
      where a.user_id=auth.uid() and a.location_id=location_id and a.can_edit_actuals=true
    )
  )
) with check (
  owner_id=auth.uid()
  or (
    franchise_role()='manager'
    and franchise_has_location(location_id)
    and exists(
      select 1 from user_location_access a
      where a.user_id=auth.uid() and a.location_id=location_id and a.can_edit_actuals=true
    )
  )
);

create policy "owner financials owner only" on owner_financials
for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

create policy "master metrics read" on master_metrics
for select using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
  or exists(select 1 from employees e where e.id=employee_id and e.user_id=auth.uid())
);

create policy "master metrics owner manager write" on master_metrics
for all using (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
) with check (
  owner_id=auth.uid()
  or (franchise_role()='manager' and franchise_has_location(location_id))
);
