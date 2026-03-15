import { z } from "zod";

const architectureOptionSchema = z.object({
  name: z.string(),
  summary: z.string(),
  whenToUse: z.array(z.string()),
  benefits: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  idealMaturityLevel: z.string(),
  platformMapping: z.array(z.string()),
  components: z.array(
    z.object({
      layer: z.string(),
      items: z.array(z.string())
    })
  ),
  talkTrack: z.array(z.string())
});

export const architectureSchema = z.object({
  title: z.string(),
  summary: z.string(),
  solutionOverview: z.string(),
  assumptions: z.array(z.string()),
  details: z.array(
    z.object({
      title: z.string(),
      body: z.string()
    })
  ),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      iconId: z.string(),
      vendor: z.enum(["aws", "azure", "gcp", "databricks", "generic"]),
      notes: z.string(),
      x: z.number(),
      y: z.number(),
      lane: z.string().nullable(),
      metadata: z.record(z.string()).nullable()
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string(),
      protocol: z.string().nullable()
    })
  ),
  refinements: z.array(z.string()),
  architectureOptions: z.array(architectureOptionSchema)
});

export const playbookSchema = z.object({
  scenarioTitle: z.string(),
  scenarioSummary: z.string(),
  businessDrivers: z.array(z.string()),
  constraints: z.array(z.string()),
  recommendedEngagementApproach: z.array(z.string()),
  confidenceRating: z.number(),
  recommendedConversationPath: z.array(z.string()),
  discoveryQuestions: z.array(
    z.object({
      category: z.string(),
      question: z.string(),
      whyItMatters: z.string(),
      goodSignal: z.string(),
      redFlag: z.string()
    })
  ),
  problemFraming: z.object({
    statement: z.string(),
    desiredOutcomes: z.array(z.string()),
    assumptions: z.array(z.string()),
    nonNegotiables: z.array(z.string()),
    unknowns: z.array(z.string()),
    framingStatement: z.string()
  }),
  architectureOptions: z.array(architectureOptionSchema),
  mockInterview: z.array(
    z.object({
      speaker: z.enum(["Interviewer", "Customer", "Solution Architect"]),
      text: z.string()
    })
  ),
  customerQuestions: z.array(
    z.object({
      question: z.string(),
      bestAnswer: z.string(),
      notes: z.string(),
      weakAnswer: z.string().nullable(),
      strongAnswer: z.string().nullable()
    })
  ),
  risks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      likelihood: z.enum(["Low", "Medium", "High"]),
      impact: z.enum(["Low", "Medium", "High"]),
      mitigation: z.string()
    })
  ),
  deliverables: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      outline: z.array(z.string())
    })
  ),
  executiveSummary: z.object({
    sponsorReady: z.string(),
    thirtySecond: z.string(),
    twoMinute: z.string(),
    successIn12Months: z.array(z.string())
  }),
  meetingChecklist: z.array(z.string()),
  nextSteps: z.array(z.string()),
  whiteboardTalkTrack: z.array(z.string()),
  workshopPlan: z.array(z.string()),
  objections: z.array(
    z.object({
      objection: z.string(),
      response: z.string()
    })
  )
});

export const storySchema = z.object({
  strategy: z.string(),
  technology: z.string(),
  outcome: z.string(),
  returnValue: z.string(),
  years: z.string()
});

export const studioResponseSchema = z.object({
  architecture: architectureSchema,
  playbook: playbookSchema,
  story: storySchema.nullable(),
  assistantMessage: z.string()
});

export type StudioResponsePayload = z.infer<typeof studioResponseSchema>;
