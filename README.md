# Intelligence Layers

Monorepo for the Intelligence Layers project. Contains an Express + TypeScript API, a Next.js client, and a small ML service.

**About**

The Mobility & AI Hackathon — is a cross-cultural event connecting Mexico and Austria. Organized by Your Future Made in Austria, WORK in AUSTRIA, and the Austrian Federal Economic Chamber, hosted at the Instituto Politécnico Nacional (IPN) in Mexico City, this hackathon brings together Mexico's dynamic tech scene with Austrian expertise.

This repository was used as a playground during the hackathon — a place to prototype mobility-focused ideas, run simulator scripts, and connect backend and frontend components for rapid experimentation focused on Plassed & Theurer challenge.

Overview

Quick start (development)

Prerequisites
- Node.js (v18+ recommended)
- pnpm
- PostgreSQL running and accessible (or adjust `DATABASE_URL` to point to your DB)
- (Optional) Docker & docker-compose if you prefer running services in containers

1) Install dependencies

```powershell
cd api
pnpm install
cd ../client
pnpm install
```

2) Set environment variables

Create a `.env` file in `api/` with at least:

```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DATABASE?schema=public
PORT=4000
FRONTEND_URL=http://localhost:3000
```

You can also set simulator-specific envs:
- `TAMPING_DATA_FETCHER_INTERVAL_MS` — interval between tamping simulator requests (ms)
- `TAMPING_INITIAL_DELAY_SEC` — initial delay before the first tamping request (seconds)
- `API_URL` — base URL the simulators will call (default `http://localhost:4000`)

3) Generate Prisma client

From `api/` run:

```powershell
pnpm exec prisma generate
```

If Prisma complains about a missing `DATABASE_URL`, temporarily set it inline for the generate command:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/intelligence_layers?schema=public'; pnpm exec prisma generate
```

4) Seed the database

The repo includes a seed script that resets tables and inserts a sample user and config.

From `api/` run:

```powershell
pnpm exec tsx prisma/seed.ts
```

This will truncate the `points`, `config`, and `users` tables and insert a default config and user.

5) Run the API

From `api/`:

```powershell
pnpm dev
```

By default the server runs on `http://localhost:4000`. The Express app mounts the config routes at `/api/configs`.

Useful API endpoints (curl examples)

- List configs
  - `curl http://localhost:4000/api/configs`
- Get config by id
  - `curl http://localhost:4000/api/configs/1`
- Create config
  - `curl -X POST -H "Content-Type: application/json" -d "{\"confidenceThreshold\":95,\"urgentThreshold\":70}" http://localhost:4000/api/configs`
- Upsert config (server uses id=1 internally)
  - `curl -X POST -H "Content-Type: application/json" -d "{\"confidenceThreshold\":90,\"urgentThreshold\":60}" http://localhost:4000/api/configs/upsert`
- Update config
  - `curl -X PUT -H "Content-Type: application/json" -d "{\"urgentThreshold\":80}" http://localhost:4000/api/configs/1`
- Delete config
  - `curl -X DELETE http://localhost:4000/api/configs/1`

PowerShell note: Use `curl.exe` to call the native curl shipped with Windows, or use `Invoke-RestMethod` / `Invoke-WebRequest` instead.

Client (Next.js)

From `client/`:

```powershell
pnpm dev
```

The Next app expects the API to run on the address configured in the `.env` or `next.config.ts` — by default the frontend proxies or calls `http://localhost:4000`.

Simulators

On API bootstrap the project starts several simulator scripts that call API endpoints to produce test data and alerts. If your API is not running when the simulators start, you will see connection errors (ECONNREFUSED). To avoid that:
- Ensure the API server is running before starting simulators, or
- Disable simulators in `src/index.ts` by commenting out the `start*Simulator()` calls in `bootstrap()`.

Troubleshooting

- Error: `Config not found` — seed your DB (see step 4) or create a config with the API before simulators request data.
- Prisma errors about missing `DATABASE_URL` during `prisma generate` — set `DATABASE_URL` temporarily as shown above.
- If you change Prisma schema: run `pnpm exec prisma migrate dev` (development) and then `pnpm exec prisma generate`.

Development tips

- API code lives under `api/src/api/*` (handlers, services, routers).
- Prisma schema is at `api/prisma/schema.prisma`.
- Seed logic is in `api/src/lib/seed.ts`.

Next steps / Improvements

- Add a docker-compose setup that starts Postgres, runs migrations, seeds DB, and starts the API and client.
- Add tests for API routes and services.

If you want, I can:
- Add a `Makefile` or `scripts` to simplify the common commands,
- Create a `docker-compose` flow to run everything with one command,
- Or run the seed and a quick curl against your running API (if you want me to attempt that now).
