import { D2 } from "@d2lang/d2";
import type { CompileOptions, Diagram } from "@d2lang/d2";

export type LayoutEngine = "dagre" | "elk" | "tala";

export const LAYOUTS: LayoutEngine[] = ["elk", "dagre", "tala"];

// The WASM/worker instance is expensive to create, so keep a single one for
// the lifetime of the page. `compile()` internally awaits worker readiness.
let instance: D2 | null = null;
function getD2(): D2 {
  if (!instance) instance = new D2();
  return instance;
}

export interface CompileResult {
  diagram: Diagram;
  ms: number;
}

export async function compile(
  source: string,
  layout: LayoutEngine,
): Promise<CompileResult> {
  const d2 = getD2();
  const options: CompileOptions = { layout };
  const t0 = performance.now();
  const res = await d2.compile(source, options);
  return { diagram: res.diagram, ms: performance.now() - t0 };
}

export async function renderSvg(
  source: string,
  layout: LayoutEngine,
): Promise<string> {
  const d2 = getD2();
  const res = await d2.compile(source, { layout });
  return d2.render(res.diagram, { ...res.renderOptions, noXMLTag: true });
}
