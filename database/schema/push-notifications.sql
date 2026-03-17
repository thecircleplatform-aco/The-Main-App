-- Push notifications schema: device tokens + per-user push preferences

CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_token
  ON device_tokens (user_id, device_token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user
  ON device_tokens (user_id);

CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mentions_enabled boolean NOT NULL DEFAULT true,
  updates_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

