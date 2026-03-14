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
    architectAnswers: {
      why_w1: "Improve trust in operational and financial metrics. Support population health and care management analytics.",
      why_w2: "Large healthcare system wants to modernize enterprise analytics, improve operational reporting, support population health, and prepare for AI over time.",
      why_w3: "Improve reporting trust, reduce data latency, unify clinical and operational data, and establish governance for future AI use cases.",
      why_h1: "CIO, CMIO, VP Analytics, Population Health leadership, Data governance lead, Security officer, and operations leadership.",
      why_h2: "Central enterprise data team with semi-independent domain teams across clinical, operations, and finance.",
      why_h3: "Analytics teams consuming dashboards, data scientists building population health models, and operational leaders needing near-real-time insights.",
      why_y1: "The organization should fund a phased, governed analytics modernization focused on trusted reporting first, followed by reusable data products and selective AI acceleration.",
      why_y2: "Reduce manual reporting effort. Improve KPI consistency. Enable governed population health analytics. Prepare trusted data foundations for AI.",
      why_y3: "Improve speed to insight, reduce platform sprawl cost, enable AI use cases on a governed foundation, and create new population health capabilities.",
      goal_g1: "A governed, incremental lakehouse-centric data platform with better reporting, reusable data products, and a pathway to AI-enabled use cases.",
      goal_g2: "Platform consolidation and analytics modernization, with AI readiness as a staged capability built on governed data.",
      goal_o1: "Priority reports delivered from a governed platform. Common KPI definitions established. Faster operational analytics. At least one AI-ready data product.",
      goal_o2: "In 12 months: priority reporting on governed platform, common KPIs defined, operational analytics faster, one AI-ready data product. In 24 months: broader modernization complete.",
      goal_a1: "CIO, CMIO, VP Analytics, Population Health leadership, Data governance lead, Security officer, and operations leadership.",
      goal_a2: "Central enterprise data platform team with domain-aligned data owners across clinical, operational, and financial domains.",
      goal_l1: "HIPAA and HITRUST obligations. Fragmented source systems and siloed reporting teams. Limited data engineering capacity. Need to show visible value within 12 months.",
      goal_l2: "Timeline: 12 months for measurable value, 24 months for broader modernization. Constraints: HIPAA, limited platform engineering capacity, existing data silos, mixed vendor estate.",
      safe_s1: "HIPAA, HITRUST, and SOC2 compliance required. Audit logging, data lineage, and role-based access controls are mandatory. PHI must be governed with encryption and access boundaries.",
      safe_s2: "Data includes PHI from clinical systems, PII from patient records, and sensitive financial data. HIPAA requires strict access controls, minimum necessary access, and full audit trails.",
      safe_a1: "High availability required for operational dashboards. Reporting systems need 99.9% uptime. Batch pipelines may tolerate maintenance windows.",
      safe_a2: "Operational reporting: near-zero RPO, 1-hour RTO. Batch analytics pipelines: 4-hour RTO acceptable. DR strategy required for critical reporting workloads.",
      safe_f1: "Analytics and BI, population health ML pipelines, operational dashboards, near-real-time feeds for select use cases, and AI-ready feature datasets.",
      safe_e1: "Enterprise scale with ingestion from EMR, claims, and finance systems. Multi-domain concurrent workloads requiring auto-scaling compute.",
      safe_e2: "Dashboard query SLAs of sub-5 seconds. Batch refresh cycles aligned with daily operational reporting needs. Concurrent users across analytics and operations teams.",
      flow_f1: "Fragmented EMR extracts, departmental marts, brittle ETL, and inconsistent KPI definitions across finance, operations, and care management.",
      flow_l1: "Auto Loader for file-based EMR and claims extracts. CDC patterns for operational databases. Selective streaming for ADT events and operational feeds.",
      flow_o1: "Bronze for raw EMR, claims, and ERP data with full lineage. Silver for standardized clinical and operational entities with quality validation. Gold for curated population health, operational, and financial data products.",
      flow_w1: "Enterprise BI dashboards for executive and operational reporting. Population health analytics for care management. ML pipelines for predictive models. Future AI-ready data products.",
      data_d1: "Phase 1: governed ingestion and curated enterprise model for priority service lines. Phase 2: reusable data products, population health cohorts, and AI-ready feature sets.",
      data_d2: "Schema evolution managed via Auto Loader inference. Data quality enforced at Silver with validation expectations. Failed records quarantined for investigation. Lineage tracked across all layers.",
      data_a1: "Silver: conformed clinical and operational models for cross-domain analytics. Gold: dimensional marts for BI and denormalized serving tables for dashboard performance.",
      data_a2: "Dimensional models at Silver for entity consistency. Denormalized aggregates at Gold optimized for dashboard query patterns. Semantic layer ensures consistent KPI definitions.",
      data_t1: "ML models for population health trained on Gold cohort datasets. MLflow for experiment tracking and model governance. Model registry before production deployment.",
      data_t2: "Feature engineering at Silver and Gold using clinical, claims, and operational data. Feature store for reuse across population health and predictive models.",
      data_a3: "Databricks SQL for executive and operational dashboards. AI Readiness / MLOps layer for cohorting, summarization, and future GenAI use cases.",
      data_a4: "Future GenAI assistants for clinical knowledge and policy search. Recommendation engines for care management. Predictive cohorting for population health programs.",
      fast_f1: "Platform designed for incremental domain onboarding. New domains added without disrupting existing consumers. Governance model scales with domain growth.",
      fast_f2: "Domain teams publish curated data products through Unity Catalog with delegated ownership. Self-service consumption within governed boundaries.",
      fast_a1: "HIPAA and HITRUST obligations. Fragmented source systems. Limited engineering capacity. 12-month executive expectation for visible progress.",
      fast_a2: "Strict consistency required for financial and clinical operational reporting. Approximate analytics acceptable for exploratory population health analysis.",
      fast_s1: "Architecture optimizes for operational simplicity. Streaming reserved for high-value use cases. Phased approach prevents over-engineering the platform early.",
      fast_t1: "Daily refresh for most enterprise reporting. Near-real-time for ADT-based operational dashboards where clinical decisions depend on current patient flow.",
      fast_t2: "Batch processing for most analytics workloads. Streaming used selectively for operational dashboards where latency genuinely improves decisions.",
      run_r1: "Scope sprawl: limit phase 1 to measurable priorities with named owners. Governance adoption: define operating roles and approval paths early.",
      run_r2: "Auto Loader retry logic for file ingestion failures. Checkpoint-based recovery for streaming pipelines. Bronze layer enables full reprocessing without source re-extraction.",
      run_u1: "Databricks workflow metrics, job duration, data quality dashboards, and Unity Catalog lineage. Operational health tracked across all ingestion and transformation layers.",
      run_u2: "Alerts on pipeline SLA breaches, data quality threshold violations, and schema drift events. On-call escalation defined for critical reporting workloads.",
      run_n1: "Unity Catalog enforces row-level and column-level security aligned with HIPAA minimum necessary access. Private endpoints for cloud connectivity. Role-based access with MFA.",
      win_w1: "The platform replaces manual, siloed reporting workflows with governed automated pipelines. Operational leaders gain trusted dashboards instead of manual spreadsheet reconciliation.",
      win_i1: "Fix trust in the analytics foundation first, then use that platform to scale governed AI use cases without adding more reporting sprawl.",
      win_n1: "Priority reports delivered from a governed platform. Common KPI definitions established. Faster turnaround for operational analytics. At least one AI-ready data product prepared."
    },
    story: {
      strategy: "A phased governed lakehouse modernization that fixes reporting trust first, then scales to reusable data products and AI readiness on a compliant foundation.",
      technology: "Databricks lakehouse with Bronze/Silver/Gold medallion architecture, Unity Catalog governance, Lakeflow for ingestion and orchestration, Databricks SQL for BI, and MLflow for AI/ML lifecycle management.",
      outcome: "Trusted enterprise analytics, consistent KPI definitions, faster operational reporting, and a governed AI-ready data foundation delivered within 12 months.",
      returnValue: "Reduced manual reporting overhead, lower data platform sprawl costs, improved decision quality for operations and finance, and accelerated AI program readiness.",
      years: "The architecture scales incrementally across domains and business units, supporting population health expansion, GenAI use cases, and cross-organizational analytics as the organization matures."
    },
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
