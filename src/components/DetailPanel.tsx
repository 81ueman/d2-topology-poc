import type { ReactNode } from "react";
import type { Edge } from "@xyflow/react";
import type { Diagram } from "@d2lang/d2";
import type { D2NodeType } from "./D2Node";
import { connectionLabel, shapeLabel } from "../d2/model";

export type Selection =
  | { kind: "node"; node: D2NodeType }
  | { kind: "edge"; edge: Edge }
  | null;

interface Props {
  selection: Selection;
  diagram: Diagram | null;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <div className="detail-key">{label}</div>
      <div className="detail-val">{children}</div>
    </div>
  );
}

export default function DetailPanel({ selection, diagram, onClose }: Props) {
  if (!selection) {
    return (
      <aside className="detail-panel empty">
        <p>ノードまたはリンクをクリックすると詳細を表示します。</p>
      </aside>
    );
  }

  if (selection.kind === "edge") {
    const edge = selection.edge;
    const conn = (diagram?.connections ?? []).find((c) => c.id === edge.id);
    return (
      <aside className="detail-panel">
        <div className="detail-head">
          <span className="chip edge">Link</span>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <Row label="ラベル">{edge.data?.label ? String(edge.data.label) : "（なし）"}</Row>
        <Row label="接続">
          {edge.source} → {edge.target}
        </Row>
        <Row label="矢印">
          {conn?.srcArrow ?? "none"} → {conn?.dstArrow ?? "none"}
        </Row>
        <Row label="経路点">{conn?.route?.length ?? 0} 点</Row>
        <Row label="ID">
          <code>{edge.id}</code>
        </Row>
      </aside>
    );
  }

  const { shape, isContainer } = selection.node.data;
  const id = shape.id;
  const related = (diagram?.connections ?? []).filter(
    (c) => c.src === id || c.dst === id,
  );

  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <span className="chip">{isContainer ? "Container" : "Node"}</span>
        <button className="icon-btn" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>
      <Row label="ラベル">{shapeLabel(shape)}</Row>
      <Row label="ID">
        <code>{id}</code>
      </Row>
      <Row label="shape">{shape.type}</Row>
      <Row label="サイズ">
        {shape.width} × {shape.height}
      </Row>
      {shape.link ? (
        <Row label="link">
          <a href={shape.link} target="_blank" rel="noreferrer">
            {shape.link}
          </a>
        </Row>
      ) : null}
      {shape.tooltip ? <Row label="tooltip">{shape.tooltip}</Row> : null}
      <div className="detail-subhead">接続 {related.length} 件</div>
      <ul className="conn-list">
        {related.map((c) => {
          const outgoing = c.src === id;
          const other = outgoing ? c.dst : c.src;
          const label = connectionLabel(c);
          return (
            <li key={c.id}>
              <span className={outgoing ? "dir out" : "dir in"}>
                {outgoing ? "→" : "←"}
              </span>
              <span className="conn-other">{other}</span>
              {label ? <span className="conn-label">{label}</span> : null}
            </li>
          );
        })}
        {related.length === 0 ? <li className="muted">接続なし</li> : null}
      </ul>
    </aside>
  );
}
