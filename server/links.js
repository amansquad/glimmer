const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export function extractLinkedTitles(content) {
  const titles = new Set();
  for (const match of content.matchAll(LINK_PATTERN)) {
    titles.add(match[1].trim().toLowerCase());
  }
  return titles;
}

export function buildGraphEdges(notes) {
  const byLowerTitle = new Map(notes.map((n) => [n.title.trim().toLowerCase(), n.id]));
  const edges = [];
  const seen = new Set();

  for (const note of notes) {
    const linkedTitles = extractLinkedTitles(note.content);
    for (const title of linkedTitles) {
      const targetId = byLowerTitle.get(title);
      if (!targetId || targetId === note.id) continue;
      const key = [note.id, targetId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: note.id, target: targetId });
    }
  }
  return edges;
}
