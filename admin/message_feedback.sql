-- Message feedback table for user ratings (helpful / not helpful)
-- Run this if you already have the DB and need to add message_feedback.

CREATE TABLE IF NOT EXISTS message_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id    text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id
  ON message_feedback (user_id);
