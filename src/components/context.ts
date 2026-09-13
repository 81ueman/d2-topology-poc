import { createContext } from "react";

/**
 * When true, edges are drawn as straight live lines between node centers so
 * they follow nodes while dragging. When false, the exact D2 route is used.
 */
export const FreeDragContext = createContext(false);
