export type VendorId = "aws" | "azure" | "gcp" | "databricks" | "generic";

export type WorkspaceTab =
  | "Overview"
  | "solution"
  | "design"
  | "Discovery"
  | "Problem Framing"
  | "Architecture"
  | "Meeting Prep"
  | "Customer Questions"
  | "Risks and Failure Modes"
  | "Deliverables"
  | "Executive Summary"
  | "SA Toolkit";
export type BoardView = "executive" | "technical" | "dataflow" | "aiflow";

export interface IconDefinition {
  id: string;
  label: string;
  vendor: VendorId;
  category: string;
  service: string;
  keywords: string[];
  assetPath: string;
  fallbackAssetPath: string;
  description: string;
}

export interface ArchitectureNodeSpec {
  id: string;
  label: string;
  iconId: string;
  vendor: VendorId;
  notes: string;
  x: number;
  y: number;
  lane?: string | null;
  metadata?: Record<string, string> | null;
}

export interface ArchitectureEdgeSpec {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol?: string | null;
}

export interface ArchitectureSection {
  title: string;
  body: string;
}

export interface ArchitectureOption {
  name: string;
  summary: string;
  whenToUse: string[];
  benefits: string[];
  tradeoffs: string[];
  idealMaturityLevel: string;
  platformMapping: string[];
  components: {
    layer: string;
    items: string[];
  }[];
  talkTrack: string[];
}

export interface ArchitectureSpec {
  title: string;
  summary: string;
  solutionOverview: string;
  assumptions: string[];
  details: ArchitectureSection[];
  nodes: ArchitectureNodeSpec[];
  edges: ArchitectureEdgeSpec[];
  refinements: string[];
  architectureOptions?: ArchitectureOption[] | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface DiscoveryQuestion {
  category: string;
  question: string;
  whyItMatters: string;
  goodSignal: string;
  redFlag: string;
}

export interface ProblemFraming {
  statement: string;
  desiredOutcomes: string[];
  assumptions: string[];
  nonNegotiables: string[];
  unknowns: string[];
  framingStatement: string;
}

export interface MockInterviewTurn {
  speaker: "Interviewer" | "Customer" | "Solution Architect";
  text: string;
}

export interface CustomerQuestion {
  question: string;
  bestAnswer: string;
  notes: string;
  weakAnswer?: string | null;
  strongAnswer?: string | null;
}

export interface RiskItem {
  title: string;
  description: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  mitigation: string;
}

export interface DeliverableItem {
  name: string;
  purpose: string;
  outline: string[];
}

export interface ExecutiveSummary {
  sponsorReady: string;
  thirtySecond: string;
  twoMinute: string;
  successIn12Months: string[];
}

export interface ScenarioInput {
  scenarioTitle: string;
  industry: string;
  customerType: string;
  problemStatement: string;
  businessGoals: string;
  constraints: string;
  timeline: string;
  currentState: string;
  desiredFutureState: string;
  stakeholders: string;
  compliance: string[];
  architecturePreference: string;
  outputDepth: string;
}

export interface ScenarioPlaybook {
  scenarioTitle: string;
  scenarioSummary: string;
  businessDrivers: string[];
  constraints: string[];
  recommendedEngagementApproach: string[];
  confidenceRating: number;
  recommendedConversationPath: string[];
  discoveryQuestions: DiscoveryQuestion[];
  problemFraming: ProblemFraming;
  architectureOptions: ArchitectureOption[];
  mockInterview: MockInterviewTurn[];
  customerQuestions: CustomerQuestion[];
  risks: RiskItem[];
  deliverables: DeliverableItem[];
  executiveSummary: ExecutiveSummary;
  meetingChecklist: string[];
  nextSteps: string[];
  whiteboardTalkTrack: string[];
  workshopPlan: string[];
  objections: {
    objection: string;
    response: string;
  }[];
}

export interface SavedScenario {
  id: string;
  title: string;
  input: ScenarioInput;
  architecture: ArchitectureSpec;
  playbook: ScenarioPlaybook;
  updatedAt: string;
}
