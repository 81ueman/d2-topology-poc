export type ShapeKind =
  | "container"
  | "rectangle"
  | "hexagon"
  | "cloud"
  | "person"
  | "cylinder"
  | "diamond";

export interface ShapeTheme {
  fill: string;
  stroke: string;
  text: string;
}

const THEMES: Record<ShapeKind, ShapeTheme> = {
  container: { fill: "rgba(59, 130, 246, 0.07)", stroke: "#334155", text: "#94a3b8" },
  rectangle: { fill: "#16213e", stroke: "#3b82f6", text: "#e2e8f0" },
  hexagon: { fill: "#083344", stroke: "#06b6d4", text: "#cffafe" },
  cloud: { fill: "#1e1b4b", stroke: "#8b5cf6", text: "#ede9fe" },
  person: { fill: "#3f2d07", stroke: "#eab308", text: "#fef9c3" },
  cylinder: { fill: "#052e16", stroke: "#22c55e", text: "#dcfce7" },
  diamond: { fill: "#3b0764", stroke: "#a855f7", text: "#f3e8ff" },
};

export function normalizeShapeType(type: string): ShapeKind {
  switch (type) {
    case "hexagon":
    case "cloud":
    case "person":
    case "cylinder":
    case "stored_data":
    case "diamond":
    case "decision":
      return type === "stored_data"
        ? "cylinder"
        : type === "decision"
          ? "diamond"
          : (type as ShapeKind);
    default:
      return "rectangle";
  }
}

export function shapeKind(type: string, isContainer: boolean): ShapeKind {
  return isContainer ? "container" : normalizeShapeType(type);
}

export function shapeTheme(kind: ShapeKind): ShapeTheme {
  return THEMES[kind];
}

export function minimapColor(kind: ShapeKind): string {
  return THEMES[kind].stroke;
}
