import { useEffect, useState } from "react";
import type { Note } from "./types";

interface Props {
  note: Note | null;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
  }, [note]);

  if (!note) return null;

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
      <textarea
        className="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note. Link to another note with [[Note Title]]."
      />
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
