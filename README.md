# Well Well Wheel v2 🎡

Local-first picker for tonight's board game. Each visitor's collection
lives in their **own browser** (IndexedDB) — there is no shared backend,
no accounts, no sign-up. Share the URL with friends and each of them
gets their own private library.

Built with Vite + React + [Dexie](https://dexie.org/) (IndexedDB) and
deployed as a static site on Netlify, plus one tiny serverless function
to proxy BoardGameGeek's authenticated API.

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Bundler | Vite 8 | Fast HMR, simple SPA story |
| UI | React 19 + Tailwind v4 | Same look as v1 |
| Storage | IndexedDB via Dexie | Per-browser, no server needed |
| Animation | framer-motion | Wheel spin |
| Router | react-router 7 | Client-side routing |
| BGG proxy | Netlify Function (V2) | Bypasses CORS, hides API token |

## Quick start

**Prereqs:** Node 20+.

```bash
git clone <repo>
cd well-well-wheel-v2
npm install
cp .env.example .env.local      # then paste your BGG token
npm run dev                     # http://localhost:5173
```

If you don't supply a BGG token, the app still runs — you just can't
use the BoardGameGeek auto-fill on the Add page. Type details manually
and it works fine.

## Deploy to Netlify

1. Push this repo to GitHub.
2. Netlify → "Add new site" → connect the repo. Build command and
   publish dir are already in `netlify.toml`.
3. Set the env var `BGG_API_TOKEN` in **Site settings → Environment
   variables**.
4. Deploy. Share the URL.

Each visitor's IndexedDB lives in **their** browser; nobody can see
anybody else's collection.

## Migrating from v1 (server-side SQLite)

```bash
node scripts/dump-from-v1.mjs ../well-well-wheel/data/wellwheel.db \
  > seed-from-v1.json
```

Then open the app, go to Collection → ⬆ Import JSON → pick
`seed-from-v1.json`.

## Data hygiene

- **Backup:** Collection page → ⬇ Export JSON.
- **Restore on another browser/device:** ⬆ Import JSON.
- **Wipe:** browser DevTools → Application → IndexedDB → delete `wellwheel`.

There is no server backup. Export periodically if you care.

## Project layout

```
src/
  lib/
    db.ts          # Dexie schema (one table: games)
    repo.ts        # CRUD wrappers; what the UI calls
    types.ts       # Game record shape
    weight.ts      # NEW-badge + default-weight rules
    bgg-core.ts    # Shared BGG fetch+parse (used by netlify fn AND vite dev)
    bgg-client.ts  # Browser-side: calls /api/bgg/*
  components/      # GameCard, Wheel, BGGSearchBox, etc.
  pages/           # Home, Collection, CollectionAdd, Play
  App.tsx          # Routes
netlify/
  functions/
    bgg-search.ts  # GET /api/bgg/search?q=...
    bgg-thing.ts   # GET /api/bgg/thing?id=...
netlify.toml       # build config + SPA fallback
vite.config.ts     # also mounts the BGG proxy as dev middleware
scripts/
  dump-from-v1.mjs # one-off SQLite → export JSON
```

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server + BGG dev proxy at :5173 |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
