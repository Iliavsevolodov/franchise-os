create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  format text,
  status text not null default 'planned',
  planned_launch date,
  actual_launch date,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  name text not null,
  role text,
  status text default 'candidate',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists monthly_pnl (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  month date not null,
  revenue numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  unique(location_id, month)
);

create table if not exists fund_transactions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  fund text not null,
  category text,
  amount numeric not null,
  note text,
  happened_at date not null default current_date
);

alter table profiles enable row level security;
alter table locations enable row level security;
alter table employees enable row level security;
alter table monthly_pnl enable row level security;
alter table fund_transactions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own locations" on locations for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own employees" on employees for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own pnl" on monthly_pnl for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own fund tx" on fund_transactions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
