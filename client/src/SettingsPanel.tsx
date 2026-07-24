import { useState } from "react";
import { api } from "./api";
import { POSITIONS_KEY } from "./StarMap";

interface Props {
  halfLifeDays: number;
  onHalfLifeSaved: (halfLifeDays: number) => void;
}

export function SettingsPanel({ halfLifeDays, onHalfLifeSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(halfLifeDays));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const openPanel = () => {
    setDraft(String(halfLifeDays));
    setStatus("idle");
    setOpen(true);
  };

  const handleSave = async () => {
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      const updated = await api.updateSettings(value);
      onHalfLifeSaved(updated.halfLifeDays);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const handleResetLayout = () => {
    if (!window.confirm("Clear the saved star positions? The sky will re-arrange itself on next load.")) {
      return;
    }
    localStorage.removeItem(POSITIONS_KEY);
    window.location.reload();
  };

  return (
    <div className="info-wrap">
      <button className="info-toggle" onClick={() => (open ? setOpen(false) : openPanel())} title="Settings">
        ⚙
      </button>
      {open && (
        <div className="info-panel settings-panel">
          <label className="settings-label">
            Fade half-life (days)
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="settings-input"
            />
          </label>
          <p className="settings-hint">
            How long until a note's brightness halves if left unvisited. Lower = fades faster.
          </p>
          <button className="primary" onClick={handleSave}>
            Save
          </button>
          {status === "saved" && <span className="settings-status ok">Saved</span>}
          {status === "error" && <span className="settings-status error">Enter a number greater than 0</span>}

          <div className="settings-divider" />

          <button className="danger" onClick={handleResetLayout}>
            Reset star layout
          </button>
          <p className="settings-hint">Clears remembered star positions so the sky re-simulates fresh.</p>
        </div>
      )}
    </div>
  );
}
