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

## Why this exists

Most personal-notes apps (and most portfolio projects) are a list or a table.
Glimmer is a small experiment in making "which of my notes still matter"
*visible at a glance*, using a force-directed graph and a decay function
instead of a "last edited" column.

## Stack

- **Backend**: Node.js, Express, SQLite (`better-sqlite3`) — no external services required
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

## Project structure

```
glimmer/
├── server/          Express API + SQLite storage
│   ├── index.js      routes
│   ├── db.js          SQLite schema/connection
│   ├── decay.js       brightness/half-life math
│   ├── links.js       [[wiki-link]] parsing → graph edges + ghost nodes
│   └── tags.js        #tag extraction
└── client/          React + TypeScript + D3 frontend
    └── src/
        ├── StarMap.tsx    D3 force-directed constellation view
        ├── NoteEditor.tsx side panel: edit, tags, backlinks/outlinks
        ├── colors.ts      deterministic tag → color hashing
        └── App.tsx        top-level state, search, and layout
```

## Ideas for extending it

- Persist star map layout (fixed positions) instead of re-simulating on every load
- Tag-based coloring of stars (constellations by topic)
- Export/import as Markdown files for portability
- Multi-user auth if turned into a hosted product
