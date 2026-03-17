-- Core Voice Rooms schema mirror.

CREATE TABLE IF NOT EXISTS voice_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  host_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_speakers integer NOT NULL DEFAULT 8 CHECK (max_speakers > 0 AND max_speakers <= 16),
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  livekit_room_name text
);

CREATE INDEX IF NOT EXISTS idx_voice_rooms_circle_id ON voice_rooms(circle_id);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_status ON voice_rooms(status);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_circle_status ON voice_rooms(circle_id, status);

CREATE TABLE IF NOT EXISTS voice_room_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_number integer NOT NULL CHECK (seat_number >= 1 AND seat_number <= 16),
  mic_enabled boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, seat_number),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_room_seats_room_id ON voice_room_seats(room_id);
CREATE INDEX IF NOT EXISTS idx_voice_room_seats_user_id ON voice_room_seats(user_id);

CREATE TABLE IF NOT EXISTS voice_room_listeners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_room_listeners_room_id ON voice_room_listeners(room_id);
CREATE INDEX IF NOT EXISTS idx_voice_room_listeners_user_id ON voice_room_listeners(user_id);

CREATE TABLE IF NOT EXISTS voice_room_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES voice_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (room_id, user_id, status) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS idx_voice_room_requests_room_id ON voice_room_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_voice_room_requests_user_id ON voice_room_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_room_requests_status ON voice_room_requests(status);

