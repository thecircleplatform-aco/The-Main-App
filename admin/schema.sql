-- Minimal schema for Neon Postgres (optional).
-- Apply with your preferred migration tool.

create table if not exists council_sessions (
  id uuid primary key default gen_random_uuid(),
  idea text not null,
  created_at timestamptz not null default now()
);

create table if not exists council_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references council_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  persona_id text,
  persona_name text,
  content text not null,
  created_at timestamptz not null default now()
);

