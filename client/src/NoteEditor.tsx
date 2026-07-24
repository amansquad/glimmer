import { useEffect, useMemo, useState } from "react";
import type { Graph, Note } from "./types";
import { colorForTag } from "./colors";

interface Props {
  note: Note | null;
  graph: Graph;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onJumpTo: (id: string) => void;
}

interface RelatedNote {
  id: string;
  title: string;
  ghost: boolean;
}

export function NoteEditor({ note, graph, onSave, onDelete, onClose, onJumpTo }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
  }, [note]);

  const related = useMemo<{ backlinks: RelatedNote[]; outlinks: RelatedNote[] }>(() => {
    if (!note) return { backlinks: [], outlinks: [] };
    const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
    const backlinks: RelatedNote[] = [];
    const outlinks: RelatedNote[] = [];

    for (const edge of graph.edges) {
      if (edge.target === note.id) {
        const other = nodesById.get(edge.source);
        if (other) backlinks.push({ id: other.id, title: other.title, ghost: other.ghost });
      } else if (edge.source === note.id) {
        const other = nodesById.get(edge.target);
        if (other) outlinks.push({ id: other.id, title: other.title, ghost: other.ghost });
      }
    }
    return { backlinks, outlinks };
  }, [note, graph]);

  if (!note) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSave(title, content);
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
        />
        <button className="icon-button" onClick={onClose} title="Close">
          ×
        </button>
      </div>

      {note.tags.length > 0 && (
        <div className="tag-row">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-chip" style={{ borderColor: colorForTag(tag) }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <textarea
        className="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write your note. Link with [[Note Title]], tag with #topic. Ctrl+Enter to save."
      />

      {(related.outlinks.length > 0 || related.backlinks.length > 0) && (
        <div className="related-notes">
          {related.outlinks.length > 0 && (
            <div className="related-group">
              <span className="related-label">Links to</span>
              {related.outlinks.map((n) => (
                <button
                  key={n.id}
                  className={`related-chip ${n.ghost ? "ghost" : ""}`}
                  onClick={() => onJumpTo(n.id)}
                >
                  {n.ghost ? `+ ${n.title}` : n.title}
                </button>
              ))}
            </div>
          )}
          {related.backlinks.length > 0 && (
            <div className="related-group">
              <span className="related-label">Linked from</span>
              {related.backlinks.map((n) => (
                <button key={n.id} className="related-chip" onClick={() => onJumpTo(n.id)}>
                  {n.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="editor-footer">
        <span className="brightness-label">
          brightness {(note.brightness * 100).toFixed(0)}%
        </span>
        <div className="editor-actions">
          <button className="danger" onClick={onDelete}>
            Delete
          </button>
          <button className="primary" onClick={() => onSave(title, content)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
