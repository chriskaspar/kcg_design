import type { ArchitectureSpec, SavedScenario, ScenarioInput, ScenarioPlaybook } from "../types/architecture";
import { normalizeArchitecture } from "./architecture";

export const starterScenarioInput: ScenarioInput = {
  scenarioTitle: "Healthcare analytics modernization and AI readiness",
  industry: "Healthcare",
  customerType: "Provider",
  problemStatement:
    "Large healthcare system wants to modernize enterprise analytics, improve operational reporting, support population health, and prepare for AI over time.",
  businessGoals:
    "Improve reporting trust, reduce data latency, unify clinical and operational data, and establish governance for future AI use cases.",
  constraints:
    "HIPAA, limited platform engineering capacity, existing data silos, mixed vendor estate, and a 12-month executive expectation for visible progress.",
  timeline: "12 months for measurable value, 24 months for broader modernization.",
  currentState:
    "Fragmented EMR extracts, departmental marts, brittle ETL, and inconsistent KPI definitions across finance, operations, and care management.",
  desiredFutureState:
    "A governed, incremental lakehouse-centric data platform with better reporting, reusable data products, and a pathway to AI-enabled use cases.",
  stakeholders:
    "CIO, CMIO, VP Analytics, Population Health leadership, Data governance lead, Security officer, and operations leadership.",
  compliance: ["HIPAA", "HITRUST", "SOC2"],
  architecturePreference: "Databricks",
  outputDepth: "Executive + Technical"
};

export const sampleArchitecture: ArchitectureSpec = normalizeArchitecture({
  title: "Healthcare Data Platform Modernization",
  summary: "A phased analytics and AI-readiness platform for a regulated provider organization.",
  solutionOverview:
    "The recommended design centralizes ingestion, governance, and consumption around a governed lakehouse while preserving a clear path to AI pilots and executive reporting.",
  assumptions: [
    "Epic or another EMR remains the system of record.",
    "Cloud landing zone and identity are already available.",
    "Initial focus is analytics trust and operational reporting before broad AI rollout."
  ],
  details: [
    {
      title: "Phase 1",
      body: "Stand up governed ingestion, a curated enterprise model, and operational dashboards for priority service lines."
    },
    {
      title: "Phase 2",
      body: "Introduce reusable data products, population health cohorts, and AI-ready feature sets with stronger governance controls."
    }
  ],
  nodes: [
    { id: "emr", label: "EMR / Claims / ERP", iconId: "generic-database", vendor: "generic", notes: "Source systems for clinical, operational, and financial data", x: 30, y: 120, lane: "Source Systems" },
    { id: "ingest", label: "Cloud Ingestion", iconId: "gcp-pubsub", vendor: "gcp", notes: "Streaming and batch ingestion for source domains", x: 260, y: 120, lane: "Ingestion" },
    { id: "storage", label: "Landing + Curated Storage", iconId: "gcp-gcs", vendor: "gcp", notes: "Raw and curated zones for governed data products", x: 500, y: 120, lane: "Platform / Processing" },
    { id: "lakehouse", label: "Databricks Lakehouse", iconId: "databricks-lakehouse", vendor: "databricks", notes: "Unified data engineering, analytics, and data science", x: 500, y: 300, lane: "Platform / Processing" },
    { id: "governance", label: "Unity Catalog", iconId: "databricks-governance", vendor: "databricks", notes: "Policy, lineage, and data product governance", x: 750, y: 120, lane: "Governance" },
    { id: "bi", label: "Databricks SQL", iconId: "databricks-sql", vendor: "databricks", notes: "Executive and operational reporting consumption", x: 980, y: 120, lane: "Consumption / AI" },
    { id: "ai", label: "AI Readiness / MLOps", iconId: "databricks-ml", vendor: "databricks", notes: "Future cohorting, summarization, and agent use cases", x: 980, y: 300, lane: "Consumption / AI" }
  ],
  edges: [
    { id: "a1", source: "emr", target: "ingest", label: "Batch + events" },
    { id: "a2", source: "ingest", target: "storage", label: "Raw landing" },
    { id: "a3", source: "storage", target: "lakehouse", label: "Transform + model" },
    { id: "a4", source: "lakehouse", target: "governance", label: "Catalog + policies" },
    { id: "a5", source: "lakehouse", target: "bi", label: "Curated marts" },
    { id: "a6", source: "lakehouse", target: "ai", label: "Features + model data" }
  ],
  architectureOptions: [
    {
      name: "Governed Lakehouse First",
      summary: "Prioritizes data quality, reporting trust, and incremental AI readiness.",
      whenToUse: ["Analytics modernization", "Regulated phased transformation"],
      benefits: ["Clear governance model", "Single analytics foundation", "Good AI runway"],
      tradeoffs: ["Requires platform adoption discipline", "May defer bespoke AI pilots initially"],
      idealMaturityLevel: "Intermediate",
      platformMapping: ["Databricks", "Cloud object storage", "BI tools"],
      components: [
        { layer: "Source systems", items: ["EMR", "Claims", "ERP"] },
        { layer: "Processing", items: ["Ingestion", "Curated models", "Lakehouse"] },
        { layer: "Consumption", items: ["Operational dashboards", "Population health analytics", "AI pilots"] }
      ],
      talkTrack: [
        "Start by fixing trust in enterprise reporting.",
        "Use governance to enable reuse and compliance.",
        "Treat AI as a staged capability built on governed data products."
      ]
    }
  ]
});

export const samplePlaybook: ScenarioPlaybook = {
  scenarioTitle: "Healthcare analytics modernization and AI readiness",
  scenarioSummary:
    "A multi-hospital provider organization needs a governed analytics platform that improves operational reporting today while preparing for future AI use cases such as cohorting, summarization, and service-line insights.",
  businessDrivers: [
    "Improve trust in operational and financial metrics",
    "Support population health and care management analytics",
    "Reduce time to insight for executives and service lines",
    "Create a credible roadmap toward AI without overcommitting early"
  ],
  constraints: [
    "HIPAA and HITRUST obligations",
    "Fragmented source systems and siloed reporting teams",
    "Limited data engineering capacity",
    "Need to show visible value within 12 months"
  ],
  recommendedEngagementApproach: [
    "Lead with discovery around business outcomes and metric trust gaps.",
    "Sequence the conversation from reporting credibility to governed data products and then AI readiness.",
    "Frame AI as a maturity path rather than a day-one big bang."
  ],
  confidenceRating: 84,
  recommendedConversationPath: [
    "Confirm priority business outcomes",
    "Validate current reporting pain and data-product gaps",
    "Align on compliance and governance non-negotiables",
    "Present phased architecture options with tradeoffs"
  ],
  discoveryQuestions: [
    {
      category: "Business outcomes",
      question: "Which metrics currently drive executive decisions, and where do leaders distrust the numbers?",
      whyItMatters: "It anchors the platform around decision quality instead of generic modernization.",
      goodSignal: "The customer can point to a small set of priority KPIs and decision workflows.",
      redFlag: "Every stakeholder has a different definition of success."
    },
    {
      category: "Current state systems",
      question: "What are the primary systems of record for clinical, operational, and financial reporting today?",
      whyItMatters: "Source-of-truth clarity determines ingestion design and data-product scope.",
      goodSignal: "They know core systems and ownership boundaries.",
      redFlag: "There is no clear owner for key extracts or enterprise reporting pipelines."
    },
    {
      category: "AI readiness",
      question: "What AI use cases are leadership asking about, and what level of model risk governance is expected?",
      whyItMatters: "It separates curiosity from fundable and compliant use cases.",
      goodSignal: "They can name 1-2 practical use cases with stakeholders and constraints.",
      redFlag: "Leadership expects GenAI immediately without defined guardrails or data readiness."
    }
  ],
  problemFraming: {
    statement:
      "The customer needs to replace fragmented, low-trust analytics processes with a governed platform that improves reporting reliability and creates a responsible path toward AI.",
    desiredOutcomes: [
      "Reduce manual reporting effort",
      "Improve KPI consistency",
      "Enable governed population health analytics",
      "Prepare trusted data foundations for AI"
    ],
    assumptions: [
      "Initial scope focuses on a small number of high-value domains.",
      "The organization can assign business and technical owners for target data products."
    ],
    nonNegotiables: ["HIPAA-aligned controls", "Role-based access", "Executive-visible value in year one"],
    unknowns: ["Exact source-system extraction maturity", "Data stewardship operating model", "BI tool consolidation appetite"],
    framingStatement:
      "We should treat this as a trust-and-governance modernization journey that delivers better reporting first and uses that foundation to unlock AI safely."
  },
  architectureOptions: sampleArchitecture.architectureOptions ?? [],
  mockInterview: [
    { speaker: "Customer", text: "We want AI, but honestly our reporting foundation is shaky." },
    { speaker: "Solution Architect", text: "That is exactly where I would start. If the data foundation is inconsistent, AI will amplify the wrong signals. Let’s first isolate the reporting decisions that matter most." },
    { speaker: "Customer", text: "Our executives want proof this won’t become another long platform program." },
    { speaker: "Solution Architect", text: "Then the design should be phased around visible business outcomes in the first 6 to 12 months, not a broad technical rewrite." }
  ],
  customerQuestions: [
    {
      question: "Why not just keep adding marts for each department?",
      bestAnswer: "That approach may solve isolated requests quickly, but it increases inconsistency and governance cost over time. A governed shared platform reduces duplication while still supporting domain-specific needs.",
      notes: "Tie back to KPI trust and long-term operating cost.",
      weakAnswer: "Because a modern platform is better.",
      strongAnswer: "Because the customer’s real problem is not just speed; it is conflicting definitions, lineage gaps, and governance overhead."
    }
  ],
  risks: [
    {
      title: "Scope sprawl",
      description: "Too many domains enter phase 1, slowing delivery and reducing credibility.",
      likelihood: "High",
      impact: "High",
      mitigation: "Limit the first wave to a few measurable analytics priorities with named owners."
    },
    {
      title: "Weak governance adoption",
      description: "Technical controls exist but stewardship and access processes remain informal.",
      likelihood: "Medium",
      impact: "High",
      mitigation: "Define governance operating roles and approval paths early in the program."
    }
  ],
  deliverables: [
    {
      name: "Discovery summary",
      purpose: "Align stakeholders on scope, priorities, constraints, and decision criteria.",
      outline: ["Business drivers", "Current-state pain points", "Non-negotiables", "Recommended next decisions"]
    },
    {
      name: "Architecture deck",
      purpose: "Explain phased options, tradeoffs, and the recommended path.",
      outline: ["Executive context", "Target-state design", "Governance model", "Roadmap and success metrics"]
    }
  ],
  executiveSummary: {
    sponsorReady:
      "The organization should fund a phased, governed analytics modernization focused on trusted reporting first, followed by reusable data products and selective AI acceleration.",
    thirtySecond:
      "Fix trust in the analytics foundation first, then use that platform to scale governed AI use cases without adding more reporting sprawl.",
    twoMinute:
      "The recommended path is a phased lakehouse-centered modernization. Start with a small number of high-value operational and population health use cases, establish shared governance and lineage, and then expand into AI where the data is proven and the risk model is clear.",
    successIn12Months: [
      "Priority reports delivered from a governed platform",
      "Common KPI definitions established",
      "Faster turnaround for operational analytics",
      "At least one AI-ready data product prepared"
    ]
  },
  meetingChecklist: [
    "Confirm business sponsor and technical owner",
    "Identify top 5 KPI trust gaps",
    "Validate source systems and data access constraints",
    "Agree on phase 1 scope and success metrics"
  ],
  nextSteps: [
    "Run a current-state discovery workshop",
    "Document target data products and owners",
    "Draft a phase 1 roadmap with platform and governance milestones"
  ],
  whiteboardTalkTrack: [
    "Begin with the left-to-right data movement across business domains.",
    "Pause at the lakehouse layer to explain curation, governance, and reuse.",
    "Close with how dashboards and future AI share the same trusted foundation."
  ],
  workshopPlan: [
    "Executive alignment session",
    "Current-state architecture workshop",
    "Governance operating model working session",
    "Phase 1 roadmap readout"
  ],
  objections: [
    {
      objection: "We have already tried data modernization before.",
      response: "This time the recommendation is deliberately narrower: start with measurable reporting outcomes, explicit governance, and clear phase gates instead of an open-ended platform rewrite."
    }
  ]
};

export const starterScenarios: SavedScenario[] = [
  {
    id: "healthcare-modernization",
    title: "Healthcare data platform modernization + AI readiness",
    input: starterScenarioInput,
    architecture: sampleArchitecture,
    playbook: samplePlaybook,
    updatedAt: new Date("2026-03-13T10:00:00.000Z").toISOString()
  }
];

export const starterScenarioCatalog = [
  "Healthcare data platform modernization + AI readiness",
  "GenAI sales assistant for life sciences",
  "Patient engagement digital platform",
  "RAG assistant for internal policy search",
  "Omics / research platform modernization",
  "Multi-cloud regulated landing zone",
  "Contact center AI transformation",
  "Customer 360 analytics platform",
  "Prior authorization automation",
  "Clinical knowledge assistant"
];
