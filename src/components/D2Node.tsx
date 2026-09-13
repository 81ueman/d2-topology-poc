import { memo, useContext } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { Shape } from "@d2lang/d2";
import { shapeKind, shapeTheme } from "../d2/theme";
import { shapeLabel } from "../d2/model";
import { ContainerContext } from "./context";

export interface D2NodeData extends Record<string, unknown> {
  shape: Shape;
  isContainer: boolean;
  childCount: number;
}

export type D2NodeType = Node<D2NodeData, "d2node">;

function D2NodeImpl({ data, selected }: NodeProps<D2NodeType>) {
  const { shape, isContainer, childCount } = data;
  const { collapsed, toggle } = useContext(ContainerContext);
  const isCollapsed = collapsed.has(shape.id);
  const kind = shapeKind(shape.type, isContainer);
  const theme = shapeTheme(kind);
  const border = selected ? "#93c5fd" : theme.stroke;
  const label = shapeLabel(shape);

  const classes = [
    "d2-node",
    `kind-${kind}`,
    isContainer ? "is-container" : "",
    isCollapsed ? "is-collapsed" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} title={shape.tooltip || label}>
      {kind === "hexagon" ? (
        <div className="hex" style={{ background: border }}>
          <div className="hex-inner" style={{ background: theme.fill, color: theme.text }}>
            {label}
          </div>
        </div>
      ) : (
        <div
          className="node-body"
          style={{ background: theme.fill, borderColor: border, color: theme.text }}
        >
          {label}
        </div>
      )}

      {isContainer ? (
        <button
          className="collapse-btn"
          title={isCollapsed ? "展開する" : "折りたたむ"}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggle(shape.id);
          }}
        >
          {isCollapsed ? "＋" : "−"}
          <span className="collapse-count">{childCount}</span>
        </button>
      ) : null}

      <Handle type="target" position={Position.Left} className="d2-handle" />
      <Handle type="source" position={Position.Right} className="d2-handle" />
    </div>
  );
}

export default memo(D2NodeImpl);
