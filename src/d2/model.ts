import type { Connection, Shape } from "@d2lang/d2";

/**
 * `Shape` is a union (Class | SQLTable | Text) intersected with ShapeBase, so
 * `label` is not statically available on every member even though the renderer
 * always sets it. Read it defensively.
 */
export function shapeLabel(shape: Shape): string {
  const label = (shape as { label?: unknown }).label;
  return typeof label === "string" && label.length > 0 ? label : shape.id;
}

export function connectionLabel(connection: Connection): string {
  return connection.label ?? "";
}

export function isContainerId(shapes: Shape[], id: string): boolean {
  const prefix = `${id}.`;
  for (const shape of shapes) {
    if (shape.id.startsWith(prefix)) return true;
  }
  return false;
}
