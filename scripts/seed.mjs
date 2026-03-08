import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from .env.local in project root
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Please configure it in .env.local.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  // Enable pgcrypto (for gen_random_uuid) if available.
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // sender_type enum
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type') THEN
        CREATE TYPE sender_type AS ENUM ('user', 'agent');
      END IF;
    END$$;
  `);

  // USERS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email         text NOT NULL UNIQUE,
      name          text,
      password_hash text,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;
  `);

  // ACCOUNT_DELETIONS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_deletions (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason     text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // AGENTS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name          text NOT NULL UNIQUE,
      personality   text,
      system_prompt text NOT NULL,
      avatar        text,
      active        boolean NOT NULL DEFAULT true,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
  `);

  // SESSIONS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_active  timestamptz NOT NULL DEFAULT now(),
      created_at   timestamptz NOT NULL DEFAULT now()
    );
  `);

  // MESSAGES
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id   uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
      agent_id     uuid REFERENCES agents(id) ON DELETE SET NULL,
      sender_type  sender_type NOT NULL,
      sender_name  text NOT NULL,
      content      text NOT NULL,
      created_at   timestamptz NOT NULL DEFAULT now()
    );
  `);

  // AI_DISCUSSIONS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_discussions (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE,
      user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
      agent_id    uuid REFERENCES agents(id) ON DELETE SET NULL,
      topic       text NOT NULL,
      agent_name  text NOT NULL,
      message     text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  `);

  // INSIGHTS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS insights (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       text NOT NULL,
      summary     text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  `);

  // PERSONAS (per-user AI persona from onboarding)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS personas (
      id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      nickname            text NOT NULL,
      interests           jsonb NOT NULL DEFAULT '[]'::jsonb,
      goals               text,
      ai_personality      text NOT NULL,
      idea_sharing_enabled boolean NOT NULL DEFAULT false,
      system_prompt       text NOT NULL,
      gender              text,
      birth_date          date,
      country             text,
      created_at          timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE personas ADD COLUMN IF NOT EXISTS gender text;`);
  await pool.query(`ALTER TABLE personas ADD COLUMN IF NOT EXISTS birth_date date;`);
  await pool.query(`ALTER TABLE personas ADD COLUMN IF NOT EXISTS country text;`);

  // MESSAGE_FEEDBACK (user ratings for AI messages)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS message_feedback (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message_id    text NOT NULL,
      feedback_type text NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
      created_at    timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, message_id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id
      ON message_feedback (user_id);
  `);

  // USER_SETTINGS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      profile    jsonb DEFAULT '{}'::jsonb,
      privacy    jsonb DEFAULT '{}'::jsonb,
      notifications jsonb DEFAULT '{}'::jsonb,
      ai         jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // ADMIN_USERS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email      text NOT NULL UNIQUE,
      role       text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // Indexes (idempotent)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email_ci
      ON users (lower(email));

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id
      ON sessions (user_id);

    CREATE INDEX IF NOT EXISTS idx_sessions_last_active
      ON sessions (last_active DESC);

    CREATE INDEX IF NOT EXISTS idx_messages_session_created
      ON messages (session_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_messages_user_id
      ON messages (user_id);

    CREATE INDEX IF NOT EXISTS idx_messages_agent_id
      ON messages (agent_id);

    CREATE INDEX IF NOT EXISTS idx_ai_discussions_session_created
      ON ai_discussions (session_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_ai_discussions_user_id
      ON ai_discussions (user_id);

    CREATE INDEX IF NOT EXISTS idx_ai_discussions_agent_id
      ON ai_discussions (agent_id);

    CREATE INDEX IF NOT EXISTS idx_insights_user_created
      ON insights (user_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_admin_users_email_ci
      ON admin_users (lower(email));

    CREATE INDEX IF NOT EXISTS idx_personas_user_id
      ON personas (user_id);
  `);
}

async function seedData() {
  // Seed a demo user
  const userEmail = "founder@circle.local";
  const userRes = await pool.query(
    `
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING id;
    `,
    [userEmail, "Circle Founder"]
  );
  const userId = userRes.rows[0].id;

  // Seed agents (aligned with app personas)
  const agents = [
    {
      name: "Visionary",
      personality: "Big-picture strategy",
      system_prompt:
        "You are Visionary: optimistic, strategic, and product-minded. Provide bold but realistic direction, clarify the north star, and propose 2-3 high-leverage moves.",
      avatar: "🌀",
      active: true,
    },
    {
      name: "Skeptic",
      personality: "Risk & reality checks",
      system_prompt:
        "You are Skeptic: pragmatic, critical, and detail-oriented. Identify assumptions, risks, failure modes, and what would invalidate the idea. Be constructive, not rude.",
      avatar: "🛡️",
      active: true,
    },
    {
      name: "Builder",
      personality: "Execution plan",
      system_prompt:
        "You are Builder: senior engineer with strong systems thinking. Break the idea into an implementation plan, architecture, milestones, and the fastest MVP path.",
      avatar: "🧱",
      active: true,
    },
    {
      name: "Marketer",
      personality: "Positioning & growth",
      system_prompt:
        "You are Marketer: crisp, persuasive, and user-centric. Provide positioning, target ICPs, messaging, and 2-3 acquisition loops.",
      avatar: "📣",
      active: true,
    },
  ];

  for (const agent of agents) {
    await pool.query(
      `
        INSERT INTO agents (name, personality, system_prompt, avatar, active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO UPDATE
        SET personality = EXCLUDED.personality,
            system_prompt = EXCLUDED.system_prompt,
            avatar = EXCLUDED.avatar,
            active = EXCLUDED.active;
      `,
      [
        agent.name,
        agent.personality,
        agent.system_prompt,
        agent.avatar,
        agent.active,
      ]
    );
  }

  // Seed a default session for the demo user
  const sessionRes = await pool.query(
    `
      INSERT INTO sessions (user_id)
      VALUES ($1)
      RETURNING id;
    `,
    [userId]
  );
  const sessionId = sessionRes.rows[0].id;

  // Seed an example insight
  await pool.query(
    `
      INSERT INTO insights (user_id, title, summary)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING;
    `,
    [
      userId,
      "Welcome to Circle",
      "This is a sample insight generated during database seeding. Use it as a template for storing council outcomes.",
    ]
  );

  // Seed admin user (login + admin_users): admin@thecircleplatform.org / fRMEiN7L
  const adminEmail = "admin@thecircleplatform.org";
  const adminPasswordHash = await bcrypt.hash("fRMEiN7L", 10);
  await pool.query(
    `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
      RETURNING id;
    `,
    [adminEmail, "Circle Admin", adminPasswordHash]
  );
  await pool.query(
    `
      INSERT INTO admin_users (email, role)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role;
    `,
    [adminEmail, "owner"]
  );

  // Seed legacy demo user as admin_users entry (founder@circle.local)
  await pool.query(
    `
      INSERT INTO admin_users (email, role)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role;
    `,
    [userEmail, "owner"]
  );

  // Optional: initial message for the session
  await pool.query(
    `
      INSERT INTO messages (session_id, user_id, sender_type, sender_name, content)
      VALUES ($1, $2, 'user', $3, $4)
      ON CONFLICT DO NOTHING;
    `,
    [
      sessionId,
      userId,
      "Circle Founder",
      "Seed message: share your startup or product idea here and let the AI council respond.",
    ]
  );

  // Seed default user settings
  await pool.query(
    `
      INSERT INTO user_settings (user_id, profile, privacy, notifications, ai)
      VALUES (
        $1,
        $2::jsonb,
        $3::jsonb,
        $4::jsonb,
        $5::jsonb
      )
      ON CONFLICT (user_id) DO NOTHING;
    `,
    [
      userId,
      JSON.stringify({
        displayName: "Circle Founder",
        bio: "Early tester of the Circle AI council.",
      }),
      JSON.stringify({
        showProfilePublic: false,
        shareIdeasWithModels: true,
        dataRetentionDays: 90,
      }),
      JSON.stringify({
        emailSummaries: true,
        productUpdates: false,
        aiActivity: true,
      }),
      JSON.stringify({
        formality: "balanced",
        explanationDepth: "standard",
        allowAgentDebate: true,
      }),
    ]
  );
}

async function main() {
  try {
    console.log("Running migrations...");
    await runMigrations();
    console.log("Migrations complete.");

    console.log("Seeding data...");
    await seedData();
    console.log("Seed complete.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

