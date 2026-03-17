-- Session version: invalidate all tokens when bumped (logout all, password change, admin force, suspicious).
-- Every JWT includes session_version; server rejects if token.session_version !== user.session_version.

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_session_version ON users(session_version);
