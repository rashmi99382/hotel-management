create extension if not exists pgcrypto;

create table if not exists tenants (
  id text primary key,
  name text not null,
  owner_email text not null,
  subscription_status text not null default 'inactive',
  razorpay_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_module_state (
  tenant_id text not null references tenants(id) on delete cascade,
  module_name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, module_name)
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references tenants(id) on delete cascade,
  module_name text not null,
  s3_key text not null,
  public_url text not null,
  content_type text,
  file_size_bytes bigint,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  tenant_id text,
  actor_sub text,
  action text not null,
  module_name text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
