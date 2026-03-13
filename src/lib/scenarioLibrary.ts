import scenariosMarkdown from "../../scenarios.md?raw";
import type { ArchitectureSpec, SavedScenario, ScenarioInput, ScenarioPlaybook } from "../types/architecture";
import { normalizeArchitecture } from "./architecture";
import { sampleArchitecture, samplePlaybook, starterScenarioInput } from "./mockData";

const cleanLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const sliceBetween = (source: string, start: string, end?: string) => {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) {
    return "";
  }

  const endIndex = end ? source.indexOf(end, startIndex + start.length) : -1;
  return source.slice(startIndex, endIndex > startIndex ? endIndex : undefined);
};

const firstParagraph = (value: string) =>
  value
    .split("\n\n")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .find(Boolean) ?? "";

const extractDialogue = (block: string) => {
  const lines = cleanLines(block);
  const dialogue: { speaker: "Customer" | "Solution Architect"; text: string }[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] === "Scenarioer") {
      dialogue.push({
        speaker: "Customer",
        text: lines[index + 1] ?? ""
      });
    }
    if (lines[index].startsWith("Solution Architect")) {
      dialogue.push({
        speaker: "Solution Architect",
        text: lines[index + 1] ?? ""
      });
    }
  }

  return dialogue;
};

const labelIconMatchers: Array<{ match: RegExp; iconId: string }> = [
  { match: /ehr|emr/i, iconId: "source-ehr" },
  { match: /hl7|adt/i, iconId: "source-hl7" },
  { match: /fhir/i, iconId: "source-fhir" },
  { match: /claims|revenue cycle/i, iconId: "source-claims" },
  { match: /finance|erp/i, iconId: "source-erp" },
  { match: /lab|lims/i, iconId: "source-lab" },
  { match: /imaging/i, iconId: "source-imaging" },
  { match: /polic|documents|notes|manuals|sops|literature/i, iconId: "source-documents" },
  { match: /edc/i, iconId: "source-edc" },
  { match: /ctms/i, iconId: "source-ctms" },
  { match: /central labs/i, iconId: "source-central-labs" },
  { match: /pharmacovigilance|safety/i, iconId: "source-safety" },
  { match: /cro/i, iconId: "source-cro" },
  { match: /genomics|omics|biomarker/i, iconId: "source-omics" },
  { match: /real world data|rwd/i, iconId: "source-rwd" },
  { match: /eligibility|enrollment/i, iconId: "source-eligibility" },
  { match: /prior authorization/i, iconId: "source-prior-auth" },
  { match: /pbm|pharmacy/i, iconId: "source-pbm" },
  { match: /member|provider crm|crm/i, iconId: "source-crm" },
  { match: /social determinants/i, iconId: "source-sdoh" },
  { match: /benchmark/i, iconId: "source-benchmarks" },
  { match: /hospital system/i, iconId: "source-hospital" },
  { match: /universit/i, iconId: "source-university" },
  { match: /public health/i, iconId: "source-public-health" },
  { match: /payer partner/i, iconId: "source-payer-partner" },
  { match: /files|object stores|s3/i, iconId: "source-files" },
  { match: /database|operational db/i, iconId: "source-operational-db" },
  { match: /api/i, iconId: "source-api-systems" },
  { match: /event|kafka|stream/i, iconId: "source-event-streams" },
  { match: /device|telemetry/i, iconId: "source-connected-devices" },
  { match: /manufacturing|mes/i, iconId: "source-manufacturing" },
  { match: /qms|complaint|capa/i, iconId: "source-qms" },
  { match: /clinical studies/i, iconId: "source-clinical-studies" },
  { match: /lab instruments/i, iconId: "source-lab-instruments" },
  { match: /supplier/i, iconId: "source-suppliers" },
  { match: /logistics/i, iconId: "source-logistics" },
  { match: /scientific literature|publications/i, iconId: "source-scientific-literature" },
  { match: /patient support/i, iconId: "source-patient-support" },
  { match: /marketing/i, iconId: "source-marketing" },
  { match: /auto loader/i, iconId: "databricks-data-ingestion" },
  { match: /cdc/i, iconId: "generic-api" },
  { match: /streaming|event processing/i, iconId: "generic-api" },
  { match: /jobs|pipelines|orchestration|lakeflow/i, iconId: "databricks-jobs-pipelines" },
  { match: /bronze|silver|gold/i, iconId: "generic-storage" },
  { match: /unity catalog|governance|lineage|audit/i, iconId: "databricks-governance" },
  { match: /sql|bi|analytics/i, iconId: "databricks-sql" },
  { match: /dashboard|command center|ops/i, iconId: "generic-dashboard" },
  { match: /ml|machine learning|predictive/i, iconId: "databricks-ml" },
  { match: /ai|rag|assistant|genai/i, iconId: "generic-agent" },
  { match: /vector/i, iconId: "generic-knowledgebase" },
  { match: /sharing|share/i, iconId: "generic-api" }
];

const laneName = (value: string) => {
  const lower = value.toLowerCase();
  if (lower.includes("source") || lower.includes("tenant") || lower.includes("organization")) {
    return "Source Systems";
  }
  if (lower.includes("ingestion") || lower.includes("stream") || lower.includes("execution") || lower.includes("onboarding")) {
    return "Ingestion";
  }
  if (lower.includes("governance")) {
    return "Governance";
  }
  if (lower.includes("consumption") || lower.includes("analytics") || lower.includes("ai") || lower.includes("consumer") || lower.includes("apps")) {
    return "Consumption / AI";
  }
  return "Platform / Processing";
};

const iconIdForLabel = (label: string) => labelIconMatchers.find((item) => item.match.test(label))?.iconId;

const parseDiagramArchitecture = (
  title: string,
  block: string,
  architectureSummary: string,
  solutionOverview: string,
  details: { title: string; body: string }[]
): ArchitectureSpec => {
  const flowchartIndex = block.indexOf("flowchart");
  if (flowchartIndex < 0) {
    return normalizeArchitecture({
      ...sampleArchitecture,
      title,
      summary: architectureSummary,
      solutionOverview,
      details
    });
  }

  const lines = block.slice(flowchartIndex).split("\n");
  const nodeLabels = new Map<string, { label: string; lane: string; group: string | null }>();
  const groups = new Map<string, { label: string; members: string[] }>();
  const rawEdges: Array<{ source: string; target: string }> = [];
  let currentGroup: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (!trimmed.startsWith("flowchart") && /^[A-Z][a-z]/.test(trimmed) && !trimmed.startsWith("subgraph")) {
      break;
    }
    const subgraphMatch = trimmed.match(/^subgraph\s+([A-Za-z0-9_]+)(?:\[(.+)\])?/);
    if (subgraphMatch) {
      const groupId = subgraphMatch[1];
      const groupLabel = subgraphMatch[2] ?? groupId;
      currentGroup = groupId;
      groups.set(groupId, { label: groupLabel, members: [] });
      continue;
    }
    if (trimmed === "end") {
      currentGroup = null;
      continue;
    }
    const nodeMatch = trimmed.match(/^([A-Za-z0-9_]+)\[(.+)\]$/);
    if (nodeMatch) {
      const [, nodeId, label] = nodeMatch;
      const lane = currentGroup ? laneName(groups.get(currentGroup)?.label ?? currentGroup) : "Platform / Processing";
      nodeLabels.set(nodeId, { label, lane, group: currentGroup ? groups.get(currentGroup)?.label ?? null : null });
      if (currentGroup) {
        groups.get(currentGroup)?.members.push(nodeId);
      }
      continue;
    }
    const edgeMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*--+>+\s*([A-Za-z0-9_]+)/);
    if (edgeMatch) {
      rawEdges.push({ source: edgeMatch[1], target: edgeMatch[2] });
    }
  }

  const resolvedIds = (id: string) => {
    if (nodeLabels.has(id)) {
      return [id];
    }
    return groups.get(id)?.members ?? [];
  };

  const laneColumns = ["Source Systems", "Ingestion", "Platform / Processing", "Governance", "Consumption / AI"];
  const laneBuckets = laneColumns.reduce<Record<string, string[]>>((acc, lane) => {
    acc[lane] = [];
    return acc;
  }, {});

  for (const [nodeId, node] of nodeLabels.entries()) {
    const lane = laneColumns.includes(node.lane) ? node.lane : "Platform / Processing";
    laneBuckets[lane].push(nodeId);
  }

  const nodes = laneColumns.flatMap((lane, laneIndex) =>
    laneBuckets[lane].map((nodeId, rowIndex) => {
      const node = nodeLabels.get(nodeId)!;
      return {
        id: nodeId.toLowerCase(),
        label: node.label,
        iconId: iconIdForLabel(node.label) ?? "generic-api",
        vendor: "generic" as const,
        notes: node.label,
        lane,
        metadata: node.group ? { group: node.group } : null,
        x: 60 + laneIndex * 280,
        y: 70 + rowIndex * 120
      };
    })
  );

  const edges = rawEdges
    .flatMap((edge, index) => {
      const sources = resolvedIds(edge.source);
      const targets = resolvedIds(edge.target);
      if (!sources.length || !targets.length) {
        return [];
      }

      if (sources.length > 1 && targets.length > 1) {
        return sources.map((source, innerIndex) => ({
          id: `edge_${index + 1}_${innerIndex + 1}`,
          source: source.toLowerCase(),
          target: targets[0].toLowerCase(),
          label: ""
        }));
      }

      if (sources.length > 1) {
        return sources.map((source, innerIndex) => ({
          id: `edge_${index + 1}_${innerIndex + 1}`,
          source: source.toLowerCase(),
          target: targets[0].toLowerCase(),
          label: ""
        }));
      }

      return targets.map((target, innerIndex) => ({
        id: `edge_${index + 1}_${innerIndex + 1}`,
        source: sources[0].toLowerCase(),
        target: target.toLowerCase(),
        label: ""
      }));
    }) as ArchitectureSpec["edges"];

  const fallbackEdges =
    edges.length > 0
      ? edges
      : laneColumns.flatMap((lane, laneIndex) => {
          if (laneIndex === laneColumns.length - 1) {
            return [];
          }
          const currentLaneNodes = laneBuckets[lane];
          const nextLaneFirst = laneBuckets[laneColumns[laneIndex + 1]][0];
          if (!nextLaneFirst) {
            return [];
          }
          return currentLaneNodes.map((nodeId, index) => ({
            id: `fallback_${laneIndex}_${index}`,
            source: nodeId.toLowerCase(),
            target: nextLaneFirst.toLowerCase(),
            label: ""
          }));
        });

  return normalizeArchitecture({
    title,
    summary: architectureSummary,
    solutionOverview,
    details,
    nodes,
    edges: fallbackEdges
  });
};

const createScenarioFromBlock = ({
  id,
  title,
  block,
  discoveryStart,
  architectureStart,
  architectureEnd,
  input,
  architectureSummary,
  solutionOverview,
  details,
  businessDrivers,
  constraints,
  recommendedEngagementApproach,
  recommendedConversationPath,
  discoveryQuestions,
  framingStatement,
  customerQuestions,
  risks,
  deliverables,
  meetingChecklist,
  nextSteps,
  whiteboardTalkTrack,
  workshopPlan,
  objections
}: {
  id: string;
  title: string;
  block: string;
  discoveryStart: string;
  architectureStart: string;
  architectureEnd?: string;
  input: ScenarioInput;
  architectureSummary: string;
  solutionOverview: string;
  details: { title: string; body: string }[];
  businessDrivers: string[];
  constraints: string[];
  recommendedEngagementApproach: string[];
  recommendedConversationPath: string[];
  discoveryQuestions: ScenarioPlaybook["discoveryQuestions"];
  framingStatement: string;
  customerQuestions: ScenarioPlaybook["customerQuestions"];
  risks: ScenarioPlaybook["risks"];
  deliverables: ScenarioPlaybook["deliverables"];
  meetingChecklist: string[];
  nextSteps: string[];
  whiteboardTalkTrack: string[];
  workshopPlan: string[];
  objections: ScenarioPlaybook["objections"];
}): SavedScenario => {
  const discovery = sliceBetween(block, discoveryStart, architectureStart);
  const architectureText = sliceBetween(block, architectureStart, architectureEnd);

  return {
    id,
    title,
    input,
    architecture: parseDiagramArchitecture(title, block, firstParagraph(architectureText) || architectureSummary, solutionOverview, details),
    playbook: {
      ...samplePlaybook,
      scenarioTitle: title,
      scenarioSummary: firstParagraph(block),
      businessDrivers,
      constraints,
      recommendedEngagementApproach,
      recommendedConversationPath,
      discoveryQuestions,
      problemFraming: {
        ...samplePlaybook.problemFraming,
        statement: firstParagraph(discovery) || samplePlaybook.problemFraming.statement,
        framingStatement
      },
      architectureOptions: [
        {
          name: `${title} Architecture`,
          summary: firstParagraph(architectureText) || architectureSummary,
          whenToUse: businessDrivers.slice(0, 3),
          benefits: businessDrivers.slice(0, 3),
          tradeoffs: constraints.slice(0, 3),
          idealMaturityLevel: "Intermediate",
          platformMapping: ["Databricks", "Governed lakehouse", "Curated data products"],
          components: [
            { layer: "Sources", items: businessDrivers.slice(0, 3) },
            { layer: "Platform", items: ["Bronze", "Silver", "Gold", "Governance"] },
            { layer: "Consumption", items: whiteboardTalkTrack.slice(0, 3) }
          ],
          talkTrack: whiteboardTalkTrack
        }
      ],
      mockInterview: extractDialogue(block),
      customerQuestions,
      risks,
      deliverables,
      executiveSummary: {
        ...samplePlaybook.executiveSummary,
        sponsorReady: firstParagraph(sliceBetween(block, "Executive Summary")) || solutionOverview
      },
      meetingChecklist,
      nextSteps,
      whiteboardTalkTrack,
      workshopPlan,
      objections
    },
    updatedAt: new Date("2026-03-13T10:10:00.000Z").toISOString()
  };
};

const createHealthSystemScenario = (): SavedScenario => {
  const block = sliceBetween(
    scenariosMarkdown,
    "Scenario: Unified Data + AI Platform for a Large Integrated Health System",
    "Scenario: Commercial Pharma Omnichannel + AI Platform"
  );
  const discovery = sliceBetween(block, "Part 1: Discovery and Problem Framing", "Part 2: Core Architecture Design");
  const architectureText = sliceBetween(block, "Part 2: Core Architecture Design", "Part 3: Technical Spike Areas");
  const risks = sliceBetween(block, "Technical Spike 4: Operational Reliability / Failure Modes", "Part 4: Close, Tradeoffs, and Executive Summary");
  const close = sliceBetween(block, "Part 4: Close, Tradeoffs, and Executive Summary");

  const input: ScenarioInput = {
    ...starterScenarioInput,
    scenarioTitle: "Unified Data + AI Platform for a Large Integrated Health System"
  };

  const playbook: ScenarioPlaybook = {
    ...samplePlaybook,
    scenarioTitle: input.scenarioTitle,
    scenarioSummary: firstParagraph(block),
    businessDrivers: [
      "Modernize enterprise analytics",
      "Improve operational reporting",
      "Support population health",
      "Prepare for AI / GenAI on a governed foundation"
    ],
    constraints: [
      "HIPAA and PHI handling",
      "Phased migration from a legacy warehouse",
      "Mixed batch and selective near-real-time needs",
      "Central team with semi-independent domains"
    ],
    recommendedEngagementApproach: [
      "Lead with business outcomes and migration posture",
      "Clarify governance and regulated workload boundaries early",
      "Position the platform as a phased strategy, not a warehouse swap"
    ],
    recommendedConversationPath: [
      "Discovery and business goals",
      "Current-state systems and latency needs",
      "Governance and migration strategy",
      "Lakehouse architecture and tradeoffs"
    ],
    discoveryQuestions: [
      {
        category: "Business outcomes",
        question: "What are the top business goals driving the initiative in the first 6 to 12 months?",
        whyItMatters: "Separates short-term value from long-term platform ambition.",
        goodSignal: "Clear prioritization across reporting, operations, and AI readiness.",
        redFlag: "Everything is treated as phase-one critical."
      },
      {
        category: "Current state",
        question: "What systems are already centralized versus fragmented across the estate?",
        whyItMatters: "Defines migration complexity and integration scope.",
        goodSignal: "Known systems, owners, and existing data flows.",
        redFlag: "No clear inventory of source systems or ownership."
      },
      {
        category: "Governance",
        question: "What regulatory and PHI handling boundaries must be enforced from day one?",
        whyItMatters: "Healthcare architecture fails if governance is treated as a later add-on.",
        goodSignal: "Clear HIPAA, auditability, and identity expectations.",
        redFlag: "Security and compliance are still undefined."
      }
    ],
    problemFraming: {
      ...samplePlaybook.problemFraming,
      statement: firstParagraph(discovery) || samplePlaybook.problemFraming.statement,
      framingStatement:
        "This is a governed platform strategy for analytics now and AI later, delivered through a phased migration that protects reporting continuity."
    },
    architectureOptions: samplePlaybook.architectureOptions,
    mockInterview: extractDialogue(block),
    customerQuestions: [
      {
        question: "Why not replace the warehouse all at once?",
        bestAnswer: "A phased coexistence model reduces reporting risk and gives the organization time to validate semantics and operating processes before decommissioning legacy assets.",
        notes: "Anchor on continuity, trust, and operational realism.",
        weakAnswer: null,
        strongAnswer: "Healthcare reporting continuity matters too much for a big-bang cutover unless there is an unusual forcing event."
      }
    ],
    risks: [
      {
        title: "Schema drift and source instability",
        description: firstParagraph(risks),
        likelihood: "Medium",
        impact: "High",
        mitigation: "Preserve raw data in Bronze, track schemas, and avoid fragile point transformations."
      },
      {
        title: "Overbuilding streaming",
        description: "Streaming everywhere adds state and operational complexity where business value may not justify it.",
        likelihood: "Medium",
        impact: "Medium",
        mitigation: "Use streaming only for narrow high-value real-time paths."
      }
    ],
    deliverables: [
      {
        name: "Healthcare platform roadmap",
        purpose: "Phase the migration from foundation to domain onboarding to AI-ready expansion.",
        outline: ["Foundation and governance", "Domain migration waves", "Validation and cutover", "AI enablement backlog"]
      },
      {
        name: "Governed data product catalog",
        purpose: "Define Gold datasets for BI, population health, and AI-ready consumption.",
        outline: ["Data product definitions", "Domain owners", "SLA / refresh model", "Access policies"]
      }
    ],
    executiveSummary: {
      ...samplePlaybook.executiveSummary,
      sponsorReady: firstParagraph(close) || samplePlaybook.executiveSummary.sponsorReady
    },
    meetingChecklist: [
      "Confirm business priorities and timeline",
      "Validate latency by use case",
      "Map governance and PHI boundaries",
      "Agree phased migration approach"
    ],
    nextSteps: [
      "Finalize phase-1 domains",
      "Stand up governance and ingestion standards",
      "Define coexistence and validation plan"
    ],
    whiteboardTalkTrack: [
      "Start at source fragmentation and migration posture",
      "Walk through ingestion and the medallion lifecycle",
      "Close on governance-first consumption and AI readiness"
    ],
    workshopPlan: ["Discovery workshop", "Current-state mapping", "Target architecture review", "Migration planning session"],
    objections: [
      {
        objection: "Why not make everything real-time?",
        response: "Because simplicity and operational discipline matter; streaming should be reserved for the workflows where latency truly changes the business outcome."
      }
    ]
  };

  return {
    id: "health-system-static",
    title: input.scenarioTitle,
    input,
    architecture: parseDiagramArchitecture(
      input.scenarioTitle,
      block,
      firstParagraph(architectureText) || sampleArchitecture.summary,
      "A governed healthcare lakehouse unifies fragmented enterprise sources, supports selective real-time analytics, and creates a phased path toward AI-ready data products.",
      [
        {
          title: "Phased healthcare modernization",
          body: "The architecture supports enterprise analytics, operational reporting, population health, and future AI from one governed platform."
        }
      ]
    ),
    playbook,
    updatedAt: new Date("2026-03-13T10:00:00.000Z").toISOString()
  };
};

const createPharmaScenario = (): SavedScenario => {
  const block = sliceBetween(scenariosMarkdown, "Scenario: Commercial Pharma Omnichannel + AI Platform");
  const discovery = sliceBetween(block, "Part 1 — Discovery & Problem Framing", "Part 2 — Core Architecture Design");
  const architectureText = sliceBetween(block, "Part 2 — Core Architecture Design", "Part 3 — Technical Spike Areas");
  const close = sliceBetween(block, "Part 5 — Executive Summary");

  const input: ScenarioInput = {
    ...starterScenarioInput,
    scenarioTitle: "Commercial Pharma Omnichannel + AI Platform",
    industry: "Life Sciences",
    customerType: "Pharma",
    problemStatement:
      "Global pharmaceutical company wants a unified commercial analytics and AI platform across CRM, prescription data, marketing, and patient support.",
    businessGoals:
      "Create unified HCP and patient insights, support next best action for field reps, improve marketing analytics, and enable a commercial AI assistant."
  };

  const architecture = parseDiagramArchitecture(
    input.scenarioTitle,
    block,
    "Governed commercial analytics and AI platform for pharma omnichannel operations.",
    "The platform unifies CRM, prescription, marketing, patient support, and medical content into a governed lakehouse with curated HCP-centric data products and AI-ready assets.",
    [
      {
        title: "Commercial 360",
        body: "Silver-layer harmonization creates canonical HCP views across CRM, prescription data, marketing, and external sources."
      },
      {
        title: "AI-readiness",
        body: "Gold data products and retrieval-ready document stores support next best action and commercial knowledge assistants."
      }
    ]
  );

  const playbook: ScenarioPlaybook = {
    ...samplePlaybook,
    scenarioTitle: input.scenarioTitle,
    scenarioSummary: firstParagraph(block),
    businessDrivers: [
      "Unified HCP insights",
      "Omnichannel marketing analytics",
      "Next best action for field reps",
      "Commercial AI assistant"
    ],
    constraints: [
      "Promotional and privacy compliance",
      "Multiple commercial data vendors",
      "Need for governed role-based access",
      "Mixed analytics and AI workloads"
    ],
    recommendedEngagementApproach: [
      "Start with commercial outcomes and user personas",
      "Frame customer 360 as a canonical data-product problem",
      "Position AI as grounded on governed data and documents"
    ],
    recommendedConversationPath: [
      "Discovery on outcomes and personas",
      "Unify source systems around HCP identity",
      "Design curated Gold products",
      "Add recommendation and retrieval patterns"
    ],
    discoveryQuestions: [
      {
        category: "Business outcomes",
        question: "Which commercial outcomes matter most in phase one: HCP insight, omnichannel performance, or AI-driven field enablement?",
        whyItMatters: "Sets the initial data-product priorities.",
        goodSignal: "Clear phased business outcomes.",
        redFlag: "No prioritization across analytics and AI asks."
      },
      {
        category: "User personas",
        question: "Who will consume this first: analysts, marketing teams, field reps, or medical teams?",
        whyItMatters: "Consumer needs drive serving model and latency expectations.",
        goodSignal: "Specific user journeys exist.",
        redFlag: "A generic platform request with no user focus."
      },
      {
        category: "Compliance",
        question: "What promotional and access-control boundaries must be enforced across commercial and medical teams?",
        whyItMatters: "Pharma AI and analytics must be tightly governed.",
        goodSignal: "Named policy owners and access rules.",
        redFlag: "Governance is assumed to be solved later."
      }
    ],
    problemFraming: {
      ...samplePlaybook.problemFraming,
      statement: firstParagraph(discovery) || samplePlaybook.problemFraming.statement,
      framingStatement:
        "Treat this as a governed commercial data and AI platform where unified HCP data products enable both analytics and AI-assisted workflows."
    },
    architectureOptions: [
      {
        name: "Commercial Lakehouse Core",
        summary: firstParagraph(architectureText),
        whenToUse: ["Multi-source commercial data unification", "Pharma omnichannel analytics", "AI-assisted field enablement"],
        benefits: ["Canonical HCP view", "Governed Gold data products", "AI-ready architecture"],
        tradeoffs: ["Identity reconciliation complexity", "Strong governance requirements", "Phased adoption needed"],
        idealMaturityLevel: "Intermediate",
        platformMapping: ["CRM", "Prescription data", "Marketing platforms", "Databricks lakehouse"],
        components: [
          { layer: "Sources", items: ["CRM", "Prescription data", "Marketing engagement", "Patient support", "Medical literature"] },
          { layer: "Consumption", items: ["Marketing analytics", "Field insights", "Next best action", "Commercial AI assistant"] }
        ],
        talkTrack: [
          "Anchor on the canonical HCP entity",
          "Explain medallion curation from source noise to reusable products",
          "Show how analytics and AI share the same governed foundation"
        ]
      }
    ],
    mockInterview: extractDialogue(block),
    customerQuestions: [
      {
        question: "How do we create a unified HCP view across all these systems?",
        bestAnswer: "Create a canonical HCP entity in the Silver layer, reconcile provider identifiers across CRM, prescription, marketing, and external data, then expose curated Gold views for analytics and recommendations.",
        notes: "Keep the answer grounded in entity resolution and reusable Gold products.",
        weakAnswer: null,
        strongAnswer: null
      }
    ],
    risks: [
      {
        title: "Identifier inconsistency",
        description: "Commercial vendor and CRM datasets often disagree on provider identity and engagement semantics.",
        likelihood: "High",
        impact: "High",
        mitigation: "Invest in canonical HCP reconciliation and validation in Silver."
      },
      {
        title: "Compliance drift",
        description: "AI assistant behavior or data access may drift outside commercial / medical governance rules.",
        likelihood: "Medium",
        impact: "High",
        mitigation: "Use retrieval-based grounding, role-based access, and policy-driven controls from day one."
      }
    ],
    deliverables: [
      {
        name: "Commercial 360 blueprint",
        purpose: "Define canonical HCP / patient views and the Gold products that expose them.",
        outline: ["Source mapping", "Identity resolution", "Gold data products", "Consumer patterns"]
      },
      {
        name: "AI assistant readiness plan",
        purpose: "Sequence document ingestion, retrieval controls, and AI deployment steps.",
        outline: ["Document inventory", "Access model", "Grounding workflow", "Pilot rollout"]
      }
    ],
    executiveSummary: {
      ...samplePlaybook.executiveSummary,
      sponsorReady: firstParagraph(close) || samplePlaybook.executiveSummary.sponsorReady
    },
    meetingChecklist: [
      "Confirm phase-one commercial outcomes",
      "Validate HCP identity sources",
      "Map compliance and access policies",
      "Prioritize analytics vs assistant pilots"
    ],
    nextSteps: [
      "Define canonical HCP data model",
      "Prioritize Gold data products",
      "Select pilot AI assistant domain"
    ],
    whiteboardTalkTrack: [
      "Start with fragmented commercial systems",
      "Explain the canonical HCP entity and Gold products",
      "Close on recommendation and retrieval-based AI support"
    ],
    workshopPlan: ["Commercial discovery", "Data domain mapping", "AI use-case prioritization", "Target architecture review"],
    objections: [
      {
        objection: "Can the AI assistant answer anything from medical content immediately?",
        response: "Only if it is grounded in governed retrieved content and aligned to access controls; otherwise it becomes a compliance and trust risk."
      }
    ]
  };

  return {
    id: "pharma-static",
    title: input.scenarioTitle,
    input,
    architecture,
    playbook,
    updatedAt: new Date("2026-03-13T10:05:00.000Z").toISOString()
  };
};
const createClinicalTrialsScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "clinical-trials-static",
    title: "Global Clinical Trial Data Platform",
    block: sliceBetween(scenariosMarkdown, "#2", "#3"),
    discoveryStart: "Part 1 — Discovery & Problem Framing",
    architectureStart: "Part 2 — Core Architecture Design",
    architectureEnd: "Part 3 — Technical Spike Areas",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Global Clinical Trial Data Platform",
      industry: "Life Sciences",
      customerType: "Pharma",
      problemStatement: "Unify fragmented clinical trial data across EDC, CTMS, labs, safety systems, CRO data, and research sources.",
      businessGoals: "Improve trial operations, enable cross-study analytics, and prepare for AI-driven clinical insights."
    },
    architectureSummary: "Governed lakehouse for operational, clinical, and research trial data.",
    solutionOverview: "The platform unifies global trial operations, subject data, lab data, safety signals, and research context into governed data products for trial analytics and AI-ready clinical workflows.",
    details: [
      { title: "Cross-study analytics", body: "Curated Gold datasets support trial benchmarking, safety monitoring, and operational performance across programs." },
      { title: "Regulated foundation", body: "Governance, reproducibility, and lineage are established from raw intake through curated analytics." }
    ],
    businessDrivers: ["Improve trial operations", "Enable cross-study analytics", "Support AI-driven research insights"],
    constraints: ["GxP and auditability", "Multiple vendors and CRO partners", "Mixed structured and unstructured research content"],
    recommendedEngagementApproach: ["Start with trial outcomes and user personas", "Clarify authoritative systems by domain", "Frame AI as an extension of trusted trial data products"],
    recommendedConversationPath: ["Business outcomes", "Vendor/source landscape", "Regulatory controls", "Target architecture and phased rollout"],
    discoveryQuestions: [
      { category: "Trial operations", question: "Which operational bottlenecks matter most: enrollment, site performance, safety signal review, or submission readiness?", whyItMatters: "It sets the first data products to prioritize.", goodSignal: "A small set of measurable operational priorities.", redFlag: "Every trial workflow is treated as phase one." },
      { category: "Data sources", question: "Which systems are authoritative for subjects, sites, safety events, and lab data?", whyItMatters: "Defines integration and harmonization scope.", goodSignal: "Known systems and owners by domain.", redFlag: "No clear source-of-truth model." },
      { category: "Compliance", question: "Which reproducibility and audit requirements must be satisfied for regulated analysis outputs?", whyItMatters: "Trial platforms fail if regulated usage is bolted on later.", goodSignal: "Explicit GxP and submission-readiness expectations.", redFlag: "Governance is deferred to later phases." }
    ],
    framingStatement: "Treat this as a governed clinical data product strategy that supports operations now and AI-enabled research over time.",
    customerQuestions: [{ question: "How do we handle vendor schema inconsistency across trials?", bestAnswer: "Preserve raw vendor data in Bronze, then harmonize subject, site, and operational entities in Silver before publishing cross-study Gold products.", notes: "Anchor on replayability and standardization.", weakAnswer: null, strongAnswer: "The key is a reusable harmonization pattern, not one-off fixes per study." }],
    risks: [{ title: "Vendor variability", description: "Clinical vendors often change schemas, delivery patterns, and data quality profiles between studies.", likelihood: "High", impact: "High", mitigation: "Use raw landing, reusable harmonization pipelines, and explicit data contracts where possible." }],
    deliverables: [{ name: "Clinical data harmonization blueprint", purpose: "Define reusable patterns for trial source onboarding and standardized entities.", outline: ["Authoritative systems", "Harmonization layers", "Governance controls", "Gold products"] }],
    meetingChecklist: ["Confirm key trial outcomes", "Map authoritative systems", "Validate GxP needs", "Prioritize first cross-study products"],
    nextSteps: ["Define harmonized trial entities", "Select phase-one studies and vendors", "Stand up governance and quality checks"],
    whiteboardTalkTrack: ["Start with fragmented trial systems", "Explain Bronze-to-Gold harmonization", "Close on cross-study analytics and AI readiness"],
    workshopPlan: ["Clinical discovery", "Source mapping", "Governance review", "Target-state architecture session"],
    objections: [{ objection: "Can we skip the standardization layer and just centralize everything?", response: "That would centralize inconsistency. The real value comes from harmonized cross-study entities and governed Gold products." }]
  });

const createPayerScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "payer-static",
    title: "Global Payer Analytics Platform",
    block: sliceBetween(scenariosMarkdown, "#3", "#4"),
    discoveryStart: "Part 1 — Discovery & Problem Framing",
    architectureStart: "Part 2 — Core Architecture Design",
    architectureEnd: "Part 3 — Technical Spike Areas",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Global Payer Analytics Platform",
      industry: "Healthcare",
      customerType: "Payer",
      problemStatement: "Modernize claims, prior authorization, fraud detection, and population health analytics on a governed platform.",
      businessGoals: "Improve claims analytics, accelerate prior authorization insights, and support fraud and risk models."
    },
    architectureSummary: "Large-scale payer claims and operational analytics platform with AI support.",
    solutionOverview: "The platform standardizes payer claims, eligibility, authorization, and provider datasets into governed Gold products that support reporting, risk analytics, and AI-driven workflows.",
    details: [
      { title: "Claims scale", body: "Partitioned large-scale processing supports claims-heavy workloads without pushing raw data directly into every consumer path." },
      { title: "Operational decisioning", body: "Selective lower-latency patterns support prior auth and fraud workflows while keeping broader analytics simpler." }
    ],
    businessDrivers: ["Claims analytics at scale", "Prior authorization decision support", "Fraud detection and risk scoring"],
    constraints: ["PHI and financial governance", "Billions of records annually", "Mixed batch and lower-latency workloads"],
    recommendedEngagementApproach: ["Start with business outcomes and latency by use case", "Separate reporting workloads from decision-support paths", "Show how ML shares the same governed data foundation"],
    recommendedConversationPath: ["Business priorities", "Claims and operational data landscape", "Latency and governance", "Target architecture and rollout"],
    discoveryQuestions: [
      { category: "Business outcomes", question: "Which business outcomes matter most in phase one: claims insight, fraud detection, or prior authorization improvement?", whyItMatters: "These outcomes drive data product design and latency requirements.", goodSignal: "Clear prioritization of first use cases.", redFlag: "All use cases are treated as equally urgent." },
      { category: "Scale", question: "What are the largest claims and eligibility data flows, and what query patterns drive cost today?", whyItMatters: "Scale problems are often more about layout and serving patterns than raw volume.", goodSignal: "Known high-cost workloads and access patterns.", redFlag: "No visibility into current heavy workloads." },
      { category: "Governance", question: "What PHI and financial access boundaries must hold across analytics and ML use cases?", whyItMatters: "Payer data platforms need governance to be central, not incidental.", goodSignal: "Defined policy owners and access models.", redFlag: "Security and AI usage are still undefined." }
    ],
    framingStatement: "Build a governed payer platform that serves both enterprise analytics and selective operational decision support without fragmenting data and ML into separate silos.",
    customerQuestions: [{ question: "Should prior authorization be fully real-time?", bestAnswer: "Only where the business process truly needs it. Most payer workloads can stay batch-oriented while narrow operational paths use lower-latency patterns.", notes: "Tie architecture to business latency, not trend-following.", weakAnswer: null, strongAnswer: "Streaming everywhere increases cost and operational complexity without changing every decision outcome." }],
    risks: [{ title: "Unbounded real-time scope", description: "Treating all claims and auth workloads as real-time can make the platform expensive and hard to operate.", likelihood: "Medium", impact: "High", mitigation: "Use hybrid batch and low-latency patterns aligned to business need." }],
    deliverables: [{ name: "Payer data product roadmap", purpose: "Sequence claims, authorization, fraud, and population health products into manageable phases.", outline: ["Priority use cases", "Latency tiers", "Governance model", "ML readiness"] }],
    meetingChecklist: ["Prioritize payer use cases", "Validate claims scale drivers", "Define latency tiers", "Confirm governance boundaries"],
    nextSteps: ["Pick phase-one payer products", "Define hybrid serving patterns", "Stand up fraud and auth data readiness"],
    whiteboardTalkTrack: ["Anchor on claims scale", "Explain hybrid batch and lower-latency flows", "Close on analytics plus AI on one governed foundation"],
    workshopPlan: ["Payer discovery", "Scale and latency review", "Governance workshop", "Architecture options review"],
    objections: [{ objection: "Why not keep fraud models separate from analytics?", response: "That recreates silos. Shared governed data products make both reporting and ML more reliable and less duplicative." }]
  });

const createMultiTenantScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "multi-tenant-health-static",
    title: "Multi-Tenant Healthcare Data Platform",
    block: sliceBetween(scenariosMarkdown, "#4", "Scenario: Commercial Pharma Omnichannel + AI Platform"),
    discoveryStart: "Part 1 — Discovery & Problem Framing",
    architectureStart: "Part 2 — Core Architecture Design",
    architectureEnd: "Part 3",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Multi-Tenant Healthcare Data Platform",
      industry: "Healthcare",
      customerType: "Provider",
      problemStatement: "Support multiple hospital systems, payers, and research partners on a shared but governed healthcare platform.",
      businessGoals: "Keep tenant data isolated, enable approved collaboration, and support population health, research, and AI."
    },
    architectureSummary: "Tenant-isolated healthcare collaboration platform with governed shared zones.",
    solutionOverview: "The platform keeps each tenant’s raw and sensitive data isolated while enabling governed shared datasets for research, benchmarking, and approved cross-organization analytics.",
    details: [
      { title: "Tenant isolation", body: "Private data zones preserve tenant separation for raw and sensitive workloads." },
      { title: "Shared collaboration", body: "Curated and de-identified shared datasets support cross-organization analytics under strict governance." }
    ],
    businessDrivers: ["Tenant isolation", "Cross-organization analytics", "Research collaboration and AI readiness"],
    constraints: ["HIPAA compliance", "Multiple organizations", "Petabyte scale and strict governance"],
    recommendedEngagementApproach: ["Clarify the tenant model first", "Define what stays private versus shared", "Align governance ownership early across organizations"],
    recommendedConversationPath: ["Consortium objectives", "Tenant and sharing model", "Governance ownership", "Target architecture and phased onboarding"],
    discoveryQuestions: [
      { category: "Tenant model", question: "What data must remain private by organization, and what can be shared in curated or de-identified forms?", whyItMatters: "This is the core architectural boundary.", goodSignal: "Clear distinction between tenant-private and shared datasets.", redFlag: "Assumption that all data can eventually be shared." },
      { category: "Governance", question: "Who owns cross-organization access policies, approvals, and audit requirements?", whyItMatters: "Multi-tenant platforms fail without a governance operating model.", goodSignal: "Defined governance body and policy path.", redFlag: "No named owner for shared access rules." },
      { category: "Workloads", question: "Which workloads need collaboration first: research, benchmarking, public health, or AI?", whyItMatters: "Shared-zone design should be use-case driven.", goodSignal: "Specific early collaboration scenarios.", redFlag: "A generic platform request with no initial use case." }
    ],
    framingStatement: "Use a two-zone strategy: isolate private tenant data rigorously, then expose only policy-approved shared datasets for collaboration and analytics.",
    customerQuestions: [{ question: "Can we avoid separate tenant zones to simplify the platform?", bestAnswer: "Not if strong isolation is a non-negotiable. Shared collaboration should happen through curated governed datasets, not by collapsing tenant boundaries.", notes: "Keep the tenant model explicit.", weakAnswer: null, strongAnswer: "The architecture has to optimize first for trust and policy enforcement, then for controlled collaboration." }],
    risks: [{ title: "Policy ambiguity", description: "Unclear rules around what can be shared create both delivery delays and compliance risk.", likelihood: "High", impact: "High", mitigation: "Define private/shared data classes and policy owners before broad onboarding." }],
    deliverables: [{ name: "Tenant governance model", purpose: "Define tenant isolation, shared-zone approvals, and operating policies.", outline: ["Private vs shared datasets", "Access controls", "Audit model", "Organization roles"] }],
    meetingChecklist: ["Define tenant boundaries", "Clarify collaboration use cases", "Map governance owners", "Confirm onboarding sequence"],
    nextSteps: ["Document tenant data classes", "Design shared-zone approval workflow", "Select first collaborative use case"],
    whiteboardTalkTrack: ["Start with isolated tenant zones", "Explain curated shared datasets", "Close on governed analytics and AI collaboration"],
    workshopPlan: ["Consortium discovery", "Governance model session", "Reference architecture review", "Phase-one onboarding plan"],
    objections: [{ objection: "Why not share everything and govern later?", response: "Because in a multi-tenant healthcare setting, governance and isolation are the foundation. If that is weak, the whole platform becomes politically and operationally unstable." }]
  });

const createIngestionScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "global-ingestion-static",
    title: "Global Data Ingestion Platform at Extreme Scale",
    block: sliceBetween(scenariosMarkdown, "Sample Scenario #6", "Sample Scenario #7"),
    discoveryStart: "Part 1 — Discovery & Problem Framing",
    architectureStart: "Part 2 — Core Architecture Design",
    architectureEnd: "Part 3 — Technical Spike Areas",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Global Data Ingestion Platform at Extreme Scale",
      industry: "Technology",
      customerType: "Enterprise",
      problemStatement: "Build a Databricks-based ingestion platform for thousands of batch and streaming sources across multiple regions.",
      businessGoals: "Standardize onboarding, improve observability, support downstream analytics and AI, and control cost at scale."
    },
    architectureSummary: "Metadata-driven ingestion platform with regional execution and centralized governance.",
    solutionOverview: "The platform separates onboarding from execution so teams can register sources through opinionated templates while regional ingestion patterns handle batch, CDC, and streaming at scale.",
    details: [
      { title: "Metadata-driven onboarding", body: "Templates and source metadata reduce bespoke pipeline work and improve platform consistency." },
      { title: "Operational reliability", body: "Observability, alerts, retries, and cost monitoring are treated as architectural components, not add-ons." }
    ],
    businessDrivers: ["Standardize source onboarding", "Improve reliability and observability", "Control cost while supporting analytics and AI"],
    constraints: ["Thousands of sources", "Regional residency needs", "Mixed batch and streaming patterns"],
    recommendedEngagementApproach: ["Start with operating model, not tools", "Separate onboarding from execution", "Be explicit about batch vs streaming tradeoffs"],
    recommendedConversationPath: ["Source diversity", "Latency and scale", "Regional constraints", "Onboarding and governance model"],
    discoveryQuestions: [
      { category: "Operating model", question: "Will domain teams self-serve source onboarding, or will a central team own all ingestion pipelines?", whyItMatters: "Platform design changes materially based on ownership.", goodSignal: "A bounded self-service model with standards.", redFlag: "No clear operating model." },
      { category: "Source diversity", question: "What share of sources are files, databases, APIs, and event streams?", whyItMatters: "The supported archetypes should be small and deliberate.", goodSignal: "Known dominant patterns.", redFlag: "Every source is effectively treated as unique." },
      { category: "Regionality", question: "Which datasets must remain in-region, and what can be promoted to shared global views?", whyItMatters: "Residency affects both storage and execution topology.", goodSignal: "Documented residency constraints.", redFlag: "Regional requirements are still vague." }
    ],
    framingStatement: "This is an ingestion-as-a-product problem: standardize onboarding, constrain patterns, and make reliability visible from day one.",
    customerQuestions: [{ question: "Should we make the whole platform streaming-first?", bestAnswer: "No. Streaming should be reserved for use cases where latency changes business value. A hybrid platform is usually more scalable operationally.", notes: "Tie the answer to operational complexity and cost.", weakAnswer: null, strongAnswer: "The right pattern mix matters more than the most fashionable single pattern." }],
    risks: [{ title: "Pattern sprawl", description: "Too many bespoke ingestion patterns make the platform unmanageable and expensive.", likelihood: "High", impact: "High", mitigation: "Limit supported source archetypes and use template-driven onboarding." }],
    deliverables: [{ name: "Ingestion platform operating model", purpose: "Define archetypes, onboarding metadata, observability standards, and ownership expectations.", outline: ["Supported archetypes", "Metadata schema", "SLAs", "Ops dashboards"] }],
    meetingChecklist: ["Clarify platform ownership", "Map source archetypes", "Confirm residency rules", "Prioritize observability requirements"],
    nextSteps: ["Define ingestion templates", "Stand up metadata registry", "Pilot regional onboarding flows"],
    whiteboardTalkTrack: ["Separate onboarding from execution", "Explain hybrid ingestion patterns", "Close on observability and governance"],
    workshopPlan: ["Operating model workshop", "Source archetype review", "Regional architecture session", "Pilot planning"],
    objections: [{ objection: "Why not just let every team build what they need?", response: "At this scale, unconstrained freedom becomes operational chaos. Standardized patterns are the only way the platform remains supportable." }]
  });

const createMedicalDeviceScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "medical-device-static",
    title: "Medical Device / Life Sciences Company",
    block: sliceBetween(scenariosMarkdown, "Sample Scenario #7", "next Sample - need 3 more"),
    discoveryStart: "Part 1 — Discovery & Problem Framing",
    architectureStart: "Part 2 — Core Architecture Design",
    architectureEnd: "Part 3 — Technical Spike Areas",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Medical Device / Life Sciences Company",
      industry: "Life Sciences",
      customerType: "MedTech",
      problemStatement: "Unify connected device telemetry, manufacturing quality, complaints, service, and operational data on a governed platform.",
      businessGoals: "Enable telemetry analytics, complaint trending, field service insights, and AI-ready device intelligence."
    },
    architectureSummary: "Governed medtech lakehouse across telemetry, quality, service, and regulated operational data.",
    solutionOverview: "The platform links device telemetry, manufacturing and quality context, complaint data, and service operations into curated data products that support trending, post-market surveillance, and predictive models.",
    details: [
      { title: "Device context", body: "Telemetry is linked to product, firmware, lot, complaint, and service entities in standardized layers." },
      { title: "Regulated quality workflows", body: "Complaint and quality data are governed more tightly while still feeding broader analytics where appropriate." }
    ],
    businessDrivers: ["Connected device analytics", "Quality and complaint trending", "Field service and AI readiness"],
    constraints: ["Regulated quality systems", "Mixed streaming and operational data", "Traceability across device and complaint contexts"],
    recommendedEngagementApproach: ["Clarify first-phase outcomes across product, quality, and service", "Use telemetry selectively in real-time paths", "Emphasize traceability and governed AI patterns"],
    recommendedConversationPath: ["Business outcomes", "Telemetry and enterprise systems", "Traceability and regulation", "Target architecture"],
    discoveryQuestions: [
      { category: "Phase-one outcomes", question: "Which phase-one outcomes matter most: telemetry analytics, quality visibility, complaint trending, or service optimization?", whyItMatters: "This determines the first linked entities and data products.", goodSignal: "A clear first-phase scope.", redFlag: "Every medtech domain is in phase one." },
      { category: "Entity linkage", question: "How are device, lot, complaint, service, and manufacturing identifiers managed today?", whyItMatters: "Business value depends on strong linkage across these entities.", goodSignal: "Known master keys and ownership.", redFlag: "No reliable way to connect complaint and device context." },
      { category: "Governance", question: "Which complaint, regulatory, and service data need tighter controls than general telemetry analytics?", whyItMatters: "Sensitive and regulated data cannot share one access posture.", goodSignal: "Role-based access expectations are clear.", redFlag: "All data is treated uniformly." }
    ],
    framingStatement: "This should be designed as a governed industrial and life sciences data platform where linked product, quality, and service entities create reusable intelligence.",
    customerQuestions: [{ question: "Do all telemetry consumers need real-time access?", bestAnswer: "No. Real-time ingestion may be useful, but many downstream analytics and quality views can be served via curated micro-batch or batch products.", notes: "Separate ingestion latency from consumer latency.", weakAnswer: null, strongAnswer: "Use streaming where it improves outcomes, not as a blanket pattern." }],
    risks: [{ title: "Weak entity standardization", description: "If device, lot, complaint, and service identifiers are not aligned, the platform loses much of its analytical value.", likelihood: "High", impact: "High", mitigation: "Define canonical linked entities early in Silver and validate them continuously." }],
    deliverables: [{ name: "Device-quality-service model", purpose: "Define the linked entities and curated data products that support complaint, service, and telemetry analytics.", outline: ["Canonical identifiers", "Telemetry model", "Complaint/service linkage", "Gold products"] }],
    meetingChecklist: ["Prioritize medtech outcomes", "Map key identifiers", "Confirm governance differences", "Select telemetry latency tier"],
    nextSteps: ["Define canonical device entities", "Stand up telemetry intake", "Prioritize complaint and service products"],
    whiteboardTalkTrack: ["Start with three data families", "Explain linked standardized entities", "Close on governed analytics and AI support"],
    workshopPlan: ["Medtech discovery", "Entity modeling", "Governance review", "Architecture and rollout"],
    objections: [{ objection: "Can the AI assistant just read all service and regulatory content immediately?", response: "Only if it is grounded in governed content and access controls. Otherwise it becomes a trust and compliance risk." }]
  });

const createHospitalOpsScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "hospital-ops-static",
    title: "Healthcare Provider Real-Time Operational Intelligence Platform",
    block: sliceBetween(scenariosMarkdown, "Sample Scenario #8", "Sample Scenario #9"),
    discoveryStart: "Part 1 — Discovery",
    architectureStart: "Part 2 — Core Architecture",
    architectureEnd: "Technical Spike",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Healthcare Provider Real-Time Operational Intelligence Platform",
      industry: "Healthcare",
      customerType: "Provider",
      problemStatement: "Provide near-real-time visibility into patient flow, ED capacity, OR utilization, staffing, and bed availability.",
      businessGoals: "Improve hospital operations visibility and support command-center style operational analytics."
    },
    architectureSummary: "Event-driven hospital operations analytics platform.",
    solutionOverview: "The platform ingests hospital operational events into governed state tables and Gold metrics that support dashboards, alerts, and predictive operational models.",
    details: [
      { title: "Operational state", body: "Streaming events are transformed into current operational state rather than forcing users to reason over raw events directly." },
      { title: "Mission-critical analytics", body: "The design prioritizes resilience, late-event handling, and clear operational visibility for hospital leadership." }
    ],
    businessDrivers: ["Patient flow visibility", "Capacity and staffing analytics", "Near-real-time hospital operations"],
    constraints: ["Multiple hospital systems", "Late and out-of-order events", "Operational dashboards become mission-critical"],
    recommendedEngagementApproach: ["Define what real-time means first", "Clarify which decisions need low latency", "Focus on operational state, not raw event feeds"],
    recommendedConversationPath: ["Latency and decision needs", "Source systems", "Scope by facility", "Event architecture and monitoring"],
    discoveryQuestions: [
      { category: "Latency", question: "What decisions truly require near-real-time visibility versus minute- or hour-level refresh?", whyItMatters: "It prevents overengineering the operational stack.", goodSignal: "A clear operational latency tier by use case.", redFlag: "Everything is just called real-time." },
      { category: "Sources", question: "Which systems emit the critical patient flow, staffing, and scheduling events?", whyItMatters: "Operational intelligence depends on the right event backbone.", goodSignal: "Known operational systems and events.", redFlag: "No event inventory exists." },
      { category: "Reliability", question: "What happens operationally when a dashboard is delayed or partial?", whyItMatters: "Mission-critical tools need explicit failure handling.", goodSignal: "Clear fallback expectations and ownership.", redFlag: "No operational contingency planning." }
    ],
    framingStatement: "Design this as an event-to-state platform: ingest operational events, reconcile them into trusted state, and expose action-ready metrics.",
    customerQuestions: [{ question: "How do we handle late and out-of-order events?", bestAnswer: "Model state reconciliation based on timestamps and identifiers, and monitor for event delay patterns rather than assuming perfect ordering.", notes: "Keep the answer operational and practical.", weakAnswer: null, strongAnswer: "Late events are normal in hospital systems, so the architecture has to absorb them by design." }],
    risks: [{ title: "State inconsistency", description: "Late or missing operational events can degrade the trust of hospital command-center metrics.", likelihood: "Medium", impact: "High", mitigation: "Use reconciliation logic, monitor delays, and expose freshness indicators." }],
    deliverables: [{ name: "Operational event and state model", purpose: "Define source events, state derivation rules, and Gold metrics for operational dashboards.", outline: ["Event inventory", "State derivation", "Gold metrics", "Operational monitoring"] }],
    meetingChecklist: ["Define real-time by use case", "Map hospital event sources", "Set reliability expectations", "Prioritize first dashboards"],
    nextSteps: ["Model operational state entities", "Pilot late-event reconciliation", "Stand up command-center metrics"],
    whiteboardTalkTrack: ["Start with operational events", "Explain event-to-state derivation", "Close on dashboards, alerts, and predictive operations"],
    workshopPlan: ["Operational discovery", "Source-event review", "Architecture working session", "Pilot planning"],
    objections: [{ objection: "Why not let dashboards read the raw events directly?", response: "Because operational decisions need reconciled state, not raw event streams that are late, duplicated, or out of order." }]
  });

const createRnDScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "pharma-rnd-static",
    title: "Pharma R&D Knowledge and Data Platform",
    block: sliceBetween(scenariosMarkdown, "Sample Scenario #9", "Sample Scenario #10"),
    discoveryStart: "Discovery",
    architectureStart: "Architecture",
    architectureEnd: "Technical Spike",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Pharma R&D Knowledge and Data Platform",
      industry: "Life Sciences",
      customerType: "Pharma",
      problemStatement: "Unify research data, clinical data, publications, scientific literature, lab data, and omics for AI-powered discovery.",
      businessGoals: "Support scientific discovery with governed research data products and grounded AI assistants."
    },
    architectureSummary: "Governed R&D data and knowledge platform with retrieval-based AI.",
    solutionOverview: "The platform unifies structured research and clinical datasets with indexed scientific knowledge so scientists can use analytics, ML, and grounded assistants against trusted content.",
    details: [
      { title: "Research data products", body: "Structured lab, omics, and clinical datasets are standardized into curated research-ready products." },
      { title: "Grounded research AI", body: "Scientific literature and internal documents are indexed for retrieval so AI experiences remain traceable." }
    ],
    businessDrivers: ["Scientific data unification", "Faster knowledge discovery", "Grounded AI for research workflows"],
    constraints: ["Mixed structured and unstructured content", "Research sharing boundaries", "Need for trustworthy AI responses"],
    recommendedEngagementApproach: ["Understand current scientist workflows first", "Differentiate structured data products from knowledge retrieval", "Position AI as grounded on enterprise research assets"],
    recommendedConversationPath: ["Research workflows", "Data and document sources", "Sharing and governance", "Architecture for retrieval and analytics"],
    discoveryQuestions: [
      { category: "Scientist workflow", question: "How do scientists currently find datasets and publications relevant to a research question?", whyItMatters: "The platform should improve real discovery workflows, not just centralize storage.", goodSignal: "Current pain points are clear.", redFlag: "No shared view of how research teams work today." },
      { category: "Content mix", question: "What balance of value comes from structured experimental data versus documents and literature?", whyItMatters: "It shapes the design between lakehouse products and retrieval systems.", goodSignal: "Specific research tasks and source types are known.", redFlag: "All information is treated as the same asset type." },
      { category: "AI trust", question: "What level of traceability and grounding is required for AI-assisted scientific discovery?", whyItMatters: "Research assistants must be evidence-based.", goodSignal: "Traceability expectations are explicit.", redFlag: "The AI requirement is just 'make it smart'." }
    ],
    framingStatement: "This is both a data platform and a knowledge platform: research data products and grounded retrieval need to work together.",
    customerQuestions: [{ question: "How do we reduce hallucinations in a research assistant?", bestAnswer: "Ground responses in retrieved enterprise documents and research data products so answers are traceable to trusted content rather than model memory alone.", notes: "Keep the answer evidence-focused.", weakAnswer: null, strongAnswer: "A research assistant should cite retrieved context, not improvise unsupported scientific claims." }],
    risks: [{ title: "Ungrounded AI outputs", description: "If the assistant is not grounded in enterprise content, scientists will not trust or adopt it.", likelihood: "Medium", impact: "High", mitigation: "Use retrieval, citations, and governance over indexed content." }],
    deliverables: [{ name: "Research knowledge architecture", purpose: "Define how structured data products and indexed scientific content support discovery workflows.", outline: ["Research data products", "Knowledge sources", "Retrieval path", "User workflows"] }],
    meetingChecklist: ["Map scientist workflows", "Inventory structured and unstructured assets", "Define AI trust requirements", "Prioritize first research use case"],
    nextSteps: ["Select initial research domains", "Stand up retrieval index", "Define research-ready Gold products"],
    whiteboardTalkTrack: ["Start with fragmented research assets", "Explain lakehouse plus retrieval", "Close on scientist workflows and grounded AI"],
    workshopPlan: ["Research discovery", "Source inventory", "AI trust session", "Target architecture review"],
    objections: [{ objection: "Why not just use a general-purpose LLM for scientific questions?", response: "Because research decisions need traceable answers grounded in the enterprise’s own trusted data and literature, not generic model recall." }]
  });

const createSupplyChainScenario = (): SavedScenario =>
  createScenarioFromBlock({
    id: "supply-chain-static",
    title: "Global Supply Chain & Manufacturing Intelligence Platform",
    block: sliceBetween(scenariosMarkdown, "Sample Scenario #10", "You Now Have 10 Full Sample Scenarios"),
    discoveryStart: "Discovery",
    architectureStart: "Architecture",
    architectureEnd: "Technical Spike",
    input: {
      ...starterScenarioInput,
      scenarioTitle: "Global Supply Chain & Manufacturing Intelligence Platform",
      industry: "Manufacturing",
      customerType: "Enterprise",
      problemStatement: "Unify manufacturing, quality, logistics, supplier, and ERP data into an intelligent operational platform.",
      businessGoals: "Support operational insight, demand forecasting, inventory optimization, and predictive maintenance."
    },
    architectureSummary: "Unified manufacturing and supply chain intelligence platform.",
    solutionOverview: "The platform integrates ERP, MES, quality, logistics, and supplier data into standardized operational data products that support forecasting, optimization, and predictive maintenance.",
    details: [
      { title: "Operational unification", body: "Manufacturing and supply chain domains are modeled together so leaders can reason across production, inventory, and logistics." },
      { title: "Predictive analytics", body: "Historical telemetry, maintenance, and operational outcomes feed forecasting and predictive maintenance models." }
    ],
    businessDrivers: ["Manufacturing visibility", "Supply chain optimization", "Predictive maintenance and forecasting"],
    constraints: ["Multiple operational domains", "Need for strong lineage", "Mixed analytical and predictive workloads"],
    recommendedEngagementApproach: ["Start with the operational decision chain", "Show cross-domain visibility as the core platform value", "Tie predictive use cases to trusted operational products"],
    recommendedConversationPath: ["Operational priorities", "Domain systems", "Data product design", "Forecasting and predictive architecture"],
    discoveryQuestions: [
      { category: "Operations", question: "Which decisions matter most in phase one: inventory optimization, quality visibility, demand forecasting, or maintenance?", whyItMatters: "This determines the first operational products and metrics.", goodSignal: "Specific initial operational priorities.", redFlag: "A generic wish list with no decision focus." },
      { category: "Systems", question: "Which ERP, manufacturing, quality, and logistics systems are authoritative for each operational domain?", whyItMatters: "Cross-domain intelligence depends on clear source ownership.", goodSignal: "Known system boundaries.", redFlag: "No clear authoritative source map." },
      { category: "Predictive usage", question: "What predictive models are expected first, and what historical signals already exist?", whyItMatters: "Forecasting and maintenance readiness depends on signal quality and history.", goodSignal: "Named predictive use cases and data sources.", redFlag: "Models are expected without source readiness." }
    ],
    framingStatement: "Design a unified operational intelligence platform where governed manufacturing and supply chain products support both daily decisions and predictive models.",
    customerQuestions: [{ question: "How would you support predictive maintenance?", bestAnswer: "Use historical telemetry, maintenance records, and operational outcomes to build engineered features and train models that flag likely failure patterns before they become outages.", notes: "Keep the answer grounded in reusable feature pipelines.", weakAnswer: null, strongAnswer: "Predictive maintenance only works when equipment history, operations, and service outcomes are connected in the data model." }],
    risks: [{ title: "Domain fragmentation", description: "If ERP, manufacturing, quality, and logistics remain modeled independently, the platform cannot support true operational intelligence.", likelihood: "Medium", impact: "High", mitigation: "Define shared operational entities and cross-domain Gold products early." }],
    deliverables: [{ name: "Manufacturing intelligence blueprint", purpose: "Define cross-domain entities, target data products, and predictive model inputs.", outline: ["Authoritative systems", "Operational entities", "Gold products", "Predictive inputs"] }],
    meetingChecklist: ["Prioritize operational decisions", "Map source systems", "Define cross-domain entities", "Select predictive pilot"],
    nextSteps: ["Design operational data products", "Stand up integrated quality and logistics model", "Pilot forecasting or maintenance use case"],
    whiteboardTalkTrack: ["Start with operational domains", "Explain standardized manufacturing products", "Close on forecasting and predictive maintenance"],
    workshopPlan: ["Operational discovery", "Source mapping", "Product modeling", "Predictive use-case session"],
    objections: [{ objection: "Why not build forecasting separately from the platform?", response: "Because forecasting quality depends on trusted integrated operational data. A separate path just recreates siloed logic and inconsistent metrics." }]
  });

export const staticScenarioLibrary: SavedScenario[] = [
  createHealthSystemScenario(),
  createClinicalTrialsScenario(),
  createPayerScenario(),
  createMultiTenantScenario(),
  createPharmaScenario(),
  createIngestionScenario(),
  createMedicalDeviceScenario(),
  createHospitalOpsScenario(),
  createRnDScenario(),
  createSupplyChainScenario()
];
