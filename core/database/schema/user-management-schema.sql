-- User management and anti-abuse schema for Circle
-- Apply with your preferred migration tool.

-- Add status column to users (active, blocked, shadow_banned)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- OAuth and profile columns (provider: email | google | github)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

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

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS submitter_email text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS submitter_name text;

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

-- Login/register attempt tracking for rate limiting and security monitoring
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  success boolean NOT NULL,
  action text NOT NULL DEFAULT 'login' CHECK (action IN ('login', 'register')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created ON login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_action_created ON login_attempts(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at DESC);

-- Auth security events for suspicious behavior and risk scoring
CREATE TABLE IF NOT EXISTS auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address text NOT NULL,
  device_fingerprint text,
  event_type text NOT NULL CHECK (event_type IN ('login_attempt', 'signup_attempt', 'password_reset_request')),
  risk_score int NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_created ON auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip ON auth_events(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_risk ON auth_events(risk_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type, created_at DESC);

-- Blocked device fingerprints (shadow-ban device)
CREATE TABLE IF NOT EXISTS blocked_devices (
  device_fingerprint text primary key,
  reason text,
  blocked_at timestamptz NOT NULL DEFAULT now()
);

-- Password reset tokens (single-use, 15 min expiry, one active per user)
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- Password recovery requests (contact admin when user cannot access email)
CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  email text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_recovery_requests_status ON password_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_recovery_requests_created ON password_recovery_requests(created_at DESC);
ALTER TABLE password_recovery_requests ADD COLUMN IF NOT EXISTS ip_address text;

-- ACO invitation codes (user, tester, developer, partner)
CREATE TABLE IF NOT EXISTS aco_codes (
  id uuid primary key default gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'tester', 'developer', 'partner')),
  uses_limit int NOT NULL DEFAULT 0,
  uses_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  disabled boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aco_codes_code ON aco_codes(code);
CREATE INDEX IF NOT EXISTS idx_aco_codes_expires ON aco_codes(expires_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS aco_code_used uuid REFERENCES aco_codes(id) ON DELETE SET NULL;

-- ACO code usage log
CREATE TABLE IF NOT EXISTS aco_code_logs (
  id uuid primary key default gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES aco_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aco_code_logs_code_id ON aco_code_logs(code_id);
CREATE INDEX IF NOT EXISTS idx_aco_code_logs_used_at ON aco_code_logs(used_at DESC);
