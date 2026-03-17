# Deploying Circle to Fly.io (Docker)

This app is configured for production on [Fly.io](https://fly.io) using Docker. It connects to **Neon PostgreSQL** and supports long-running AI/chat processes.

## Prerequisites

- **Node.js** (v20+): `node -v`
- **Fly CLI**: `winget install Fly-io.flyctl` then restart terminal, or [install docs](https://fly.io/docs/hub/installing-flyctl/)
- **Docker** (for local build test): [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure the daemon is running
- **Neon** Postgres connection string (pooled endpoint with `?sslmode=require`)

---

## Step 1 — Install tools (if missing)

```powershell
# Fly CLI (Windows)
winget install Fly-io.flyctl --accept-package-agreements --accept-source-agreements
# Restart terminal, then:
fly version

# Docker Desktop: install from https://docker.com, then:
docker --version

node -v
```

## Step 2 — Port

The app listens on the port provided by Fly via `process.env.PORT` (Next.js uses this automatically). `fly.toml` sets `internal_port = 3000`.

## Step 3 — Dockerfile

The project root contains a `Dockerfile`:

- `FROM node:20`
- `EXPOSE 3000`
- `CMD ["npm", "start"]`

## Step 4 — Initialize Fly app

From the project root (where `Dockerfile` and `fly.toml` are):

```powershell
fly auth login
fly launch
```

When prompted:

- **App name:** `circle-platform` (or keep existing from `fly.toml`)
- **Region:** choose closest
- **Database:** **NO** (we use Neon)
- **Deploy now:** **NO**

This uses or creates the `fly.toml` in the project.

## Step 5 — fly.toml

The repo `fly.toml` is already set with:

- `[http_service]` — `internal_port = 3000`, `force_https = true`
- `[[vm]]` — `size = "shared-cpu-1x"`, `memory = "1024mb"`

Health checks hit `GET /api/health` every 15s.

## Step 6 — Environment variables (secrets)

Set these **before** deploying (replace with your real values):

```powershell
fly secrets set DATABASE_URL="YOUR_NEON_CONNECTION_STRING"
fly secrets set DEEPSEEK_API_KEY="YOUR_DEEPSEEK_KEY"
fly secrets set SESSION_SECRET="your-generated-secret-min-16-chars"
fly secrets set NODE_ENV="production"
```

Generate a session secret: `openssl rand -base64 32` (or use any 16+ character secret).

Optional: `fly secrets set GEMINI_API_KEY="..."` for vision features.

## Step 7 — Build Docker image locally (optional)

```powershell
docker build -t circle-app .
docker run -p 3000:3000 -e DATABASE_URL="..." -e SESSION_SECRET="..." -e DEEPSEEK_API_KEY="..." circle-app
```

Open your app URL (e.g. http://localhost:3000 for local dev, or https://circle-platform.fly.dev in production) to verify.

## Step 8 — Deploy

```powershell
fly deploy
```

Wait for the build and release to finish.

## Step 9 — Verify

```powershell
fly status
fly open
fly logs
```

App URL: `https://circle-platform.fly.dev` (or the app name you used).

## Step 10 — Scaling (optional)

```powershell
fly scale memory 2048
fly scale count 2
```

---

## Expected result

- Application successfully running on Fly.io
- Docker container built and deployed
- Neon database connected via `DATABASE_URL`
- Environment variables configured via `fly secrets`
- App accessible via `https://<app-name>.fly.dev`
- Long-running AI/chat supported (1GB RAM default; increase with `fly scale memory` if needed)
