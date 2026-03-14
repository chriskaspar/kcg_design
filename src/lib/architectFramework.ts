import type { ArchitectTabDefinition } from "../types/architect";

export const ARCHITECT_TABS: ArchitectTabDefinition[] = [
  {
    id: "WHY", word: "WHY", stage: "A — Ask", description: "Understand the business motivation first",
    questions: [
      { id: "why_w1", letter: "W", meaning: "Why", question: "Why is the organization building this system or platform?" },
      { id: "why_w2", letter: "W", meaning: "Why", question: "What business problem are we solving?" },
      { id: "why_w3", letter: "W", meaning: "Why", question: "What triggered this initiative — cost, scale, AI, modernization?" },
      { id: "why_h1", letter: "H", meaning: "Humans", question: "Who are the users or stakeholders?" },
      { id: "why_h2", letter: "H", meaning: "Humans", question: "Who will operate, manage, and consume the system?" },
      { id: "why_h3", letter: "H", meaning: "Humans", question: "Are the consumers analysts, applications, data scientists, or customers?" },
      { id: "why_y1", letter: "Y", meaning: "Yield", question: "What value should the system produce?" },
      { id: "why_y2", letter: "Y", meaning: "Yield", question: "What outcomes or benefits are expected?" },
      { id: "why_y3", letter: "Y", meaning: "Yield", question: "Will it improve speed, reduce cost, enable AI, or create new capabilities?" },
    ]
  },
  {
    id: "GOAL", word: "GOAL", stage: "R — Reframe", description: "Confirm the problem framing",
    questions: [
      { id: "goal_g1", letter: "G", meaning: "Goal", question: "What is the primary objective of the system?" },
      { id: "goal_g2", letter: "G", meaning: "Goal", question: "Is the goal analytics, operational insights, AI enablement, or platform consolidation?" },
      { id: "goal_o1", letter: "O", meaning: "Outcomes", question: "What measurable results are expected?" },
      { id: "goal_o2", letter: "O", meaning: "Outcomes", question: "What should success look like in 6–12 months?" },
      { id: "goal_a1", letter: "A", meaning: "Actors", question: "Which teams or systems participate in the solution?" },
      { id: "goal_a2", letter: "A", meaning: "Actors", question: "Are there domain teams, data teams, or application teams involved?" },
      { id: "goal_l1", letter: "L", meaning: "Limits", question: "What constraints exist?" },
      { id: "goal_l2", letter: "L", meaning: "Limits", question: "Budget, timeline, compliance, or legacy system dependencies?" },
    ]
  },
  {
    id: "SAFE", word: "SAFE", stage: "C — Constraints", description: "Identify key system constraints",
    questions: [
      { id: "safe_s1", letter: "S", meaning: "Security", question: "What security or compliance requirements exist?" },
      { id: "safe_s2", letter: "S", meaning: "Security", question: "Are we dealing with PHI, PII, financial data, or regulated datasets?" },
      { id: "safe_a1", letter: "A", meaning: "Availability", question: "What uptime or reliability requirements exist?" },
      { id: "safe_a2", letter: "A", meaning: "Availability", question: "What are the RTO/RPO expectations?" },
      { id: "safe_f1", letter: "F", meaning: "Functionality", question: "What core capabilities must the system support? Analytics, ML, streaming, APIs?" },
      { id: "safe_e1", letter: "E", meaning: "Efficiency", question: "What scale and performance requirements exist?" },
      { id: "safe_e2", letter: "E", meaning: "Efficiency", question: "Data volume, query performance, concurrency expectations?" },
    ]
  },
  {
    id: "FLOW", word: "FLOW", stage: "H — High-Level Design", description: "Design the architecture flow",
    questions: [
      { id: "flow_f1", letter: "F", meaning: "From", question: "Where does the data originate? Databases, APIs, event streams, files, IoT devices?" },
      { id: "flow_l1", letter: "L", meaning: "Load", question: "How will the system ingest the data? Batch pipelines, CDC pipelines, streaming ingestion?" },
      { id: "flow_o1", letter: "O", meaning: "Organize", question: "How will the data platform organize data? Raw layer → standardized layer → curated data products?" },
      { id: "flow_w1", letter: "W", meaning: "Workloads", question: "What workloads will run on the platform? BI dashboards, ML models, operational applications, AI assistants?" },
    ]
  },
  {
    id: "DATA", word: "DATA", stage: "I — Implementation", description: "Explain the technical implementation",
    questions: [
      { id: "data_d1", letter: "D", meaning: "Data Pipelines", question: "How will ingestion and transformation pipelines work?" },
      { id: "data_d2", letter: "D", meaning: "Data Pipelines", question: "How will we handle schema changes and data quality?" },
      { id: "data_a1", letter: "A", meaning: "Analytics", question: "How will analytics models or semantic layers be designed?" },
      { id: "data_a2", letter: "A", meaning: "Analytics", question: "Will we use dimensional models, aggregates, or serving tables?" },
      { id: "data_t1", letter: "T", meaning: "Training", question: "How will machine learning models be trained and deployed?" },
      { id: "data_t2", letter: "T", meaning: "Training", question: "Where will feature engineering occur?" },
      { id: "data_a3", letter: "A", meaning: "Applications", question: "What AI systems or applications will consume the data?" },
      { id: "data_a4", letter: "A", meaning: "Applications", question: "Are we enabling AI assistants, recommendation engines, or automation?" },
    ]
  },
  {
    id: "FAST", word: "FAST", stage: "T — Tradeoffs", description: "Discuss architectural tradeoffs",
    questions: [
      { id: "fast_f1", letter: "F", meaning: "Flexibility", question: "How flexible should the system be for future changes?" },
      { id: "fast_f2", letter: "F", meaning: "Flexibility", question: "Can domains extend the platform easily?" },
      { id: "fast_a1", letter: "A", meaning: "Accuracy", question: "Are we prioritizing accuracy or faster insights?" },
      { id: "fast_a2", letter: "A", meaning: "Accuracy", question: "Do we allow approximate analytics or require strict consistency?" },
      { id: "fast_s1", letter: "S", meaning: "Simplicity", question: "Can the design be simplified to reduce operational complexity?" },
      { id: "fast_t1", letter: "T", meaning: "Time", question: "What latency requirements exist?" },
      { id: "fast_t2", letter: "T", meaning: "Time", question: "Do we need real-time pipelines or is batch sufficient?" },
    ]
  },
  {
    id: "RUN", word: "RUN", stage: "E — Engineering Ops", description: "Ensure production reliability",
    questions: [
      { id: "run_r1", letter: "R", meaning: "Reliability", question: "How will the system remain reliable under failures?" },
      { id: "run_r2", letter: "R", meaning: "Reliability", question: "What retry mechanisms and redundancy exist?" },
      { id: "run_u1", letter: "U", meaning: "Understanding", question: "How will we monitor and observe system behavior?" },
      { id: "run_u2", letter: "U", meaning: "Understanding", question: "What logging, metrics, and alerts will exist?" },
      { id: "run_n1", letter: "N", meaning: "Network", question: "How will network security, isolation, and access control be enforced?" },
    ]
  },
  {
    id: "WIN", word: "WIN", stage: "C — Customer Success", description: "Measure business success",
    questions: [
      { id: "win_w1", letter: "W", meaning: "Workflow", question: "Will this improve operational workflows or decision-making?" },
      { id: "win_i1", letter: "I", meaning: "Insight", question: "Will users gain faster or better insights from the data?" },
      { id: "win_n1", letter: "N", meaning: "New capabilities", question: "Does this platform enable new capabilities such as AI, ML, or automation?" },
    ]
  },
];

export const STORY_FIELDS = [
  { id: "strategy", label: "Strategy", hint: "What architecture strategy are we proposing?" },
  { id: "technology", label: "Technology", hint: "What technology stack enables the solution?" },
  { id: "outcome", label: "Outcomes", hint: "What measurable results will the organization see?" },
  { id: "returnValue", label: "Return on Investment", hint: "What ROI or business value will the system deliver?" },
  { id: "years", label: "Long-term Vision", hint: "How does this architecture support long-term strategy and growth?" },
];

export const ARCHITECT_TAB_IDS: readonly string[] = ["WHY", "GOAL", "SAFE", "FLOW", "DATA", "FAST", "RUN", "WIN", "STORY"];
