-- Phone OTP authentication: users columns + phone_otps table
-- Apply after user-management-schema.sql

-- Users: phone auth columns (provider already exists: email | google | github | phone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_login_disabled boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;

-- OTP codes: 5 min expiry, max 5 attempts, single-use
CREATE TABLE IF NOT EXISTS phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_number ON phone_otps(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON phone_otps(expires_at);

-- Rate limit: OTP requests per phone per hour (enforced in app)
CREATE TABLE IF NOT EXISTS phone_otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_requests_phone_created ON phone_otp_requests(phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_requests_ip_created ON phone_otp_requests(ip_address, created_at DESC);
