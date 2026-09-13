import { useContext } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { MovedNodesContext } from "./context";

export interface RoutePoint {
  x: number;
  y: number;
}

export interface D2EdgeData extends Record<string, unknown> {
  route: RoutePoint[];
  label: string;
}

export default function D2Edge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) {
  const moved = useContext(MovedNodesContext);
  const pts = (data?.route as RoutePoint[] | undefined) ?? [];
  const label = (data?.label as string | undefined) ?? "";

  // Follow the node once either endpoint has been dragged; otherwise show the
  // exact route D2 computed so the pristine layout looks like the D2 diagram.
  const follow = moved.has(source) || moved.has(target);

  let path: string;
  let labelAt: RoutePoint;
  if (!follow && pts.length >= 2) {
    path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    labelAt = pts[Math.floor(pts.length / 2)];
  } else {
    const [computed, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 12,
    });
    path = computed;
    labelAt = { x: labelX, y: labelY };
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
