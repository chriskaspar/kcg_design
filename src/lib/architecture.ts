import type { ArchitectureSpec, ArchitectureNodeSpec, ArchitectureEdgeSpec } from "../types/architecture";
import { getIconById, iconCatalog } from "./iconCatalog";

const findIcon = (label: string, notes: string) => {
  const haystack = `${label} ${notes}`.toLowerCase();
  return (
    iconCatalog.find((icon) => icon.keywords.some((keyword) => haystack.includes(keyword))) ??
    iconCatalog.find((icon) => icon.id === "generic-api")!
  );
};

const spaced = (index: number, total: number) => {
  const columnCount = Math.min(total, 4);
  const row = Math.floor(index / columnCount);
  const column = index % columnCount;
  return { x: 60 + column * 220, y: 60 + row * 160 };
};

export const normalizeArchitecture = (input: Partial<ArchitectureSpec>): ArchitectureSpec => {
  const nodes = (input.nodes ?? []).map<ArchitectureNodeSpec>((node, index, allNodes) => {
    const icon = node.iconId ? getIconById(node.iconId) : findIcon(node.label ?? "", node.notes ?? "");
    const position = Number.isFinite(node.x) && Number.isFinite(node.y) ? { x: node.x, y: node.y } : spaced(index, allNodes.length);

    return {
      id: node.id ?? `node_${index + 1}`,
      label: node.label ?? icon.label,
      iconId: icon.id,
      vendor: node.vendor ?? icon.vendor,
      notes: node.notes ?? icon.description,
      x: position.x,
      y: position.y,
      lane: node.lane ?? "",
      metadata: node.metadata ?? {}
    };
  });

  const edges = (input.edges ?? []).map<ArchitectureEdgeSpec>((edge, index) => ({
    id: edge.id ?? `edge_${index + 1}`,
    source: edge.source ?? nodes[0]?.id ?? "node_1",
    target: edge.target ?? nodes[Math.min(index + 1, nodes.length - 1)]?.id ?? "node_1",
    label: edge.label ?? "",
    protocol: edge.protocol ?? ""
  }));

  return {
    title: input.title?.trim() || "Solution Architecture",
    summary: input.summary?.trim() || "High-level system architecture generated from the request.",
    solutionOverview:
      input.solutionOverview?.trim() ||
      "The solution combines modular services, explicit integrations, and extendable icon mappings to make architecture authoring iterative.",
    assumptions: input.assumptions?.length ? input.assumptions : ["Workload and scale requirements were inferred from the request."],
    details:
      input.details?.length
        ? input.details
        : [
            {
              title: "Design intent",
              body: "This architecture is optimized for clarity first and can be refined through chat or canvas edits."
            }
          ],
    nodes,
    edges,
    refinements: input.refinements?.length ? input.refinements : [],
    architectureOptions: input.architectureOptions?.length ? input.architectureOptions : []
  };
};

export const starterArchitecture = normalizeArchitecture({
  title: "Solution Architect Scenario Studio",
  summary: "Design, refine, and present solution architectures and customer-ready playbooks from a single workspace.",
  solutionOverview:
    "Use the chat bubble to frame a customer scenario, generate a solution playbook, and keep refining the design while the central workspace stays focused on the diagram and narrative.",
  assumptions: [
    "Vendor-specific icons are mapped from the local icon catalog first.",
    "When no exact icon exists, the app falls back to generic service icons."
  ],
  details: [
    {
      title: "Workflow",
      body: "Scenario input -> OpenAI request understanding -> structured JSON for architecture and scenario playbook -> editable visual workspace."
    },
    {
      title: "Editing",
      body: "The canvas supports drag, connect, floating icon panels, and image export while the solution tab stays editable."
    }
  ],
  nodes: [
    { id: "user", label: "Customer Team", iconId: "generic-user", vendor: "generic", notes: "Business, IT, and domain stakeholders", x: 40, y: 160, lane: "Source Systems" },
    { id: "app", label: "Scenario Studio", iconId: "generic-web-app", vendor: "generic", notes: "Workspace for design, narrative, and playbook generation", x: 290, y: 160, lane: "Consumption / AI" },
    { id: "llm", label: "OpenAI Planning", iconId: "generic-ai", vendor: "generic", notes: "Generates architecture JSON and scenario playbooks", x: 560, y: 80, lane: "Consumption / AI" },
    { id: "catalog", label: "Local Icon Library", iconId: "generic-storage", vendor: "generic", notes: "Google Cloud, Databricks, AWS, Azure, and generic icon assets", x: 560, y: 250, lane: "Governance" }
  ],
  edges: [
    { id: "e1", source: "user", target: "app", label: "Describe solution" },
    { id: "e2", source: "app", target: "llm", label: "Parse request" },
    { id: "e3", source: "llm", target: "app", label: "Structured JSON" },
    { id: "e4", source: "catalog", target: "app", label: "Icon lookup" }
  ],
  architectureOptions: [
    {
      name: "Advisory Studio Baseline",
      summary: "A flexible pattern for discovery-led architecture design and meeting prep.",
      whenToUse: ["Early-stage workshops", "Executive discovery and technical solutioning"],
      benefits: ["Fast framing", "Editable output", "Reusable assets"],
      tradeoffs: ["Requires review before executive sharing"],
      idealMaturityLevel: "Emerging",
      platformMapping: ["OpenAI", "React", "Local icon catalog"],
      components: [
        { layer: "Experience", items: ["Scenario chat", "Design workspace", "Solution narrative"] },
        { layer: "Intelligence", items: ["Structured generation", "Mock scenario fallback"] }
      ],
      talkTrack: ["Lead with business context", "Use the diagram to validate assumptions", "Capture next-step deliverables in the scenario tab"]
    }
  ]
});
