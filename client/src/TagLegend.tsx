import type { Graph } from "./types";
import { colorForTag } from "./colors";

interface Props {
  graph: Graph;
  activeQuery: string;
  onTagClick: (tag: string) => void;
}

export function TagLegend({ graph, activeQuery, onTagClick }: Props) {
  const counts = new Map<string, number>();
  for (const node of graph.nodes) {
    if (node.ghost) continue;
    for (const tag of node.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (tags.length === 0) return null;

  const activeTag = activeQuery.trim().toLowerCase();

  return (
    <div className="tag-legend">
      <span className="fading-label">Tags</span>
      {tags.map(([tag, count]) => (
        <button
          key={tag}
          className={`tag-legend-chip ${activeTag === tag ? "active" : ""}`}
          onClick={() => onTagClick(activeTag === tag ? "" : tag)}
        >
          <span className="dot" style={{ background: colorForTag(tag) }} />
          #{tag}
          <span className="count">{count}</span>
        </button>
      ))}
    </div>
  );
}
