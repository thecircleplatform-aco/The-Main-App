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
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_session_version ON users(session_version);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
  `);
  await pool.query(`
    UPDATE users SET session_version = COALESCE(session_version, 1) WHERE session_version IS NULL;
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

  // PERSONAS (per-user profile from onboarding)
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

    CREATE INDEX IF NOT EXISTS idx_admin_users_email_ci
      ON admin_users (lower(email));

    CREATE INDEX IF NOT EXISTS idx_personas_user_id
      ON personas (user_id);
  `);

  // --- Remove old AI/council tables if they exist (idempotent cleanup) ---
  await pool.query(`DROP TABLE IF EXISTS council_messages CASCADE;`);
  await pool.query(`DROP TABLE IF EXISTS council_cases CASCADE;`);
  await pool.query(`DROP TABLE IF EXISTS council_pages CASCADE;`);
  await pool.query(`DROP TABLE IF EXISTS council_sessions CASCADE;`);
  await pool.query(`DROP TABLE IF EXISTS ai_discussions CASCADE;`);
  await pool.query(`DROP TABLE IF EXISTS insights CASCADE;`);

  // --- Circle Community tables ---
  await pool.query(`
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
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circles_slug ON circles(slug);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circles_category ON circles(category);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circle_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
      joined_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(circle_id, user_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circle_channels (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      name text NOT NULL,
      slug text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(circle_id, slug)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_channels_circle_id ON circle_channels(circle_id);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circle_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      channel_id uuid NOT NULL REFERENCES circle_channels(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message_text text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_messages_circle_id ON circle_messages(circle_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_messages_channel_id ON circle_messages(channel_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_messages_created_at ON circle_messages(created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circle_updates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      title text NOT NULL,
      content text NOT NULL,
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_updates_circle_id ON circle_updates(circle_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_updates_created_at ON circle_updates(created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circle_bans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      banned_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(circle_id, user_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_bans_circle_id ON circle_bans(circle_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_circle_bans_user_id ON circle_bans(user_id);`);

  await pool.query(`
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
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications(user_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read, created_at DESC);`);

  // --- Remove duplicate circles (keep one per slug: highest member_count, then lowest id); preserve memberships ---
  await pool.query(`
    DO $$
    DECLARE
      dup RECORD;
      keeper_id uuid;
    BEGIN
      FOR dup IN
        SELECT c.id AS dup_id, c.slug
        FROM circles c
        WHERE c.id <> (
          SELECT c2.id FROM circles c2 WHERE c2.slug = c.slug
          ORDER BY c2.member_count DESC, c2.id ASC LIMIT 1
        )
      LOOP
        SELECT c2.id INTO keeper_id FROM circles c2 WHERE c2.slug = dup.slug
        ORDER BY c2.member_count DESC, c2.id ASC LIMIT 1;
        IF keeper_id IS NOT NULL THEN
          INSERT INTO circle_members (circle_id, user_id, role)
          SELECT keeper_id, user_id, role FROM circle_members WHERE circle_id = dup.dup_id
          ON CONFLICT (circle_id, user_id) DO NOTHING;
          DELETE FROM circle_members WHERE circle_id = dup.dup_id;
          DELETE FROM circle_channels WHERE circle_id = dup.dup_id;
          DELETE FROM circle_messages WHERE circle_id = dup.dup_id;
          DELETE FROM circle_updates WHERE circle_id = dup.dup_id;
          DELETE FROM circle_bans WHERE circle_id = dup.dup_id;
          DELETE FROM circles WHERE id = dup.dup_id;
        END IF;
      END LOOP;
    END $$;
  `);
  await pool.query(`
    UPDATE circles SET member_count = (
      SELECT COUNT(*)::int FROM circle_members WHERE circle_members.circle_id = circles.id
    );
  `);
  try {
    await pool.query(`ALTER TABLE circles ADD CONSTRAINT unique_circle_slug UNIQUE (slug);`);
  } catch (e) {
    if (e.code !== "42P07" && e.code !== "42710") throw e;
  }
}

async function seedData() {
  // Seed a demo user
  const userEmail = "founder@circle.local";
  const userRes = await pool.query(
    `
      INSERT INTO users (email, name, session_version)
      VALUES ($1, $2, 1)
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

  // Seed admin user (login + admin_users): admin@thecircleplatform.org / fRMEiN7L
  const adminEmail = "admin@thecircleplatform.org";
  const adminPasswordHash = await bcrypt.hash("fRMEiN7L", 10);
  await pool.query(
    `
      INSERT INTO users (email, name, password_hash, session_version)
      VALUES ($1, $2, $3, 1)
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
      "Welcome to Circle.",
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

const DEFAULT_CHANNELS = [
  { name: "General", slug: "general" },
  { name: "Photos", slug: "photos" },
  { name: "News", slug: "news" },
  { name: "Fan Talk", slug: "fan-talk" },
];

const CIRCLES_BY_CATEGORY = {
  Music: [
    { name: "BTS", description: "BTS and ARMY community" },
    { name: "Blackpink", description: "Blackpink and BLINKs" },
    { name: "Taylor Swift", description: "Swifties community" },
    { name: "K-Pop", description: "Korean pop music fans" },
    { name: "Hip-Hop", description: "Hip-hop and rap" },
    { name: "Rock", description: "Rock music fans" },
    { name: "Jazz", description: "Jazz music lovers" },
    { name: "Classical", description: "Classical music" },
    { name: "Pop", description: "Pop music worldwide" },
    { name: "Indie", description: "Indie and alternative" },
    { name: "Metal", description: "Metal music community" },
    { name: "R&B", description: "R&B and soul" },
    { name: "Country", description: "Country music fans" },
    { name: "EDM", description: "Electronic dance music" },
    { name: "Reggae", description: "Reggae and dancehall" },
    { name: "Latin Music", description: "Latin music and reggaeton" },
    { name: "Punk", description: "Punk rock community" },
  ],
  Sports: [
    { name: "Football", description: "Football and soccer fans" },
    { name: "Ronaldo", description: "Cristiano Ronaldo fans" },
    { name: "Messi", description: "Lionel Messi fans" },
    { name: "Basketball", description: "Basketball community" },
    { name: "Tennis", description: "Tennis fans" },
    { name: "NBA", description: "NBA discussion" },
    { name: "NFL", description: "American football" },
    { name: "Cricket", description: "Cricket fans" },
    { name: "F1", description: "Formula 1 and motorsport" },
    { name: "Golf", description: "Golf community" },
    { name: "Boxing", description: "Boxing fans" },
    { name: "UFC", description: "UFC and MMA" },
    { name: "Olympics", description: "Olympic sports" },
    { name: "Baseball", description: "Baseball fans" },
    { name: "Rugby", description: "Rugby union and league" },
    { name: "Cycling", description: "Cycling and Tour de France" },
    { name: "Swimming", description: "Swimming and aquatics" },
  ],
  Countries: [
    { name: "China", description: "China and Chinese culture" },
    { name: "Japan", description: "Japan and Japanese culture" },
    { name: "Korea", description: "Korea and Korean culture" },
    { name: "USA", description: "United States community" },
    { name: "UK", description: "United Kingdom community" },
    { name: "India", description: "India and Indian culture" },
    { name: "Brazil", description: "Brazil and Brazilian culture" },
    { name: "France", description: "France and French culture" },
    { name: "Germany", description: "Germany and German culture" },
    { name: "Canada", description: "Canada community" },
    { name: "Australia", description: "Australia community" },
    { name: "Italy", description: "Italy and Italian culture" },
    { name: "Spain", description: "Spain and Spanish culture" },
    { name: "Mexico", description: "Mexico and Mexican culture" },
    { name: "Russia", description: "Russia community" },
    { name: "Indonesia", description: "Indonesia community" },
    { name: "Nigeria", description: "Nigeria community" },
    { name: "Egypt", description: "Egypt and Egyptian culture" },
    { name: "Thailand", description: "Thailand community" },
    { name: "Argentina", description: "Argentina community" },
  ],
  Learning: [
    { name: "Programming", description: "Coding and software development" },
    { name: "Startups", description: "Startups and entrepreneurship" },
    { name: "Languages", description: "Language learning" },
    { name: "Science", description: "Science and research" },
    { name: "History", description: "History and archaeology" },
    { name: "Math", description: "Mathematics" },
    { name: "Philosophy", description: "Philosophy and ethics" },
    { name: "Psychology", description: "Psychology and mental health" },
    { name: "Business", description: "Business and management" },
    { name: "Marketing", description: "Marketing and growth" },
    { name: "Design", description: "Design and UX" },
    { name: "Writing", description: "Writing and storytelling" },
    { name: "Data Science", description: "Data science and analytics" },
    { name: "AI & ML", description: "Artificial intelligence and machine learning" },
    { name: "Finance", description: "Finance and investing" },
    { name: "Law", description: "Law and legal discussion" },
    { name: "Engineering", description: "Engineering disciplines" },
  ],
  Entertainment: [
    { name: "Anime", description: "Anime and Japanese animation" },
    { name: "Movies", description: "Movies and cinema" },
    { name: "TV Shows", description: "TV series and streaming" },
    { name: "Gaming", description: "Video games and esports" },
    { name: "Marvel", description: "Marvel Cinematic Universe" },
    { name: "DC", description: "DC Comics and films" },
    { name: "Netflix", description: "Netflix shows and discussion" },
    { name: "Music Festivals", description: "Festivals and live events" },
    { name: "Stand-up Comedy", description: "Comedy and stand-up" },
    { name: "Podcasts", description: "Podcasts and audio" },
    { name: "Books", description: "Books and reading" },
    { name: "Manga", description: "Manga and comics" },
    { name: "Cosplay", description: "Cosplay and conventions" },
    { name: "K-Drama", description: "Korean dramas" },
    { name: "Sci-Fi", description: "Science fiction" },
    { name: "Fantasy", description: "Fantasy books and media" },
  ],
  Lifestyle: [
    { name: "Fitness", description: "Fitness and workout" },
    { name: "Travel", description: "Travel and adventure" },
    { name: "Cooking", description: "Cooking and recipes" },
    { name: "Photography", description: "Photography and cameras" },
    { name: "Fashion", description: "Fashion and style" },
    { name: "Minimalism", description: "Minimalist lifestyle" },
    { name: "Sustainability", description: "Eco-friendly living" },
    { name: "Meditation", description: "Meditation and mindfulness" },
    { name: "Self-Care", description: "Self-care and wellness" },
    { name: "Pets", description: "Pets and animal lovers" },
    { name: "Gardening", description: "Gardening and plants" },
    { name: "DIY", description: "DIY and crafts" },
    { name: "Home Decor", description: "Home decor and interior design" },
    { name: "Running", description: "Running and marathons" },
    { name: "Nutrition", description: "Nutrition and diet" },
    { name: "Parenting", description: "Parenting and family" },
    { name: "Tech Lifestyle", description: "Tech and gadgets in daily life" },
  ],
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchCircleImageUrlForCircle(name, category) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  const topic = (name || category || "community").trim();
  let queryText = `${topic} community illustration square`;
  if (/anime/i.test(topic)) queryText = "anime illustration community avatar square";
  else if (/programming|coding|developer|engineer/i.test(topic))
    queryText = "programming coding workspace illustration square";
  else if (/startup|founder|business|founders/i.test(topic))
    queryText = "startup founders business illustration square";
  else if (/bts|k-pop|kpop/i.test(topic))
    queryText = "kpop concert aesthetic illustration square";
  else if (/game|gaming|esports|controller/i.test(topic))
    queryText = "gaming controller neon illustration square";

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", queryText);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "square");

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const first = data?.photos?.[0];
    const src =
      first?.src?.large2x || first?.src?.large || first?.src?.medium || null;
    return src || null;
  } catch {
    return null;
  }
}

async function seedCircles() {
  let totalCircles = 0;
  for (const [category, circles] of Object.entries(CIRCLES_BY_CATEGORY)) {
    for (const { name, description } of circles) {
      const slug = slugify(name);
      const circleImageUrl = await fetchCircleImageUrlForCircle(name, category);
      await pool.query(
        `
          INSERT INTO circles (name, slug, category, description, circle_image_url, member_count)
          VALUES ($1, $2, $3, $4, $5, 0)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            circle_image_url = COALESCE(EXCLUDED.circle_image_url, circles.circle_image_url),
            updated_at = now();
        `,
        [name, slug, category, description || "", circleImageUrl]
      );
      const circleRes = await pool.query(
        "SELECT id FROM circles WHERE slug = $1",
        [slug]
      );
      const circleId = circleRes.rows[0]?.id;
      if (!circleId) continue;
      for (const ch of DEFAULT_CHANNELS) {
        await pool.query(
          `
            INSERT INTO circle_channels (circle_id, name, slug)
            VALUES ($1, $2, $3)
            ON CONFLICT (circle_id, slug) DO NOTHING;
          `,
          [circleId, ch.name, ch.slug]
        );
      }
      totalCircles += 1;
    }
  }
  return totalCircles;
}

async function main() {
  try {
    console.log("Running migrations...");
    await runMigrations();
    console.log("Migrations complete.");

    console.log("Seeding data...");
    await seedData();
    console.log("Seed complete.");

    console.log("Seeding circles and default channels...");
    const circleCount = await seedCircles();
    console.log(`Circles seeded: ${circleCount}.`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

