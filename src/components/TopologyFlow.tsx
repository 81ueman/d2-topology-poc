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
import type { Diagram } from "@d2lang/d2";
import D2Node from "./D2Node";
import type { D2NodeData, D2NodeType } from "./D2Node";
import D2Edge from "./D2Edge";
import type { RoutePoint } from "./D2Edge";
import { EdgeRenderContext } from "./context";
import { connectionLabel, isContainerId } from "../d2/model";
import { minimapColor, shapeKind } from "../d2/theme";

const nodeTypes = { d2node: D2Node } as unknown as NodeTypes;
const edgeTypes = { d2: D2Edge } as unknown as EdgeTypes;

function buildNodes(diagram: Diagram): D2NodeType[] {
  const shapes = diagram.shapes ?? [];
  return shapes.map((shape) => {
    const container = isContainerId(shapes, shape.id);
    return {
      id: shape.id,
      type: "d2node",
      position: { x: shape.pos.x, y: shape.pos.y },
      data: { shape, isContainer: container },
      draggable: !container,
      zIndex: container ? 0 : 1,
      style: { width: shape.width, height: shape.height },
    } satisfies D2NodeType;
  });
}

function buildEdges(diagram: Diagram, nodeIds: Set<string>): Edge[] {
  const connections = diagram.connections ?? [];
  return connections
    .filter((c) => nodeIds.has(c.src) && nodeIds.has(c.dst))
    .map((c, i) => {
      const route = (c.route ?? []).filter(Boolean) as RoutePoint[];
      const marker = {
        type: MarkerType.ArrowClosed,
        color: "#64748b",
        width: 16,
        height: 16,
      };
      return {
        id: c.id || `${c.src}->${c.dst}#${i}`,
        source: c.src,
        target: c.dst,
        type: "d2",
        zIndex: 0,
        data: { route, label: connectionLabel(c) },
        markerEnd: c.dstArrow && c.dstArrow !== "none" ? marker : undefined,
        markerStart: c.srcArrow && c.srcArrow !== "none" ? marker : undefined,
      } satisfies Edge;
    });
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

  useEffect(() => {
    if (!diagram) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const built = buildNodes(diagram);
    setNodes(built);
    setEdges(buildEdges(diagram, new Set(built.map((n) => n.id))));
    setMoved(new Set());
  }, [diagram, setNodes, setEdges]);

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

  return (
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
  );
}
