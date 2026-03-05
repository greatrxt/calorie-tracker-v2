# NourishAI - Smart Calorie Tracker

AI-powered calorie and nutrition tracker built on Cloudflare. Type what you ate in natural language or snap a photo — AI handles the rest.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1
- **Storage:** Cloudflare R2 (meal photos)
- **AI:** OpenAI GPT-4o-mini (text + vision)
- **Auth:** Custom JWT + Google OAuth

## Features

- Natural language meal logging ("2 eggs and toast with butter")
- Photo-based meal logging (camera or upload)
- AI nutrition estimation (calories, protein, carbs, fat)
- Daily calorie ring with macro progress bars
- Water intake tracking with quick-add
- Weight logging and trend chart
- Favorites system for frequent meals
- 30-day calorie trend + weight trend charts
- Streak tracking, dark mode, PWA support
- CSV data export, meal reminders
- Confirm-before-save preview for AI-parsed entries

## Local Development

```bash
# Install dependencies
npm install

# Create D1 database
npx wrangler d1 create calorie_tracker_v2
# Copy the database_id into wrangler.jsonc

# Run migration
npx wrangler d1 execute calorie_tracker_v2 --local --file=migrations/0001_schema.sql

# Set secrets (for local dev, add to .dev.vars)
# JWT_SECRET=your-secret
# OPENAI_API_KEY=your-key
# GOOGLE_CLIENT_SECRET=your-google-secret

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Purpose | Where |
|----------|---------|-------|
| `JWT_SECRET` | Signs auth tokens | Worker secret |
| `OPENAI_API_KEY` | AI meal parsing | Worker secret |
| `GOOGLE_CLIENT_ID` | Google OAuth | wrangler.jsonc vars |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Worker secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | wrangler.jsonc vars |

## Deployment

```bash
# Create D1 database (if not already done)
npx wrangler d1 create calorie_tracker_v2

# Update database_id in wrangler.jsonc

# Run migration on remote
npx wrangler d1 execute calorie_tracker_v2 --remote --file=migrations/0001_schema.sql

# Create R2 bucket
npx wrangler r2 bucket create calorie-tracker-photos

# Set secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Deploy
npm run build && npx wrangler deploy
```

## Project Structure

```
worker/              # Cloudflare Worker (Hono API)
  routes/            # API route handlers
  utils/             # JWT, password hashing, auth middleware
src/                 # React frontend
  components/        # UI components
  hooks/             # React hooks (auth, theme)
  lib/               # API client, utilities
  pages/             # Page components
migrations/          # D1 schema migrations
```
