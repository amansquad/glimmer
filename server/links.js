const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export function extractLinkedTitles(content) {
  const titles = [];
  for (const match of content.matchAll(LINK_PATTERN)) {
    const raw = match[1].trim();
    if (raw) titles.push(raw);
  }
  return titles;
}

// Builds edges between real notes, plus a synthetic "ghost" node for every
// [[link]] that points at a title with no note yet — an unformed star you
// can click to bring into being.
export function buildGraph(notes) {
  const byLowerTitle = new Map(notes.map((n) => [n.title.trim().toLowerCase(), n]));
  const ghostsByLowerTitle = new Map();
  const edges = [];
  const seenEdges = new Set();

  for (const note of notes) {
    const ownLowerTitle = note.title.trim().toLowerCase();
    for (const rawTitle of extractLinkedTitles(note.content)) {
      const lowerTitle = rawTitle.toLowerCase();
      if (lowerTitle === ownLowerTitle) continue;

      let targetId;
      const existing = byLowerTitle.get(lowerTitle);
      if (existing) {
        targetId = existing.id;
      } else {
        if (!ghostsByLowerTitle.has(lowerTitle)) {
          ghostsByLowerTitle.set(lowerTitle, { id: `ghost:${lowerTitle}`, title: rawTitle });
        }
        targetId = ghostsByLowerTitle.get(lowerTitle).id;
      }

      const edgeKey = [note.id, targetId].sort().join("::");
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);
      edges.push({ source: note.id, target: targetId });
    }
  }

  const ghostNodes = Array.from(ghostsByLowerTitle.values()).map((g) => ({
    id: g.id,
    title: g.title,
    brightness: 0.12,
    tags: [],
    ghost: true,
  }));

  return { edges, ghostNodes };
}
