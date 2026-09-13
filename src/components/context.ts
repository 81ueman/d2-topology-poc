import { createContext } from "react";

export interface EdgeRenderState {
  /** Draw every edge as a straight line between node borders. */
  straightEdges: boolean;
  /** IDs of nodes the user dragged away from their D2-layout position. */
  moved: ReadonlySet<string>;
}

export const EdgeRenderContext = createContext<EdgeRenderState>({
  straightEdges: true,
  moved: new Set(),
});
