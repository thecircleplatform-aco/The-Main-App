# Set Fly.io secrets for production.
# 1. Run from project root after: fly auth login
# 2. Replace YOUR_* placeholders below with real values, then run this script.

# Required: Neon Postgres (pooled connection string with ?sslmode=require)
# fly secrets set DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
fly secrets set DATABASE_URL="YOUR_NEON_CONNECTION_STRING"

# Required: DeepSeek API key (https://platform.deepseek.com)
fly secrets set DEEPSEEK_API_KEY="YOUR_DEEPSEEK_KEY"

# Required: Session secret for login/register (min 16 chars). Generate: openssl rand -base64 32
fly secrets set SESSION_SECRET="YOUR_SESSION_SECRET"

# Production (optional; fly.toml already sets NODE_ENV=production)
fly secrets set NODE_ENV="production"

Write-Host "Done. List secrets with: fly secrets list"
