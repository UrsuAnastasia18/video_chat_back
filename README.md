# Hello English Video Chat

Next.js app for online lessons, groups, books, worksheets, grades, Clerk auth,
Stream video calls, and Prisma/Postgres data.

## Environment Setup

The app does not keep production secrets in code. It reads configuration from
environment variables.

For local development, copy the example file:

```bash
cp .env.example .env
cp .env.example .env.local
```

Then replace the Clerk and Stream placeholders with local/test keys.

Local database default:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/videochat_db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Production values are configured in Vercel, not committed to Git:

```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_STREAM_API_KEY="..."
STREAM_SECRET_KEY="..."
NEXT_PUBLIC_BASE_URL="https://your-production-domain.vercel.app"
```

`NEXT_PUBLIC_BASE_URL` is optional for local browser flows. If it is missing,
the app falls back to `window.location.origin`; on the server it falls back to
`VERCEL_URL` or `http://localhost:3000`.

## Local Development

Start Postgres:

```bash
docker compose up -d
```

Apply local migrations:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Deployment

The production app runs on Vercel and uses Neon Postgres.

After setting `DATABASE_URL` in Vercel and Neon, apply production migrations
from a local terminal by pointing `.env` at Neon, or by running with an inline
`DATABASE_URL`:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npx prisma migrate deploy --schema prisma/schema.prisma
```

Do not run seed data in production unless you intentionally want demo/default
content there.

## Verification

Before pushing production changes:

```bash
npm run lint
npm test
npm audit --omit=dev
npm run build
```
