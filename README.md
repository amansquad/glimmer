# ✦ Glimmer

Glimmer is a note-taking app that renders your knowledge base as a **night sky**.

Every note is a star. Link two notes together with `[[wiki-style links]]` and a
constellation line is drawn between them. The twist: a star's brightness decays
over time using an exponential half-life, and only **revisiting or editing a
note resets its clock**. Notes you actually use stay lit; notes you've
forgotten fade into the background — a visual, ambient form of spaced
repetition for your own knowledge, instead of another flat list of rows.

Beyond the core star map:

- **Tags → constellation colors** — write `#topic` anywhere in a note and every
  note sharing that tag glows the same deterministic hue.
- **Ghost stars** — link to a title that doesn't exist yet (`[[Someday Idea]]`)
  and it appears as a dashed, unformed star. Click it to instantly create that
  note — a visible backlog of ideas you've referenced but not written.
- **Backlinks & outlinks panel** — the editor shows which notes link to the
  one you're reading and which notes it links out to, one click to jump.
- **Search** — typing in the search box dims every star that doesn't match
  the query by title or tag, so the map itself becomes the filter. Press `/`
  anywhere to jump into the search box, `Esc` to close the open note.
- **Write / Preview** — notes render as lightweight markdown (headers, bold,
  italic, code, lists) with `[[links]]` and `#tags` turned into clickable
  chips right inside the text, not just in a sidebar.
- **Fading Stars strip** — a bar under the header lists your dimmest notes
  (below 50% brightness) so you always have a one-click "what to revisit"
  queue — the decay concept made actionable instead of just decorative.
- **Export / Import** — download every note as a single JSON file, or import
  one back in. No lock-in, no server-side auth to lose your data behind.
- **Ctrl/Cmd+Enter** to save a note without leaving the keyboard, with a
  confirmation prompt before any delete.
- **A sky that stays put** — star positions persist in `localStorage`, so the
  map doesn't reshuffle into a new random layout every time you save a note.
- **Tag legend** — every tag in use appears as a clickable, color-matched
  chip with a count, letting you browse the sky by topic instead of typing.
- **Sky stats** — the header shows a live count of stars, how many are
  fading, and how many are still unborn (ghosts), for an at-a-glance read
  of your knowledge base's health.
- **Duplicate-title warning** — since `[[links]]` resolve by title, two notes
  with the same title race for who "wins" a link. The editor now flags this
  the moment it happens instead of leaving it as a silent gotcha.

## Why this exists

Most personal-notes apps (and most portfolio projects) are a list or a table.
Glimmer is a small experiment in making "which of my notes still matter"
*visible at a glance*, using a force-directed graph and a decay function
instead of a "last edited" column.

## Stack

- **Backend**: Node.js, Express, SQLite (built-in `node:sqlite`, requires Node ≥ 24 to run unflagged) — no external services required
- **Frontend**: React + TypeScript, Vite, D3.js (force simulation for the star map)
- **Linking**: notes reference each other via `[[Note Title]]` syntax, parsed server-side into a graph

## Running locally

```bash
# Terminal 1 — API server (http://localhost:4000)
cd server
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173, create a couple of notes, link them with
`[[Other Note Title]]`, and drag stars around the map. Come back in a few
days without touching a note and watch it dim.

## How the decay works

Each note stores a `lastViewedAt` timestamp, refreshed whenever it's opened or
saved. Brightness is `0.5 ^ (daysSinceLastViewed / 10)` — a 10-day half-life —
clamped so stars never fully vanish. See [`server/decay.js`](server/decay.js).

## Deploying it

Glimmer is two separate deployables: a static frontend and a stateful API
server with a local SQLite file. **The backend can't run on Vercel** —
Vercel only runs stateless serverless functions with an ephemeral
filesystem, which is incompatible with a persistent SQLite file. Split it
across two hosts instead:

**Backend → [Render](https://render.com)** (free tier)
1. New → Blueprint → point it at this repo. `render.yaml` at the repo root
   already defines the service (Node, `server/` as root dir, free plan).
2. Once deployed, copy the service URL, e.g. `https://glimmer-api.onrender.com`.
3. Note: Render's free tier has no persistent disk, so the SQLite file resets
   on every redeploy (not on every request — it survives fine between them
   while the service is up). Fine for a demo; add a persistent disk or swap
   to a hosted Postgres/Turso database for real long-term use.

**Frontend → [Vercel](https://vercel.com)**
1. Import this repo. The root `vercel.json` tells Vercel to build only
   `client/` and serve `client/dist`.
2. In the Vercel project's Settings → Environment Variables, add
   `VITE_API_BASE_URL` set to `https://<your-render-service>.onrender.com/api`
   (include the `/api` suffix). Vite bakes this in at build time, so set it
   *before* the first deploy or trigger a redeploy after adding it.
3. Redeploy. The frontend will now call your Render-hosted API instead of
   the local dev proxy.

## Project structure

```
glimmer/
├── vercel.json      Vercel config: build client/ as a static site
├── render.yaml      Render blueprint: run server/ as a web service
├── server/          Express API + SQLite storage
│   ├── index.js      routes
│   ├── db.js          SQLite schema/connection
│   ├── decay.js       brightness/half-life math
│   ├── links.js       [[wiki-link]] parsing → graph edges + ghost nodes
│   └── tags.js        #tag extraction
└── client/          React + TypeScript + D3 frontend
    └── src/
        ├── StarMap.tsx     D3 force-directed constellation view, persisted layout
        ├── NoteEditor.tsx  edit/preview, tags, backlinks/outlinks
        ├── FadingStars.tsx review queue of dimmest notes
        ├── TagLegend.tsx   clickable tag filter with counts
        ├── markdown.ts     dependency-free markdown-lite renderer
        ├── colors.ts       deterministic tag → color hashing
        ├── api.ts          fetch wrapper, backend URL from VITE_API_BASE_URL
        └── App.tsx         top-level state, search, and layout
```

## Ideas for extending it

- A persistent disk or hosted Postgres/Turso for the backend so data survives redeploys
- Export/import as Markdown files, not just JSON, for portability
- Multi-user auth if turned into a hosted product
- List/table view as an accessible alternative to the force-directed map
