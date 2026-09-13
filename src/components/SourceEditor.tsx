import type { KeyboardEvent } from "react";
import type { LayoutEngine } from "../d2/client";
import { LAYOUTS } from "../d2/client";
import type { DirectionSetting } from "../d2/direction";
import { DIRECTIONS, DIRECTION_LABELS } from "../d2/direction";
import type { Sample } from "../samples";
import { SAMPLES } from "../samples";

interface Props {
  source: string;
  onSourceChange: (value: string) => void;
  layout: LayoutEngine;
  onLayoutChange: (value: LayoutEngine) => void;
  direction: DirectionSetting;
  onDirectionChange: (value: DirectionSetting) => void;
  onApply: () => void;
  loading: boolean;
  error: string | null;
  onPickSample: (sample: Sample) => void;
}

export default function SourceEditor({
  source,
  onSourceChange,
  layout,
  onLayoutChange,
  direction,
  onDirectionChange,
  onApply,
  loading,
  error,
  onPickSample,
}: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onApply();
    }
  };

  return (
    <aside className="source-editor">
      <div className="panel-title">D2 ソース</div>

      <label className="field">
        <span>レイアウトエンジン</span>
        <select
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutEngine)}
        >
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>方向</span>
        <select
          value={direction}
          onChange={(e) => onDirectionChange(e.target.value as DirectionSetting)}
        >
          <option value="auto">{DIRECTION_LABELS.auto}</option>
          {DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {DIRECTION_LABELS[d]}
            </option>
          ))}
        </select>
      </label>
      {direction !== "auto" ? (
        <div className="hint">
          ソースの <code>direction</code> を「{DIRECTION_LABELS[direction]}」で上書き中
        </div>
      ) : null}

      <div className="field samples">
        <span>サンプル</span>
        <div className="sample-buttons">
          {SAMPLES.map((s) => (
            <button key={s.id} className="btn ghost" onClick={() => onPickSample(s)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="source-textarea"
        value={source}
        spellCheck={false}
        onChange={(e) => onSourceChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {error ? <div className="error-box">{error}</div> : null}

      <button className="btn primary" onClick={onApply} disabled={loading}>
        {loading ? "描画中…" : "描画 (⌘/Ctrl+Enter)"}
      </button>
    </aside>
  );
}
