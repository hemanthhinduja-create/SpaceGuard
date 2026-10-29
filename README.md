# SpaceGuard

**SpaceGuard** is a satellite mission directory and simulated-telemetry dashboard built as a MERN-stack application: a React + Vite frontend talking to a Node.js/Express REST API backed by MongoDB.

> Mission profiles are curated from public agency references. **Telemetry is simulated** — SpaceGuard does not connect to real satellites. See [DATA-SOURCES.md](DATA-SOURCES.md).

## Architecture

```text
React + Vite (src/)  ──  /api (REST, JSON, HTTP-only cookie)  ──►  Express (server/)  ──►  MongoDB
   │                                                                  │
   └─ search, ranking, health display reuse src/utils/*  ◄────────────┘ (same code reused by the server)
```

- **Frontend**: React 19, React Router, Tailwind 4 + daisyUI, Vite.
- **Backend**: Express 4, Mongoose 8, JWT in an HTTP-only cookie, bcrypt (`bcryptjs`) password hashing, helmet, CORS allow-list, rate limiting.
- **Database**: MongoDB (local or Atlas). Collections: `satellites`, `telemetries`, `users`.
- `src/data/satellites.json` is **seed data only**; at runtime the app reads the catalogue from MongoDB through the API.

## Prerequisites (Windows / VS Code / PowerShell)

- Node.js **22.12+** (`node -v`)
- MongoDB Community Server running locally (service `MongoDB`), **or** a free MongoDB Atlas cluster

## Setup

```powershell
# 1. Install frontend + backend dependencies
npm run install:all

# 2. Create the backend environment file
Copy-Item server\.env.example server\.env
# 3. Generate a JWT secret and paste it into server\.env as JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Edit `server\.env` (never commit it):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/spaceguard` for local MongoDB, or your Atlas `mongodb+srv://…` string |
| `JWT_SECRET` | Signs session tokens. Random, ≥ 32 characters. The server refuses to start with the placeholder |
| `CLIENT_URL` | Allowed browser origin(s), comma-separated (default `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

The frontend needs **no secrets**. `.env.example` documents the optional `VITE_API_BASE_URL`; if you don't create a `.env`, the frontend calls `/api` and the Vite dev server proxies it to `http://localhost:4000`.

### MongoDB options

- **Local**: install MongoDB Community Server, make sure the service is running, keep the default `MONGODB_URI`.
- **Atlas**: create a free cluster and a database user, allow your IP under *Network Access*, copy the connection string into `server\.env` only.

## Run

```powershell
npm run seed        # load the 32 satellites into MongoDB (safe to repeat)
npm run dev:all     # frontend http://localhost:5173 + API http://localhost:4000
```

Or in two terminals: `npm run dev:server` and `npm run dev`.

## Tests and build

```powershell
npm test            # frontend + shared-logic tests (no database needed)
npm run test:server # backend tests
npm run build       # production build of the frontend
npm run check       # all of the above
```

Backend tests: `validators.test.js` needs nothing; `api.nodb.test.js` needs installed dependencies but no MongoDB; `api.integration.test.js` starts an in-memory MongoDB (`mongodb-memory-server`, downloads a `mongod` binary on first run) or uses `TEST_MONGODB_URI` if set (the database name **must end in `_test`**; it is wiped). If no test database can start, integration tests are reported as skipped, not passed.

## API

All responses are JSON; errors look like `{ "error": { "code": "…", "message": "…" } }`.

| Method & path | Auth | Description |
| --- | --- | --- |
| `GET /api/health` | – | API + database status (`503` if DB is down) |
| `GET /api/satellites?category=&q=` | – | Catalogue; filters use the same search/ranking as the UI |
| `GET /api/satellites/:id` | – | One satellite by stable id (`404` if missing, `400` if malformed) |
| `GET /api/satellites/:id/related` | – | Up to 3 related **active** satellites (existing ranking logic) |
| `GET /api/satellites/:id/telemetry` | ✔ | Latest stored simulated reading (`404 NO_TELEMETRY` if none) |
| `GET /api/satellites/:id/telemetry/history?limit=` | ✔ | Recent readings, oldest→newest (`limit` 1–100, default 24) |
| `POST /api/satellites/:id/telemetry/simulate` | ✔ | Advance the simulator, store (rate-limited, see below), return the reading |
| `GET /api/satellites/:id/health` | ✔ | Health score from the latest stored reading (`404` if none — never "healthy by default") |
| `POST /api/auth/register` `{name,email,password}` | – | Create account, set session cookie |
| `POST /api/auth/login` `{email,password}` | – | Sign in (generic error for bad email *or* password) |
| `GET /api/auth/me` | ✔ | Restore the session after a refresh |
| `POST /api/auth/logout` | – | Clear the session cookie |

## Authentication

Passwords are hashed with bcrypt (12 rounds) and never returned. Sessions are a signed JWT (7 days) in an **HTTP-only** cookie; nothing sensitive is kept in `localStorage`. `SameSite=Lax` in development, `SameSite=None; Secure` in production. State-changing requests must be JSON and come from an allowed `Origin` (CSRF defence). Login/register are rate-limited (20 per 15 min per IP). Logout clears the cookie; because the JWT is stateless, a copied token stays valid until it expires (7 days) — acceptable for this project, noted for production.

## Telemetry simulation

The server reuses the frontend generator (`src/utils/telemetry.js`) and health algorithm (`src/utils/healthScore.js`), so metric ranges, precision and scoring are unchanged. The dashboard requests a new sample every 2 s. To avoid excessive writes, the server advances the simulator in memory on every request but **stores at most one reading per satellite per 10 seconds**; stored readings expire automatically after **24 hours** (MongoDB TTL index). The chart keeps the last 24 samples. If the connection drops, the last readings stay visible, flagged as held, until *Try Again* succeeds.

## Common problems

| Symptom | Fix |
| --- | --- |
| `Invalid environment configuration` on start | Create `server\.env` from `.env.example`; set a real `JWT_SECRET` |
| `Could not connect to MongoDB` | Start the MongoDB service, or fix `MONGODB_URI` / Atlas IP allow-list |
| Empty catalogue / "Unable to load mission data" | API or DB is down — check `http://localhost:4000/api/health`; run `npm run seed` |
| Login works but refresh logs you out | Use `http://localhost:5173` (matching `CLIENT_URL`), not a different host/port |
| Port already in use | Change `PORT` in `server\.env` (and the proxy target in `vite.config.js`) |

## Deployment to Vercel (Unified Full-Stack)

SpaceGuard is configured for zero-friction full-stack deployment on [Vercel](https://vercel.com):
- **Frontend**: Vite builds to static files in `dist/`.
- **Backend API**: The Express API is exposed as a Vercel Serverless Function via `api/index.js` and routed cleanly from `/api/*`.
- **Database**: MongoDB Atlas connection. On first launch, if the database has not been seeded yet, the serverless handler automatically seeds the 32 curated satellite profiles into your collection.

### 1. Push to GitHub
```powershell
git remote add origin https://github.com/harshaadapa6-dot/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project** and select your GitHub repository.
3. Framework Preset will be automatically detected as **Vite**.
4. Root Directory stays default (`./`).
5. Open **Environment Variables** and add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/spaceguard?retryWrites=true&w=majority`)
   - `JWT_SECRET`: A secure random secret of at least 32 characters (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `NODE_ENV`: `production` (set by Vercel by default)
6. Click **Deploy**.

## Project structure

```text
SpaceGuard/
├── api/                 Vercel serverless entry point (api/index.js)
├── src/                 React app (pages, components, hooks, services/apiClient.js, utils, data/satellites.json = seed)
├── server/
│   ├── server.js        Standalone local server entry point
│   └── src/ config/ models/ controllers/ routes/ middleware/ services/ utils/ scripts/ app.js
├── tests/               frontend + shared-logic tests
├── server/tests/        backend tests
├── vercel.json          Vercel routing and serverless function bundle configuration
└── README.md, DATA-SOURCES.md, JUDGE-CHECKLIST.md
```

## AI assistance

Approximately 80% of the initial frontend code was generated with ChatGPT; the MongoDB/Express integration was added with Claude. All of it should be reviewed and tested by the team.
