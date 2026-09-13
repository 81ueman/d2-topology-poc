import { useContext } from "react";
import { BaseEdge, EdgeLabelRenderer, useInternalNode } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { EdgeRenderContext } from "./context";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface D2EdgeData extends Record<string, unknown> {
  route: RoutePoint[];
  label: string;
}

interface NodeBox {
  internals: { positionAbsolute: { x: number; y: number } };
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
}

function centerOf(node: NodeBox) {
  const w = node.measured?.width ?? node.width ?? 0;
  const h = node.measured?.height ?? node.height ?? 0;
  const p = node.internals.positionAbsolute;
  return { x: p.x + w / 2, y: p.y + h / 2, w, h };
}

/** Point where the line from the node's center towards (tx, ty) exits its box. */
function borderPoint(node: NodeBox, tx: number, ty: number): RoutePoint {
  const c = centerOf(node);
  const dx = tx - c.x;
  const dy = ty - c.y;
  if (dx === 0 && dy === 0) return { x: c.x, y: c.y };
  const scale = Math.min(
    c.w / 2 / Math.abs(dx || Number.EPSILON),
    c.h / 2 / Math.abs(dy || Number.EPSILON),
  );
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

export default function D2Edge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) {
  const { straightEdges, moved } = useContext(EdgeRenderContext);
  const pts = (data?.route as RoutePoint[] | undefined) ?? [];
  const label = (data?.label as string | undefined) ?? "";

  const sourceNode = useInternalNode(source) as NodeBox | undefined;
  const targetNode = useInternalNode(target) as NodeBox | undefined;

  // Straight by default. When straight lines are off, the exact D2 route is
  // used, except for edges touching a dragged node which still follow it.
  const useRoute = !straightEdges && !moved.has(source) && !moved.has(target);

  let path: string;
  let labelAt: RoutePoint;
  if (useRoute && pts.length >= 2) {
    path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    labelAt = pts[Math.floor(pts.length / 2)];
  } else if (sourceNode && targetNode) {
    const sc = centerOf(sourceNode);
    const tc = centerOf(targetNode);
    const from = borderPoint(sourceNode, tc.x, tc.y);
    const to = borderPoint(targetNode, sc.x, sc.y);
    path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    labelAt = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  } else {
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelAt = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: selected ? "#60a5fa" : "#64748b",
          strokeWidth: selected ? 2.5 : 1.5,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="d2-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelAt.x}px, ${labelAt.y}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
