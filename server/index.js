import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import db from "./db.js";
import { brightnessOf, DEFAULT_HALF_LIFE_DAYS } from "./decay.js";
import { buildGraph } from "./links.js";
import { extractTags } from "./tags.js";

const app = express();
app.use(cors());
app.use(express.json());

const now = () => new Date().toISOString();

function getHalfLifeDays() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'halfLifeDays'").get();
  return row ? Number(row.value) : DEFAULT_HALF_LIFE_DAYS;
}

function toPublicNote(row, halfLifeDays) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastViewedAt: row.last_viewed_at,
    brightness: brightnessOf(row.last_viewed_at, halfLifeDays),
    tags: extractTags(row.content),
  };
}

app.get("/api/notes", (req, res) => {
  const halfLifeDays = getHalfLifeDays();
  const rows = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all();
  res.json(rows.map((row) => toPublicNote(row, halfLifeDays)));
});

app.get("/api/graph", (req, res) => {
  const halfLifeDays = getHalfLifeDays();
  const rows = db.prepare("SELECT * FROM notes").all();
  const realNodes = rows.map((row) => ({
    id: row.id,
    title: row.title,
    brightness: brightnessOf(row.last_viewed_at, halfLifeDays),
    tags: extractTags(row.content),
    ghost: false,
  }));
  const { edges, ghostNodes } = buildGraph(rows);
  res.json({ nodes: [...realNodes, ...ghostNodes], edges });
});

app.get("/api/settings", (req, res) => {
  res.json({ halfLifeDays: getHalfLifeDays() });
});

app.put("/api/settings", (req, res) => {
  const halfLifeDays = Number(req.body.halfLifeDays);
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
    return res.status(400).json({ error: "halfLifeDays must be a positive number" });
  }
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('halfLifeDays', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(String(halfLifeDays));
  res.json({ halfLifeDays });
});

app.get("/api/notes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Note not found" });

  db.prepare("UPDATE notes SET last_viewed_at = ? WHERE id = ?").run(now(), row.id);
  const refreshed = db.prepare("SELECT * FROM notes WHERE id = ?").get(row.id);
  res.json(toPublicNote(refreshed, getHalfLifeDays()));
});

app.post("/api/notes", (req, res) => {
  const { title, content = "" } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const id = randomUUID();
  const timestamp = now();
  db.prepare(
    `INSERT INTO notes (id, title, content, created_at, updated_at, last_viewed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, title.trim(), content, timestamp, timestamp, timestamp);

  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
  res.status(201).json(toPublicNote(row, getHalfLifeDays()));
});

app.put("/api/notes/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM notes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Note not found" });

  const title = req.body.title !== undefined ? req.body.title.trim() : existing.title;
  const content = req.body.content !== undefined ? req.body.content : existing.content;
  const timestamp = now();

  db.prepare(
    `UPDATE notes SET title = ?, content = ?, updated_at = ?, last_viewed_at = ? WHERE id = ?`
  ).run(title, content, timestamp, timestamp, existing.id);

  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(existing.id);
  res.json(toPublicNote(row, getHalfLifeDays()));
});

app.delete("/api/notes/:id", (req, res) => {
  const info = db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Note not found" });
  res.status(204).end();
});

app.get("/api/export", (req, res) => {
  const halfLifeDays = getHalfLifeDays();
  const rows = db.prepare("SELECT * FROM notes ORDER BY created_at ASC").all();
  res.json(rows.map((row) => toPublicNote(row, halfLifeDays)));
});

app.post("/api/import", (req, res) => {
  const incoming = Array.isArray(req.body.notes) ? req.body.notes : [];
  const insert = db.prepare(
    `INSERT INTO notes (id, title, content, created_at, updated_at, last_viewed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  let imported = 0;
  for (const item of incoming) {
    if (!item.title || !item.title.trim()) continue;
    const timestamp = now();
    insert.run(randomUUID(), item.title.trim(), item.content || "", timestamp, timestamp, timestamp);
    imported += 1;
  }
  res.status(201).json({ imported });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Glimmer server listening on http://localhost:${PORT}`);
});
