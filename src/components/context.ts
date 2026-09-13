import { createContext } from "react";

/**
 * IDs of nodes the user has dragged away from their D2-layout position.
 * Edges touching a moved node re-route live so they keep following it.
 */
export const MovedNodesContext = createContext<ReadonlySet<string>>(new Set());
