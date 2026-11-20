-- Landing page support. Run in the Supabase SQL editor AFTER 001_init.sql.
alter table events
  add column if not exists category text not null default 'general'
    check (category in ('general','founders','creatives','tech')),
  add column if not exists summary text;

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  type text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table contact_messages enable row level security;
