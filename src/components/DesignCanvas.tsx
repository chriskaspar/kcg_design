import { Activity, ChevronDown, Download, LayoutGrid, Map as MapIcon, Rows3, SlidersHorizontal, Sparkles, Text } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
  Handle,
  MiniMap,
  NodeResizer,
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
  onGenerateDesign?: () => void;
  isGeneratingDesign?: boolean;
  exportRef?: React.RefObject<(() => Promise<string | null>) | null>;
}

type VisibleAttrs = {
  category: boolean;
  service: boolean;
  notes: boolean;
};

type CanvasNodeData = {
  label: string;
  notes: string;
  assetPath: string;
  fallbackAssetPath: string;
  compact: boolean;
  iconLabel: string;
  iconCategory: string;
  iconService: string;
  iconVendor: string;
  iconDescription: string;
  visibleAttrs: VisibleAttrs;
};

type GroupNodeData = {
  label: string;
};

const NODE_WIDTH = 248;
const NODE_HEIGHT = 98;
const GROUP_PADDING_X = 32;
const GROUP_PADDING_TOP = 52;
const GROUP_PADDING_BOTTOM = 32;

// ── Layout helpers ────────────────────────────────────────────────────────────

type LayoutMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const LAYOUTS: { mode: LayoutMode; label: string; description: string }[] = [
  { mode: 0, label: "Grid 2-col", description: "2-column grid, groups left-to-right" },
  { mode: 1, label: "Grid 3-col", description: "3-column grid, groups left-to-right" },
  { mode: 2, label: "Row per Group", description: "Each group in a single row, stacked vertically" },
  { mode: 3, label: "Column per Group", description: "Each group in a single column, side by side" },
  { mode: 4, label: "Diagonal Flow", description: "Groups offset diagonally for flow diagrams" },
  { mode: 5, label: "Horizontal Layers", description: "Equal-width bands stacked top-to-bottom" },
  { mode: 6, label: "Vertical Layers", description: "Equal-height bands placed side-by-side" },
  { mode: 7, label: "Tier Grid", description: "Groups paired in rows, forms a compact rectangle" }
];

const buildGroupMap = (nodes: ArchitectureSpec["nodes"]) => {
  const groupMap = new Map<string, ArchitectureSpec["nodes"]>();
  const ungrouped: ArchitectureSpec["nodes"] = [];
  for (const n of nodes) {
    const g = n.metadata?.group;
    if (g) groupMap.set(g, [...(groupMap.get(g) ?? []), n]);
    else ungrouped.push(n);
  }
  return { groupMap, ungrouped };
};

/** Re-position all nodes using the given layout mode. Guarantees no group overlap. */
const applyLayout = (mode: LayoutMode, nodes: ArchitectureSpec["nodes"]): ArchitectureSpec["nodes"] => {
  const { groupMap, ungrouped } = buildGroupMap(nodes);
  const result: ArchitectureSpec["nodes"] = [];

  if (mode === 0) {
    // 2-col grid per group, groups L→R
    let gX = 60;
    for (const members of groupMap.values()) {
      const COL_W = 286, ROW_H = 128, COLS = 2;
      members.forEach((n, i) =>
        result.push({ ...n, x: gX + (i % COLS) * COL_W + 28, y: 72 + Math.floor(i / COLS) * ROW_H })
      );
      gX += Math.min(members.length, COLS) * COL_W + 90;
    }
  } else if (mode === 1) {
    // 3-col grid per group, groups L→R
    let gX = 60;
    for (const members of groupMap.values()) {
      const COL_W = 272, ROW_H = 128, COLS = 3;
      members.forEach((n, i) =>
        result.push({ ...n, x: gX + (i % COLS) * COL_W + 28, y: 72 + Math.floor(i / COLS) * ROW_H })
      );
      gX += Math.min(members.length, COLS) * COL_W + 90;
    }
  } else if (mode === 2) {
    // Single row per group, groups stacked vertically
    let gY = 60;
    for (const members of groupMap.values()) {
      members.forEach((n, i) => result.push({ ...n, x: 60 + i * 284, y: gY + 30 }));
      gY += 162;
    }
  } else if (mode === 3) {
    // Single column per group, groups side by side
    let gX = 60;
    for (const members of groupMap.values()) {
      members.forEach((n, i) => result.push({ ...n, x: gX + 28, y: 60 + i * 118 }));
      gX += 314;
    }
  } else if (mode === 4) {
    // Diagonal flow — groups offset diagonally
    let gX = 60, gY = 60;
    for (const members of groupMap.values()) {
      const COL_W = 286, ROW_H = 128, COLS = 2;
      members.forEach((n, i) =>
        result.push({ ...n, x: gX + (i % COLS) * COL_W + 28, y: gY + Math.floor(i / COLS) * ROW_H })
      );
      gX += Math.min(members.length, COLS) * COL_W + 80;
      gY += 60;
    }
  } else if (mode === 5) {
    // Horizontal layers — each group is a uniform full-width band, stacked top-to-bottom.
    // All bands use the same column count so every layer spans the same width → rectangle overall.
    const groups = Array.from(groupMap.values());
    const maxCount = Math.max(1, ...groups.map((m) => m.length));
    const COLS = Math.min(maxCount, 6);
    const COL_W = 280, ROW_H = 130, PAD_X = 48, PAD_Y = 42, LAYER_GAP = 68;
    let gY = 60;
    for (const members of groups) {
      members.forEach((n, i) =>
        result.push({ ...n, x: PAD_X + (i % COLS) * COL_W, y: gY + PAD_Y + Math.floor(i / COLS) * ROW_H })
      );
      const rows = Math.ceil(members.length / COLS);
      gY += PAD_Y * 2 + rows * ROW_H + LAYER_GAP;
    }
  } else if (mode === 6) {
    // Vertical layers — each group is a uniform full-height band, placed side-by-side.
    // All bands use the same row count so every layer spans the same height → rectangle overall.
    const groups = Array.from(groupMap.values());
    const maxCount = Math.max(1, ...groups.map((m) => m.length));
    const ROWS = Math.min(maxCount, 5);
    const COL_W = 280, ROW_H = 122, PAD_X = 42, PAD_Y = 48, LAYER_GAP = 68;
    let gX = 60;
    for (const members of groups) {
      members.forEach((n, i) =>
        result.push({ ...n, x: gX + PAD_X + Math.floor(i / ROWS) * COL_W, y: PAD_Y + (i % ROWS) * ROW_H })
      );
      const cols = Math.ceil(members.length / ROWS);
      gX += PAD_X * 2 + cols * COL_W + LAYER_GAP;
    }
  } else if (mode === 7) {
    // Tier grid — groups arranged two per row; each row is a "tier".
    // Produces a balanced rectangle: pairs of equal-height groups fill each tier.
    const groups = Array.from(groupMap.values());
    const TIER_COLS = 2, NODE_COLS = 3, COL_W = 272, ROW_H = 128, PAD = 38, H_GAP = 68, V_GAP = 72;
    const cellW = PAD * 2 + NODE_COLS * COL_W;
    let tierY = 60;
    for (let t = 0; t < groups.length; t += TIER_COLS) {
      const tierGroups = groups.slice(t, t + TIER_COLS);
      const maxRows = Math.max(...tierGroups.map((m) => Math.ceil(m.length / NODE_COLS)));
      tierGroups.forEach((members, ti) => {
        const gX = 60 + ti * (cellW + H_GAP);
        members.forEach((n, i) =>
          result.push({ ...n, x: gX + PAD + (i % NODE_COLS) * COL_W, y: tierY + PAD + Math.floor(i / NODE_COLS) * ROW_H })
        );
      });
      tierY += PAD * 2 + maxRows * ROW_H + V_GAP;
    }
  }

  ungrouped.forEach((n, i) => result.push({ ...n, x: 60 + i * 284, y: 440 }));
  return result;
};

/** True if any two nodes are within ~50px of each other (indicates JSON-assigned overlaps). */
const hasSignificantOverlaps = (nodes: ArchitectureSpec["nodes"]) => {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.abs(nodes[i].x - nodes[j].x) < 52 && Math.abs(nodes[i].y - nodes[j].y) < 52)
        return true;
    }
  }
  return false;
};

// ── React Flow node/edge builders ─────────────────────────────────────────────

function CanvasNode({ data }: NodeProps<Node<CanvasNodeData>>) {
  const subtitleParts: string[] = [];
  if (data.visibleAttrs.notes) {
    // notes mode: show notes as subtitle
  } else {
    if (data.visibleAttrs.category) subtitleParts.push(data.iconCategory);
    if (data.visibleAttrs.service && data.iconService !== data.iconCategory)
      subtitleParts.push(data.iconService);
  }
  const subtitle = data.visibleAttrs.notes ? data.notes : subtitleParts.join(" · ");

  return (
    <div
      className={`group/node relative rounded-2xl border border-slate-200/60 bg-white text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.1)] ${data.compact ? "w-[184px]" : "w-[248px]"}`}
    >
      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[9999] w-[230px] -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/node:opacity-100">
        <div className="rounded-xl border border-white/20 bg-slate-900 p-3 shadow-[0_8px_32px_rgba(2,6,23,0.55)]">
          <p className="text-xs font-semibold text-white">{data.iconLabel}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {data.iconCategory} · {data.iconService}
          </p>
          {data.iconDescription && (
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{data.iconDescription}</p>
          )}
          <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-slate-600">{data.iconVendor}</p>
        </div>
      </div>

      {/* Handles */}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-t`}
          id={`${side}-target`}
          type="target"
          position={side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-cyan-400/70"
        />
      ))}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-s`}
          id={`${side}-source`}
          type="source"
          position={side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400/70"
        />
      ))}

      <div
        className={`grid gap-3 p-3 ${data.compact ? "grid-cols-[36px_minmax(0,1fr)]" : "grid-cols-[44px_minmax(0,1fr)]"}`}
      >
        <img
          className={`${data.compact ? "h-9 w-9" : "h-11 w-11"} object-contain`}
          src={data.assetPath}
          alt={data.label}
          onError={(e) => {
            e.currentTarget.src = data.fallbackAssetPath;
          }}
        />
        <div className="min-w-0">
          <strong className="block break-words text-sm font-semibold leading-5">{data.label}</strong>
          {!data.compact && subtitle ? (
            <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{subtitle}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CanvasGroup({ data, selected }: NodeProps<Node<GroupNodeData>>) {
  return (
    <div className="h-full w-full rounded-[28px] border border-dashed border-cyan-300/80 bg-cyan-50/55">
      <NodeResizer
        minWidth={260}
        minHeight={120}
        isVisible={selected}
        lineStyle={{ border: "1.5px dashed #22d3ee" }}
        handleStyle={{ width: 9, height: 9, borderRadius: 4, background: "#22d3ee", border: "2px solid white" }}
      />
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-t`}
          id={`${side}-target`}
          type="target"
          position={side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-cyan-400/70"
        />
      ))}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Handle
          key={`${side}-s`}
          id={`${side}-source`}
          type="source"
          position={side === "top" ? Position.Top : side === "right" ? Position.Right : side === "bottom" ? Position.Bottom : Position.Left}
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

const buildGroupLayouts = (nodes: ArchitectureSpec["nodes"]) => {
  const groups = new Map<string, { id: string; x: number; y: number; width: number; height: number; label: string }>();

  Array.from(
    nodes.reduce<Map<string, ArchitectureSpec["nodes"]>>((acc, node) => {
      const group = node.metadata?.group;
      if (!group) return acc;
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
  groupLayouts: Map<string, { id: string; x: number; y: number }>,
  visibleAttrs: VisibleAttrs
): Node<CanvasNodeData> => {
  const icon = getIconById(architectureNode.iconId);
  const group = architectureNode.metadata?.group ? groupLayouts.get(architectureNode.metadata.group) : null;

  return {
    id: architectureNode.id,
    type: "architectureNode",
    position: group
      ? { x: architectureNode.x - group.x, y: architectureNode.y - group.y }
      : { x: architectureNode.x, y: architectureNode.y },
    data: {
      label: architectureNode.label,
      notes: architectureNode.notes,
      assetPath: icon.assetPath,
      fallbackAssetPath: icon.fallbackAssetPath,
      compact: compactNodes,
      iconLabel: icon.label,
      iconCategory: icon.category,
      iconService: icon.service,
      iconVendor: icon.vendor,
      iconDescription: icon.description,
      visibleAttrs
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DesignCanvas({
  architecture,
  onArchitectureChange,
  compactNodes = false,
  onToggleCompactNodes,
  onGenerateDesign,
  isGeneratingDesign = false,
  exportRef
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const initialLayoutDone = useRef(false);

  const [minimapOpen, setMinimapOpen] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(0);
  const [attrsOpen, setAttrsOpen] = useState(false);
  const [visibleAttrs, setVisibleAttrs] = useState<VisibleAttrs>({
    category: true,
    service: true,
    notes: false
  });

  // Auto-fix overlapping nodes on first mount
  useEffect(() => {
    if (initialLayoutDone.current) return;
    initialLayoutDone.current = true;
    if (architecture.nodes.length > 1 && hasSignificantOverlaps(architecture.nodes)) {
      onArchitectureChange({ ...architecture, nodes: applyLayout(0, architecture.nodes) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire up the export function to the provided ref
  useEffect(() => {
    if (!exportRef) return;
    exportRef.current = async () => {
      if (!canvasRef.current) return null;
      try {
        return await toPng(canvasRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              const cls = node.className;
              if (typeof cls === "string" && (cls.includes("react-flow__minimap") || cls.includes("react-flow__controls")))
                return false;
            }
            return true;
          }
        });
      } catch {
        return null;
      }
    };
    return () => {
      if (exportRef) exportRef.current = null;
    };
  }, [exportRef]);

  const groupLayouts = useMemo(() => buildGroupLayouts(architecture.nodes), [architecture.nodes]);

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
    const memberNodes = architecture.nodes.map((node) => toFlowNode(node, compactNodes, groupLayouts, visibleAttrs));
    return [...groupNodes, ...memberNodes];
  }, [compactNodes, groupLayouts, architecture.nodes, visibleAttrs]);

  const flowEdges = useMemo(() => architecture.edges.map(toFlowEdge), [architecture.edges]);
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);

  const syncArchitecture = (nextNodes: Node[], nextEdges: Edge[]) => {
    const flowNodeMap = new Map(nextNodes.map((node) => [node.id, node]));
    onArchitectureChange({
      ...architecture,
      nodes: architecture.nodes.map((node) => {
        const flowNode = flowNodeMap.get(node.id);
        return flowNode
          ? {
              ...node,
              x: flowNode.parentId
                ? (flowNodeMap.get(flowNode.parentId)?.position.x ?? 0) + flowNode.position.x
                : flowNode.position.x,
              y: flowNode.parentId
                ? (flowNodeMap.get(flowNode.parentId)?.position.y ?? 0) + flowNode.position.y
                : flowNode.position.y
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
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const cls = node.className;
          if (typeof cls === "string" && (cls.includes("react-flow__minimap") || cls.includes("react-flow__controls")))
            return false;
        }
        return true;
      }
    });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${architecture.title.replace(/\s+/g, "-").toLowerCase() || "architecture"}.png`;
    anchor.click();
  };

  const toggleAttr = (key: keyof VisibleAttrs) =>
    setVisibleAttrs((prev) => ({ ...prev, [key]: !prev[key] }));

  const [layoutOpen, setLayoutOpen] = useState(false);

  const displayTitle = architecture.title || "Visual workspace";

  return (
    <section className="flex h-full min-h-[740px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-slate-900 shadow-[0_24px_72px_rgba(2,6,23,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Design Board</p>
          <h2 className="truncate text-xs text-slate-400" title={displayTitle}>{displayTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Compact toggle */}
          <button
            type="button"
            onClick={onToggleCompactNodes}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
            title={compactNodes ? "Show details" : "Compact"}
          >
            {compactNodes ? <Text className="h-3.5 w-3.5" /> : <Rows3 className="h-3.5 w-3.5" />}
          </button>

          {/* Node attribute visibility dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAttrsOpen((o) => !o)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${attrsOpen ? "bg-white/20 text-slate-100" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}
              title="Node attributes"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {attrsOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-[176px] rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-[0_16px_40px_rgba(2,6,23,0.5)]">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Show on node</p>
                {(
                  [
                    { key: "category" as const, label: "Category" },
                    { key: "service" as const, label: "Service" },
                    { key: "notes" as const, label: "Notes (from JSON)" }
                  ] as const
                ).map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 py-1.5">
                    <input
                      type="checkbox"
                      checked={visibleAttrs[key]}
                      onChange={() => toggleAttr(key)}
                      className="h-3.5 w-3.5 rounded accent-cyan-400"
                    />
                    <span className="text-xs text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Layout picker dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLayoutOpen((o) => !o)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${layoutOpen ? "bg-white/20 text-slate-100" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}
              title="Arrange layout"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {layoutOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-[220px] rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-[0_16px_40px_rgba(2,6,23,0.5)]">
                <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Arrange layout</p>
                {LAYOUTS.map(({ mode, label, description }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setLayoutMode(mode);
                      onArchitectureChange({ ...architecture, nodes: applyLayout(mode, architecture.nodes) });
                      setLayoutOpen(false);
                    }}
                    className={`flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-white/10 ${layoutMode === mode ? "bg-white/8 text-cyan-300" : "text-slate-300"}`}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-slate-500">{description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Minimap toggle */}
          <button
            type="button"
            onClick={() => setMinimapOpen((open) => !open)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${minimapOpen ? "bg-white/15 text-slate-200" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}
            title={minimapOpen ? "Hide minimap" : "Show minimap"}
          >
            <MapIcon className="h-3.5 w-3.5" />
          </button>

          {/* Generate Design */}
          <button
            type="button"
            onClick={onGenerateDesign}
            disabled={isGeneratingDesign || !onGenerateDesign}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/25 disabled:opacity-50"
            title={isGeneratingDesign ? "Generating..." : "Generate Design"}
          >
            {isGeneratingDesign ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
            title="Export PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="h-full min-w-0 flex-1 bg-white" onClick={() => setAttrsOpen(false)}>
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
              className="!rounded-xl !border !border-slate-200 !bg-slate-50/90"
            />
          )}
          <Controls />
          <Background gap={24} size={1.2} color="#dbe4ee" />
        </ReactFlow>
      </div>
    </section>
  );
}
