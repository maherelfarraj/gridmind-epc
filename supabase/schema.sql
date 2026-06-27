-- GridMind EPC™ Supabase schema
-- Run this inside Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'engineer', 'developer', 'viewer')) default 'viewer',
  company text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete set null,
  project_name text not null,
  country text,
  site_area_hectares numeric,
  grid_voltage_kv numeric,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.design_runs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  project_name text not null,
  capacity_mwp numeric not null,
  trackers_count integer not null,
  cable_length_meters numeric not null,
  ambient_temp_c numeric not null,
  transformer_mva numeric not null,
  conductor_size_mm2 integer not null,
  line_current_a numeric,
  loss_pct numeric,
  total_cost_usd numeric,
  bom_json jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.panel_inventory (
  id uuid primary key default uuid_generate_v4(),
  model_name text unique not null,
  wattage_w integer not null,
  unit_cost_usd numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.scada_telemetry (
  id bigint generated always as identity primary key,
  asset_key text not null,
  transformer_oil_temp_c numeric,
  dissolved_gas_ppm numeric,
  grid_throughput_mva numeric,
  trip_flag boolean default false,
  payload jsonb,
  recorded_at timestamptz default now()
);

insert into public.panel_inventory (model_name, wattage_w, unit_cost_usd)
values
  ('Trina Solar Vertex', 650, 117.00),
  ('Jinko Solar Tiger', 600, 108.00),
  ('Longi Hi-MO', 580, 104.40)
on conflict (model_name) do nothing;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.design_runs enable row level security;
alter table public.panel_inventory enable row level security;
alter table public.scada_telemetry enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "projects_authenticated_select" on public.projects for select to authenticated using (true);
create policy "projects_authenticated_insert" on public.projects for insert to authenticated with check (true);
create policy "projects_authenticated_update" on public.projects for update to authenticated using (true);

create policy "design_runs_authenticated_select" on public.design_runs for select to authenticated using (true);
create policy "design_runs_authenticated_insert" on public.design_runs for insert to authenticated with check (true);

create policy "panel_inventory_authenticated_select" on public.panel_inventory for select to authenticated using (true);

create policy "scada_authenticated_select" on public.scada_telemetry for select to authenticated using (true);
create policy "scada_authenticated_insert" on public.scada_telemetry for insert to authenticated with check (true);
