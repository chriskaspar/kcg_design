import { Download, Map as MapIcon, MoveDiagonal2, Rows3, Text } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";
import { toPng } from "html-to-image";
import "@xyflow/react/dist/style.css";
import type { ArchitectureSpec } from "../types/architecture";
import { getIconById } from "../lib/iconCatalog";

interface DesignCanvasProps {
  architecture: ArchitectureSpec;
  onArchitectureChange: (architecture: ArchitectureSpec) => void;
  compactNodes?: boolean;
  onToggleCompactNodes?: () => void;
  onAutoLayout?: () => void;
}

type CanvasNodeData = {
  label: string;
  notes: string;
  assetPath: string;
  fallbackAssetPath: string;
  compact: boolean;
};

type GroupNodeData = {
  label: string;
};

const NODE_WIDTH = 248;
const NODE_HEIGHT = 98;
const GROUP_PADDING_X = 26;
const GROUP_PADDING_TOP = 42;
const GROUP_PADDING_BOTTOM = 24;

function CanvasNode({ data }: NodeProps<Node<CanvasNodeData>>) {
  return (
    <div className={`relative rounded-2xl border border-slate-200/60 bg-white text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.1)] ${data.compact ? "w-[184px]" : "w-[248px]"}`}>
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-target`}
          id={`${side}-target`}
          type="target"
          position={
            side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left
          }
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-cyan-400/70"
        />
      ))}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-source`}
          id={`${side}-source`}
          type="source"
          position={
            side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left
          }
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400/70"
        />
      ))}
      <div className={`grid gap-3 p-3 ${data.compact ? "grid-cols-[36px_minmax(0,1fr)]" : "grid-cols-[44px_minmax(0,1fr)]"}`}>
        <img
          className={`${data.compact ? "h-9 w-9" : "h-11 w-11"} object-contain`}
          src={data.assetPath}
          alt={data.label}
          onError={(event) => ((event.currentTarget.src = data.fallbackAssetPath))}
        />
        <div className="min-w-0">
          <strong className="block break-words text-sm font-semibold leading-5">{data.label}</strong>
          {!data.compact ? <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{data.notes}</span> : null}
        </div>
      </div>
    </div>
  );
}

function CanvasGroup({ data }: NodeProps<Node<GroupNodeData>>) {
  return (
    <div className="h-full w-full rounded-[28px] border border-dashed border-cyan-300/80 bg-cyan-50/55">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-target`}
          id={`${side}-target`}
          type="target"
          position={
            side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left
          }
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-cyan-400/70"
        />
      ))}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-source`}
          id={`${side}-source`}
          type="source"
          position={
            side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left
          }
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400/70"
        />
      ))}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700">{data.label}</p>
      </div>
    </div>
  );
}

const nodeTypes = {
  architectureNode: CanvasNode,
  architectureGroup: CanvasGroup
};

const preventOverlap = (nodes: ArchitectureSpec["nodes"]) => {
  const adjusted = [...nodes];

  for (let index = 0; index < adjusted.length; index += 1) {
    for (let compareIndex = 0; compareIndex < index; compareIndex += 1) {
      const current = adjusted[index];
      const previous = adjusted[compareIndex];
      const overlapX = Math.abs(current.x - previous.x) < NODE_WIDTH * 0.72;
      const overlapY = Math.abs(current.y - previous.y) < NODE_HEIGHT * 0.82;

      if (overlapX && overlapY) {
        adjusted[index] = {
          ...current,
          x: current.x + 42,
          y: current.y + 54
        };
      }
    }
  }

  return adjusted;
};

const buildGroupLayouts = (nodes: ArchitectureSpec["nodes"]) => {
  const groups = new Map<string, { id: string; x: number; y: number; width: number; height: number; label: string }>();

  Array.from(
    nodes.reduce<Map<string, ArchitectureSpec["nodes"]>>((acc, node) => {
      const group = node.metadata?.group;
      if (!group) {
        return acc;
      }
      acc.set(group, [...(acc.get(group) ?? []), node]);
      return acc;
    }, new Map())
  ).forEach(([group, members]) => {
    const minX = Math.min(...members.map((item) => item.x));
    const minY = Math.min(...members.map((item) => item.y));
    const maxX = Math.max(...members.map((item) => item.x + NODE_WIDTH));
    const maxY = Math.max(...members.map((item) => item.y + NODE_HEIGHT));
    groups.set(group, {
      id: `group_${group.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      label: group,
      x: minX - GROUP_PADDING_X,
      y: minY - GROUP_PADDING_TOP,
      width: maxX - minX + GROUP_PADDING_X * 2,
      height: maxY - minY + GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM
    });
  });

  return groups;
};

const toFlowNode = (
  architectureNode: ArchitectureSpec["nodes"][number],
  compactNodes: boolean,
  groupLayouts: Map<string, { id: string; x: number; y: number }>
): Node<CanvasNodeData> => {
  const icon = getIconById(architectureNode.iconId);
  const group = architectureNode.metadata?.group ? groupLayouts.get(architectureNode.metadata.group) : null;

  return {
    id: architectureNode.id,
    type: "architectureNode",
    position: group
      ? {
          x: architectureNode.x - group.x,
          y: architectureNode.y - group.y
        }
      : { x: architectureNode.x, y: architectureNode.y },
    data: {
      label: architectureNode.label,
      notes: architectureNode.notes,
      assetPath: icon.assetPath,
      fallbackAssetPath: icon.fallbackAssetPath,
      compact: compactNodes
    },
    parentId: group?.id,
    extent: group ? "parent" : undefined,
    draggable: true
  };
};

const toFlowEdge = (architectureEdge: ArchitectureSpec["edges"][number]): Edge => ({
  id: architectureEdge.id,
  source: architectureEdge.source,
  target: architectureEdge.target,
  sourceHandle: "right-source",
  targetHandle: "left-target",
  label: architectureEdge.label,
  type: "smoothstep",
  animated: false,
  style: { stroke: "rgba(148,163,184,0.45)", strokeWidth: 1.5 },
  labelStyle: { fill: "#94a3b8", fontSize: 11 }
});

export function DesignCanvas({
  architecture,
  onArchitectureChange,
  compactNodes = false,
  onToggleCompactNodes,
  onAutoLayout
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [minimapOpen, setMinimapOpen] = useState(true);
  const nonOverlappingNodes = useMemo(() => preventOverlap(architecture.nodes), [architecture.nodes]);
  const groupLayouts = useMemo(() => buildGroupLayouts(nonOverlappingNodes), [nonOverlappingNodes]);
  const flowNodes = useMemo(() => {
    const groupNodes: Node<GroupNodeData>[] = Array.from(groupLayouts.values()).map((group) => ({
      id: group.id,
      type: "architectureGroup",
      position: { x: group.x, y: group.y },
      data: { label: group.label },
      style: { width: group.width, height: group.height, zIndex: 0 },
      draggable: true,
      selectable: true
    }));
    const memberNodes = nonOverlappingNodes.map((node) => toFlowNode(node, compactNodes, groupLayouts));
    return [...groupNodes, ...memberNodes];
  }, [compactNodes, groupLayouts, nonOverlappingNodes]);
  const flowEdges = useMemo(() => architecture.edges.map(toFlowEdge), [architecture.edges]);
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const syncArchitecture = (nextNodes: Node[], nextEdges: Edge[]) => {
    const flowNodeMap = new Map(nextNodes.map((node) => [node.id, node]));
    onArchitectureChange({
      ...architecture,
      nodes: architecture.nodes.map((node) => {
        const flowNode = flowNodeMap.get(node.id);
        return flowNode
          ? {
              ...node,
              x: flowNode.parentId ? (flowNodeMap.get(flowNode.parentId)?.position.x ?? 0) + flowNode.position.x : flowNode.position.x,
              y: flowNode.parentId ? (flowNodeMap.get(flowNode.parentId)?.position.y ?? 0) + flowNode.position.y : flowNode.position.y
            }
          : node;
      }),
      edges: nextEdges.map((edge) => ({
        id: edge.id,
        source: String(edge.source),
        target: String(edge.target),
        label: typeof edge.label === "string" ? edge.label : "",
        protocol: ""
      }))
    });
  };

  const handleConnect = (connection: Connection) => {
    const nextEdges = addEdge(
      {
        ...connection,
        id: `edge_${crypto.randomUUID()}`,
        type: "smoothstep",
        label: "connects",
        style: { stroke: "rgba(148,163,184,0.45)", strokeWidth: 1.5 },
        labelStyle: { fill: "#94a3b8", fontSize: 11 }
      },
      edges
    );
    setEdges(nextEdges);
    syncArchitecture(nodes, nextEdges);
  };

  const handleExport = async () => {
    if (!canvasRef.current) {
      return;
    }

    const dataUrl = await toPng(canvasRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const cls = node.className;
          if (typeof cls === "string" && (cls.includes("react-flow__minimap") || cls.includes("react-flow__controls"))) {
            return false;
          }
        }
        return true;
      }
    });

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${architecture.title.replace(/\s+/g, "-").toLowerCase() || "architecture"}.png`;
    anchor.click();
  };

  const displayTitle = architecture.title || "Visual workspace";

  return (
    <section className="flex h-full min-h-[740px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-slate-900 shadow-[0_24px_72px_rgba(2,6,23,0.35)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Design Board</p>
          <h2 className="max-w-[320px] truncate text-sm font-semibold" title={displayTitle}>{displayTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-400 md:inline-flex">
            <MoveDiagonal2 className="h-3.5 w-3.5" />
            Drag, connect, and drop from toolbox
          </span>
          <button
            type="button"
            onClick={onToggleCompactNodes}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
            title={compactNodes ? "Show node descriptions" : "Hide node descriptions"}
          >
            {compactNodes ? <Text className="h-3.5 w-3.5" /> : <Rows3 className="h-3.5 w-3.5" />}
            {compactNodes ? "Show details" : "Compact"}
          </button>
          <button
            type="button"
            onClick={onAutoLayout}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
            title="Auto layout nodes by lane"
          >
            <MoveDiagonal2 className="h-3.5 w-3.5" />
            Auto layout
          </button>
          <button
            type="button"
            onClick={() => setMinimapOpen((open) => !open)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${minimapOpen ? "bg-white/15 text-slate-200" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}
            title={minimapOpen ? "Hide minimap" : "Show minimap"}
          >
            <MapIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Download className="h-3.5 w-3.5" />
            Export PNG
          </button>
        </div>
      </div>
      <div ref={canvasRef} className="h-full min-w-0 flex-1 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "rgba(148,163,184,0.45)", strokeWidth: 1.5 },
            labelStyle: { fill: "#94a3b8", fontSize: 11 }
          }}
          nodesConnectable
          nodesDraggable
          elementsSelectable
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={(_event, node) => {
            const nextNodes = nodes.map((candidate) => (candidate.id === node.id ? node : candidate));
            syncArchitecture(nextNodes, edges);
          }}
          onConnect={handleConnect}
          fitView
          fitViewOptions={{ padding: 0.16 }}
        >
          {minimapOpen && (
            <MiniMap
              pannable
              zoomable
              nodeColor={() => "#94a3b8"}
              className="!bg-slate-50/90 !border !border-slate-200 !rounded-xl"
            />
          )}
          <Controls />
          <Background gap={24} size={1.2} color="#dbe4ee" />
        </ReactFlow>
      </div>
    </section>
  );
}
