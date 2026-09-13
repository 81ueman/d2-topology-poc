import { useContext } from "react";
import { BaseEdge, EdgeLabelRenderer } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { FreeDragContext } from "./context";

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
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) {
  const freeDrag = useContext(FreeDragContext);
  const pts = (data?.route as RoutePoint[] | undefined) ?? [];
  const label = (data?.label as string | undefined) ?? "";

  let path: string;
  let labelAt: RoutePoint;
  if (freeDrag || pts.length < 2) {
    path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelAt = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  } else {
    path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    labelAt = pts[Math.floor(pts.length / 2)];
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
