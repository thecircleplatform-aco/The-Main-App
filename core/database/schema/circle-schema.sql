-- Circle Community schema.
-- Apply after users table exists. Do not modify authentication tables.

-- Main circles table
CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text DEFAULT '',
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure new optional image column exists even if table was created earlier
ALTER TABLE circles
  ADD COLUMN IF NOT EXISTS circle_image_url text;

CREATE INDEX IF NOT EXISTS idx_circles_slug ON circles(slug);
CREATE INDEX IF NOT EXISTS idx_circles_category ON circles(category);
CREATE INDEX IF NOT EXISTS idx_circles_name ON circles(name);

-- Circle members (user membership and role)
CREATE TABLE IF NOT EXISTS circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);

-- Channels within each circle (general, photos, news, fan-talk, etc.)
CREATE TABLE IF NOT EXISTS circle_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_circle_channels_circle_id ON circle_channels(circle_id);

-- Messages in a channel
CREATE TABLE IF NOT EXISTS circle_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES circle_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_messages_circle_id ON circle_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_messages_channel_id ON circle_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_circle_messages_created_at ON circle_messages(created_at DESC);

-- Circle updates (admin posts: match results, announcements, news)
CREATE TABLE IF NOT EXISTS circle_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_updates_circle_id ON circle_updates(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_updates_created_at ON circle_updates(created_at DESC);

-- Banned users (cannot rejoin circle)
CREATE TABLE IF NOT EXISTS circle_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_bans_circle_id ON circle_bans(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_bans_user_id ON circle_bans(user_id);

-- Per-user notifications for circle activity and admin events
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('circle_update', 'admin_announcement', 'mention', 'circle_invite')),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read, created_at DESC);
