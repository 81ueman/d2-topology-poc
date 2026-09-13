import { useCallback, useEffect, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, EdgeTypes, NodeChange, NodeTypes } from "@xyflow/react";
import type { Diagram, Shape } from "@d2lang/d2";
import D2Node from "./D2Node";
import type { D2NodeData, D2NodeType } from "./D2Node";
import D2Edge from "./D2Edge";
import type { RoutePoint } from "./D2Edge";
import { ContainerContext, EdgeRenderContext } from "./context";
import { connectionLabel, isContainerId } from "../d2/model";
import { minimapColor, shapeKind } from "../d2/theme";

const nodeTypes = { d2node: D2Node } as unknown as NodeTypes;
const edgeTypes = { d2: D2Edge } as unknown as EdgeTypes;

/** Compact size a container shrinks to while collapsed. */
const COLLAPSED_WIDTH = 168;
const COLLAPSED_HEIGHT = 44;

/** Topmost collapsed ancestor of `id`, or null if none is collapsed. */
function collapsedAncestor(
  id: string,
  collapsed: ReadonlySet<string>,
): string | null {
  const parts = id.split(".");
  for (let i = 1; i < parts.length; i++) {
    const ancestor = parts.slice(0, i).join(".");
    if (collapsed.has(ancestor)) return ancestor;
  }
  return null;
}

function descendantCount(shapes: Shape[], id: string): number {
  const prefix = `${id}.`;
  let count = 0;
  for (const shape of shapes) {
    if (shape.id.startsWith(prefix)) count++;
  }
  return count;
}

function buildNodes(
  diagram: Diagram,
  collapsed: ReadonlySet<string>,
): D2NodeType[] {
  const shapes = diagram.shapes ?? [];
  const nodes: D2NodeType[] = [];
  for (const shape of shapes) {
    if (collapsedAncestor(shape.id, collapsed)) continue;
    const container = isContainerId(shapes, shape.id);
    const isCollapsed = container && collapsed.has(shape.id);
    nodes.push({
      id: shape.id,
      type: "d2node",
      position: { x: shape.pos.x, y: shape.pos.y },
      data: {
        shape,
        isContainer: container,
        childCount: container ? descendantCount(shapes, shape.id) : 0,
      },
      draggable: !container,
      zIndex: container ? 0 : 1,
      style: {
        width: isCollapsed ? COLLAPSED_WIDTH : shape.width,
        height: isCollapsed ? COLLAPSED_HEIGHT : shape.height,
      },
    });
  }
  return nodes;
}

function buildEdges(
  diagram: Diagram,
  nodes: D2NodeType[],
  collapsed: ReadonlySet<string>,
): Edge[] {
  const connections = diagram.connections ?? [];
  const visible = new Set(nodes.map((n) => n.id));
  const edges: Edge[] = [];
  const marker = {
    type: MarkerType.ArrowClosed,
    color: "#64748b",
    width: 16,
    height: 16,
  };

  connections.forEach((c, i) => {
    // Re-anchor endpoints hidden by a collapsed container onto that container.
    const src = collapsedAncestor(c.src, collapsed) ?? c.src;
    const dst = collapsedAncestor(c.dst, collapsed) ?? c.dst;
    // Endpoints that differ originally but now meet became internal to a
    // collapsed container. A genuine self-loop (c.src === c.dst) is kept.
    if (src === dst && c.src !== c.dst) return;
    if (!visible.has(src) || !visible.has(dst)) return;

    const rerouted = src !== c.src || dst !== c.dst;
    // Re-anchored edges no longer match the D2 route, so force a straight line.
    const route = rerouted
      ? []
      : ((c.route ?? []).filter(Boolean) as RoutePoint[]);

    edges.push({
      id: c.id || `${c.src}->${c.dst}#${i}`,
      source: src,
      target: dst,
      type: "d2",
      zIndex: 0,
      data: { route, label: connectionLabel(c) },
      markerEnd: c.dstArrow && c.dstArrow !== "none" ? marker : undefined,
      markerStart: c.srcArrow && c.srcArrow !== "none" ? marker : undefined,
    });
  });
  return edges;
}

interface Props {
  diagram: Diagram | null;
  straightEdges: boolean;
  onSelectNode: (node: D2NodeType | null) => void;
  onSelectEdge: (edge: Edge | null) => void;
}

export default function TopologyFlow({
  diagram,
  straightEdges,
  onSelectNode,
  onSelectEdge,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<D2NodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [moved, setMoved] = useState<ReadonlySet<string>>(() => new Set());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!diagram) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const built = buildNodes(diagram, collapsed);
    setNodes(built);
    setEdges(buildEdges(diagram, built, collapsed));
    setMoved(new Set());
  }, [diagram, collapsed, setNodes, setEdges]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange<D2NodeType>[]) => {
      onNodesChange(changes);
      const movedIds = changes
        .filter((c) => c.type === "position")
        .map((c) => c.id);
      if (movedIds.length > 0) {
        setMoved((prev) => {
          const next = new Set(prev);
          for (const id of movedIds) next.add(id);
          return next;
        });
      }
    },
    [onNodesChange],
  );

  // Escape clears the selection (React Flow's own state + the detail panel).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
      setEdges((es) => es.map((ed) => (ed.selected ? { ...ed, selected: false } : ed)));
      onSelectNode(null);
      onSelectEdge(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNodes, setEdges, onSelectNode, onSelectEdge]);

  return (
    <ContainerContext.Provider value={{ collapsed, toggle: toggleCollapse }}>
      <EdgeRenderContext.Provider value={{ straightEdges, moved }}>
        <ReactFlow<D2NodeType, Edge>
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.4 }}
          minZoom={0.05}
          maxZoom={4}
          nodesConnectable={false}
          onlyRenderVisibleElements
          onNodeClick={(_, node) => onSelectNode(node)}
          onEdgeClick={(_, edge) => onSelectEdge(edge)}
          onPaneClick={() => {
            onSelectNode(null);
            onSelectEdge(null);
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1.4}
            color="#1e293b"
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(2, 6, 23, 0.72)"
            style={{ background: "#0b1020" }}
            nodeColor={(n) => {
              const data = n.data as D2NodeData;
              return minimapColor(shapeKind(data.shape.type, data.isContainer));
            }}
          />
        </ReactFlow>
      </EdgeRenderContext.Provider>
    </ContainerContext.Provider>
  );
}
