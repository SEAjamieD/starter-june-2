# Whitelabel Frontend

Next.js 16 app scaffold for a whitelabel product frontend with Better Auth, Drizzle (SQLite for local dev), Apollo client plumbing, and shadcn/ui.

## Quick Start

```bash
npm install
cp .env.example .env
```

Set a secure `BETTER_AUTH_SECRET` value in `.env`, then run:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local development
- `npm run build` - production build
- `npm run db:push` - push Drizzle schema to your database

## Deploying

- Configure production `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` so Better Auth `trustedOrigins` matches your deployed domain(s).
- Local development uses SQLite (`DATABASE_URL=./data/auth.db`), but production should switch to a managed database (for example Postgres) and matching Drizzle adapter/provider settings.
- Ensure all required environment variables are set in deployment:
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `DATABASE_URL`
  - `NEXT_PUBLIC_GRAPHQL_URL`
