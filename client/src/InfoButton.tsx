import { useState } from "react";

export function InfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="info-wrap">
      <button className="info-toggle" onClick={() => setOpen((o) => !o)} title="What is this?">
        ?
      </button>
      {open && (
        <div className="info-panel">
          <p>
            Every note here is a <strong>star</strong>. The concept:
          </p>
          <ul>
            <li>
              Link notes with <code>[[Note Title]]</code> to draw a constellation line between them.
            </li>
            <li>
              Tag with <code>#topic</code> and every note sharing that tag glows the same color.
            </li>
            <li>Stars dim over time and only brighten again when you revisit or edit them.</li>
            <li>
              Dashed stars are <strong>ghosts</strong> — links to notes you haven't written yet. Click one
              to create it.
            </li>
          </ul>
          <button className="primary" onClick={() => setOpen(false)}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
