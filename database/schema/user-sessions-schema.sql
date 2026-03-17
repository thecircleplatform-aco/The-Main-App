-- Session management: track device, IP, last activity, allow revoke
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name text,
  ip_address text,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active DESC);
