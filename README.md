# 🚉 Interlayer

Monorepo for the Intelligence Layers project — containing:

🟣 Express + TypeScript API

🟢 Next.js frontend

🔵 Python ML microservice

Built during the Mobility & AI Hackathon connecting Mexico 🇲🇽 and Austria 🇦🇹, hosted at IPN (Mexico City), organized by Your Future Made in Austria, WORK in AUSTRIA, and the Austrian Federal Economic Chamber.
This repository served as a rapid prototyping environment for mobility-focused solutions addressing the Plasser & Theurer challenge.

## 📘 Overview

Interlayer is the intelligence layer for tamping operations. It is designed to be integrated with ballast tampers and makes use of arbitrary sensor data to optimize operations and augment operator ability.

We provide:
Easy to use APIs to integrate with sensor providers.
Event driven architecture to gracefully handle event and evaluation data.
Real time machine learning adaptability to optimize operations.

Model learning happens real time as operators provide feedback, enhancing the system to your specific needs.

This monorepo contains:

api/          → Express + TypeScript backend
client/       → Next.js frontend
ml-service/   → Python ML microservice (Dockerized)

### Arquitecture Diagram
<img width="9935" height="3418" alt="image" src="https://github.com/user-attachments/assets/99883096-e8c0-4355-a587-19e70fefdfa5" />


## 🚀 Quick Start (Development)
🔧 Prerequisites

Ensure the user has:

- Node.js v18+

- pnpm

- PostgreSQL

- Docker & docker-compose 

A running PostgreSQL database or adjust the DATABASE_URL to match your setup

### 🟣 Backend Setup (API)
1) Environment Variables

Create a .env file in api/:

```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DATABASE?schema=public
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Optional simulator envs**

```
TAMPING_DATA_FETCHER_INTERVAL_MS=1000
TAMPING_INITIAL_DELAY_SEC=3
API_URL=http://localhost:4000
```

2) Install Dependencies

```
cd api
pnpm install
```
4) Generate Prisma Client

```
pnpm exec prisma generate
```

If Prisma complains about a missing DATABASE_URL:

```
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/intelligence_layers?schema=public'; pnpm exec prisma generate
```

4) Run Backend

```
pnpm dev
```

Backend runs at:

```
http://localhost:4000
```

🔍 Useful API Endpoints
Action	Endpoint
List configs	GET /api/configs
Get config by ID	GET /api/configs/:id
Create config	POST /api/configs
Upsert default config	POST /api/configs/upsert
Update config	PUT /api/configs/:id
Delete config	DELETE /api/configs/:id

Examples (curl):

```
curl http://localhost:4000/api/configs

curl -X POST -H "Content-Type: application/json" \
  -d "{\"confidenceThreshold\":95,\"urgentThreshold\":70}" \
  http://localhost:4000/api/configs
```

### 🟢 Frontend Setup (Next.js)

From client/:

1) Environment Variables

Create a .env file:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

2) Install Dependencies
cd client
pnpm install

3) Run Frontend
pnpm dev


Frontend runs at:

```
http://localhost:3000
```

### 🔵 ML Service (Python)

From ml-service/:

Start the ML microservice:

```
docker-compose up --build
```

It downloads a SentenceTransformer model (all-MiniLM-L6-v2) and exposes an API for inference.

🎛️ Simulators (Optional)

The API launches several simulators on startup.
If your API is not running when they start, you may see errors like ECONNREFUSED.

To disable simulators:

Inside api/src/index.ts, comment out the calls to:

startTampingSimulator();
startUrgentSimulator();
start... (etc)

### 🧰 Troubleshooting
❌ Config not found

Run seed: pnpm exec tsx prisma/seed.ts

Or create a config manually using /api/configs/upsert

❌ Prisma: missing DATABASE_URL

Set it inline:

```
$env:DATABASE_URL='postgresql://...' ; pnpm exec prisma generate
```

❌ Schema changed?

Run:

```
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

### 🗂️ Development Notes

API routes: api/src/api/*

Prisma schema: api/prisma/schema.prisma

DB seed logic: api/src/lib/seed.ts

### 📈 Next Steps / Improvements

Add a full docker-compose that:

Spins up PostgreSQL

Runs migrations

Seeds DB

Starts API + Frontend + ML automatically

Add automated tests for backend routes and services

Add CI/CD for monorepo deployments

### 📎 Appendix
📊 Database Schema

DB Docs:
https://dbdocs.io/MiisaelCabrera/Intelligence-Layer

🛠 Plasser & Theurer — Stopfung (Tamping Technology)

https://www.plassertheurer.com/en/machine/technologie/stopfung/ueber-stopfung/schneller-zu-hoeherer-qualitaet-nivellier-hebe-richt-und-stopfmaschinen
