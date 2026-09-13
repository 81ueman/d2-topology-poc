export type Direction = "right" | "down" | "left" | "up";
export type DirectionSetting = Direction | "auto";

export const DIRECTIONS: Direction[] = ["right", "down", "left", "up"];

export const DIRECTION_LABELS: Record<DirectionSetting, string> = {
  auto: "ソースに従う",
  right: "→ 右",
  down: "↓ 下",
  left: "← 左",
  up: "↑ 上",
};

/**
 * Override the root board's direction without touching the user's source text.
 * Only a column-0 `direction:` line is replaced; directions nested inside
 * containers (indented) are preserved.
 */
export function withDirection(
  source: string,
  direction: DirectionSetting,
): string {
  if (direction === "auto") return source;
  const stripped = source.replace(/^direction\s*:[^\n]*\n?/m, "");
  return `direction: ${direction}\n${stripped}`;
}
