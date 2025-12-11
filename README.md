<<<<<<< HEAD
# BreezeSync (Atomberg Smart Fan Control)

A Next.js (App Router) + TypeScript + Tailwind app with a small Express proxy for secure Atomberg API access. Credentials are stored encrypted in an HTTP-only cookie on the proxy; the browser never sees your secrets. Includes demo mode, automations, voice commands, telemetry, and PWA basics.

## Features
- Secure backend proxy: credentials encrypted server-side; HTTP-only cookie.
- Login form: API key + refresh token (+ optional base URL).
- Dashboard: list fans (name, status, speed, mode).
- Controls per fan: power toggle, speed slider (0–5), mode select.
- React Query data/loading/error handling; toast notifications.
- Demo mode with sample fans (no credentials).
- Simple automations (in-memory demo).
- Voice commands (“turn on/off”, “speed N”) for the first fan.
- PWA essentials (manifest + service worker).

## Requirements
- Node.js 18+
- `AUTH_SECRET` (random string 32+ chars) for cookie encryption on the proxy
- Optional:
  - `ATOMBERG_BASE_URL` (default: `https://developer.atomberg-iot.com`)
  - `NEXT_PUBLIC_API_BASE` (default: `http://localhost:4000` during local dev)

## Quick Start (Windows PowerShell)
1) Install dependencies:
```bash
pnpm install   # or npm/yarn
```

## Quick start
```bash
# 1) install deps
pnpm install   # or npm/yarn

# 2) set env (PowerShell examples)
$env:AUTH_SECRET="paste-a-32+char-secret"
$env:ATOMBERG_BASE_URL="https://developer.atomberg-iot.com" # or your own proxy base
$env:NEXT_PUBLIC_API_BASE="http://localhost:4000"

# 3) run backend proxy (Express)
pnpm dev:server

# 4) in new shell run frontend (Next.js)
pnpm dev
```
Frontend: http://localhost:3000 (Next).  
Backend proxy: http://localhost:4000 (Express).  
Rewrites send `/api/*` from Next to the proxy.

## Usage flow
1) Enter API key + refresh token (+ base URL).  
2) Click “Save & load fans” – credentials go to `/api/session` (Express), stored encrypted in an HTTP-only cookie.  
3) Dashboard fetches `/api/fans` (server refreshes access token, then calls Atomberg list endpoint).  
4) For each fan, adjust power/speed/mode → POST `/api/fans/:id/command` → backend proxies to Atomberg.  
5) Optional demo mode loads fake fans (no credentials required).  
6) Automations panel stores simple rules server-side (in-memory demo).  
7) Voice commands (Web Speech API) for simple “turn on/off” and “speed N” on first fan.  
8) Telemetry card shows speed/temp/power (mocked if no API fields).

## Project structure
- `app/page.tsx` – UI (login + dashboard + automations + telemetry + voice).
- `components/ui/*` – shadcn-style primitives.
- `server/index.js` – Express proxy (credentials, fans, commands, automations, demo data).
- `public/manifest.json` & `public/service-worker.js` – PWA basics.
- `next.config.js` – rewrites `/api/*` to the Express proxy.

## Deployment
- Backend (Express): Render/Railway/Fly; set `AUTH_SECRET`, `ATOMBERG_BASE_URL`, CORS origin.
- Frontend (Next): Vercel/Netlify; set `NEXT_PUBLIC_API_BASE` to your deployed backend.
- Ensure HTTPS so cookies are sent (`secure` flag on cookies).

## Notes
- Adjust Atomberg endpoints/payloads in `app/api/_lib/atomberg.ts` if the official spec differs.
- This sample does not persist anything beyond the encrypted cookie.

## Scripts
- `pnpm dev` – run locally
- `pnpm build` – production build
- `pnpm start` – serve production build
- `pnpm lint` – lint

=======
# AtomSync (Atomberg Smart Fan Control)

A Next.js (App Router) + TypeScript + Tailwind app with a small Express proxy for secure Atomberg API access. Credentials are stored encrypted in an HTTP-only cookie on the proxy; the browser never sees your secrets. Includes demo mode, automations, voice commands, telemetry, and PWA basics.

## Features
- Secure backend proxy: credentials encrypted server-side; HTTP-only cookie.
- Login form: API key + refresh token (+ optional base URL).
- Dashboard: list fans (name, status, speed, mode).
- Controls per fan: power toggle, speed slider (0–5), mode select.
- React Query data/loading/error handling; toast notifications.
- Demo mode with sample fans (no credentials).
- Simple automations (in-memory demo).
- Voice commands (“turn on/off”, “speed N”) for the first fan.
- PWA essentials (manifest + service worker).

## Requirements
- Node.js 18+
- `AUTH_SECRET` (random string 32+ chars) for cookie encryption on the proxy
- Optional:
  - `ATOMBERG_BASE_URL` (default: `https://developer.atomberg-iot.com`)
  - `NEXT_PUBLIC_API_BASE` (default: `http://localhost:4000` during local dev)

## Quick Start (Windows PowerShell)
1) Install dependencies:
```bash
pnpm install   # or npm/yarn
```

## Quick start
```bash
# 1) install deps
pnpm install   # or npm/yarn

# 2) set env (PowerShell examples)
$env:AUTH_SECRET="paste-a-32+char-secret"
$env:ATOMBERG_BASE_URL="https://developer.atomberg-iot.com" # or your own proxy base
$env:NEXT_PUBLIC_API_BASE="http://localhost:4000"

# 3) run backend proxy (Express)
pnpm dev:server

# 4) in new shell run frontend (Next.js)
pnpm dev
```
Frontend: http://localhost:3000 (Next).  
Backend proxy: http://localhost:4000 (Express).  
Rewrites send `/api/*` from Next to the proxy.

## Usage flow
1) Enter API key + refresh token (+ base URL).  
2) Click “Save & load fans” – credentials go to `/api/session` (Express), stored encrypted in an HTTP-only cookie.  
3) Dashboard fetches `/api/fans` (server refreshes access token, then calls Atomberg list endpoint).  
4) For each fan, adjust power/speed/mode → POST `/api/fans/:id/command` → backend proxies to Atomberg.  
5) Optional demo mode loads fake fans (no credentials required).  
6) Automations panel stores simple rules server-side (in-memory demo).  
7) Voice commands (Web Speech API) for simple “turn on/off” and “speed N” on first fan.  
8) Telemetry card shows speed/temp/power (mocked if no API fields).

## Project structure
- `app/page.tsx` – UI (login + dashboard + automations + telemetry + voice).
- `components/ui/*` – shadcn-style primitives.
- `server/index.js` – Express proxy (credentials, fans, commands, automations, demo data).
- `public/manifest.json` & `public/service-worker.js` – PWA basics.
- `next.config.js` – rewrites `/api/*` to the Express proxy.

## Deployment
- Backend (Express): Render/Railway/Fly; set `AUTH_SECRET`, `ATOMBERG_BASE_URL`, CORS origin.
- Frontend (Next): Vercel/Netlify; set `NEXT_PUBLIC_API_BASE` to your deployed backend.
- Ensure HTTPS so cookies are sent (`secure` flag on cookies).

## Notes
- Adjust Atomberg endpoints/payloads in `app/api/_lib/atomberg.ts` if the official spec differs.
- This sample does not persist anything beyond the encrypted cookie.

## Scripts
- `pnpm dev` – run locally
- `pnpm build` – production build
- `pnpm start` – serve production build
- `pnpm lint` – lint


>>>>>>> e26fc1da58dfa9fb599194d348340593e3ec9eb8
