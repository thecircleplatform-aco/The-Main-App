-- User management and anti-abuse schema for Circle
-- Apply with your preferred migration tool.

-- Add status column to users (active, blocked, shadow_banned)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Track login and registration IP addresses
CREATE TABLE IF NOT EXISTS user_ips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ips_user_id ON user_ips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ips_ip ON user_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_ips_created ON user_ips(created_at DESC);

-- Device fingerprint for one-account-per-device
CREATE TABLE IF NOT EXISTS devices (
  id uuid primary key default gen_random_uuid(),
  device_fingerprint text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- Account creation abuse detection
CREATE TABLE IF NOT EXISTS account_creation_logs (
  id uuid primary key default gen_random_uuid(),
  device_fingerprint text NOT NULL,
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_creation_device ON account_creation_logs(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_account_creation_created ON account_creation_logs(created_at DESC);

-- Support tickets from blocked/shadow banned users
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  unblocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Admin action audit log
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created ON admin_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target ON admin_action_logs(target_type, target_id);
