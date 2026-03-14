import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { ARCHITECT_TABS } from "../lib/architectFramework";
import { ArchitectTab } from "./ArchitectTab";
import type { ArchitectAnswers, StoryOutput } from "../types/architect";
import type { SavedScenario, ScenarioInput } from "../types/architecture";
import { normalizeArchitecture } from "../lib/architecture";

interface NewScenarioWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (scenario: SavedScenario) => void;
  initialProblemStatement?: string;
}

const INPUT_TABS = ARCHITECT_TABS.filter((t) => t.id !== "STORY");

const defaultInput: ScenarioInput = {
  scenarioTitle: "",
  industry: "",
  customerType: "",
  problemStatement: "",
  businessGoals: "",
  constraints: "",
  timeline: "12 months",
  currentState: "",
  desiredFutureState: "",
  stakeholders: "",
  compliance: [],
  architecturePreference: "Databricks",
  outputDepth: "Executive + Technical"
};

export function NewScenarioWizard({ open, onClose, onSave, initialProblemStatement }: NewScenarioWizardProps) {
  const [step, setStep] = useState(0); // 0 = setup, 1..8 = ARCHITECT tabs, 9 = generate/story
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [answers, setAnswers] = useState<ArchitectAnswers>({});
  const [story, setStory] = useState<StoryOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && initialProblemStatement) {
      const firstLine = initialProblemStatement.split("\n")[0];
      setScenarioTitle(firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine);
      setAnswers({ why_w2: initialProblemStatement });
      setStep(0);
      setStory(null);
    } else if (open && !initialProblemStatement) {
      setStep(0);
      setScenarioTitle("");
      setIndustry("");
      setAnswers({});
      setStory(null);
    }
  }, [open, initialProblemStatement]);

  const TOTAL_STEPS = INPUT_TABS.length + 2; // setup + 8 tabs + story
  const isSetup = step === 0;
  const isStory = step === INPUT_TABS.length + 1;
  const currentTab = !isSetup && !isStory ? INPUT_TABS[step - 1] : null;

  const allQuestionIds = INPUT_TABS.flatMap((t) => t.questions.map((q) => q.id));
  const answeredCount = allQuestionIds.filter((id) => answers[id]?.trim().length > 0).length;

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/studio/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, scenarioInput: { scenarioTitle, industry } })
      });
      if (response.ok) {
        const payload = await response.json() as { story: StoryOutput };
        setStory(payload.story);
      } else {
        throw new Error("API unavailable");
      }
    } catch {
      // Mock story from answers
      const win1 = answers["win_n1"] || answers["win_w1"] || "Enable new capabilities and improved insights";
      setStory({
        strategy: `A governed lakehouse platform strategy for ${scenarioTitle || "the organization"}, delivering analytics modernization with a phased approach to AI readiness.`,
        technology: "Databricks lakehouse with medallion architecture (Bronze/Silver/Gold), Unity Catalog governance, Lakeflow for orchestration, and curated data products for BI, ML, and AI consumption.",
        outcome: win1,
        returnValue: answers["win_w1"] || "Reduced operational overhead, improved decision-making speed, and accelerated AI program readiness.",
        years: answers["goal_o2"] || `The ${scenarioTitle || "platform"} architecture scales incrementally, supporting growing data domains, AI capabilities, and organizational maturity over the long term.`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const input: ScenarioInput = {
      ...defaultInput,
      scenarioTitle: scenarioTitle || "New Scenario",
      industry,
      problemStatement: answers["why_w2"] || "",
      businessGoals: answers["why_w3"] || "",
      constraints: answers["goal_l1"] || "",
      timeline: answers["goal_l2"] || "12 months",
      currentState: answers["flow_f1"] || "",
      desiredFutureState: answers["win_n1"] || "",
      stakeholders: answers["why_h1"] || "",
    };

    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      title: scenarioTitle || "New Scenario",
      input,
      architecture: normalizeArchitecture({
        title: scenarioTitle || "New Scenario",
        summary: answers["goal_g1"] || "",
        solutionOverview: story?.strategy || answers["goal_g1"] || "",
        assumptions: [],
        details: [
          { title: "Architecture Approach", body: story?.technology || answers["flow_o1"] || "" },
          { title: "Key Outcomes", body: story?.outcome || answers["win_n1"] || "" }
        ],
        nodes: [],
        edges: [],
        refinements: []
      }),
      playbook: {
        scenarioTitle: scenarioTitle || "New Scenario",
        scenarioSummary: answers["goal_g1"] || "",
        businessDrivers: answers["why_w1"] ? answers["why_w1"].split(". ").filter(Boolean) : [],
        constraints: answers["goal_l1"] ? answers["goal_l1"].split(". ").filter(Boolean) : [],
        recommendedEngagementApproach: answers["goal_g2"] ? [answers["goal_g2"]] : [],
        confidenceRating: 75,
        recommendedConversationPath: ["Discovery", "Architecture design", "Tradeoffs", "Executive summary"],
        discoveryQuestions: [],
        problemFraming: {
          statement: answers["why_w2"] || "",
          desiredOutcomes: answers["goal_o1"] ? answers["goal_o1"].split(". ").filter(Boolean) : [],
          assumptions: [],
          nonNegotiables: answers["safe_s1"] ? [answers["safe_s1"]] : [],
          unknowns: [],
          framingStatement: answers["goal_g1"] || ""
        },
        architectureOptions: [],
        mockInterview: [],
        customerQuestions: [],
        risks: [],
        deliverables: [],
        executiveSummary: {
          sponsorReady: story?.strategy || "",
          thirtySecond: story?.outcome || "",
          twoMinute: story ? [story.strategy, story.technology, story.outcome].join(" ") : "",
          successIn12Months: answers["goal_o2"] ? answers["goal_o2"].split(". ").filter(Boolean) : []
        },
        meetingChecklist: [],
        nextSteps: [],
        whiteboardTalkTrack: [],
        workshopPlan: [],
        objections: []
      },
      architectAnswers: answers,
      story: story ?? undefined,
      updatedAt: new Date().toISOString()
    };

    onSave(scenario);
    // Reset
    setStep(0);
    setScenarioTitle("");
    setIndustry("");
    setAnswers({});
    setStory(null);
    onClose();
  };

  const progressPct = (step / (TOTAL_STEPS - 1)) * 100;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">New Scenario</p>
                <p className="text-sm font-semibold text-white">{scenarioTitle || "Untitled scenario"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                {["Setup", ...INPUT_TABS.map((t) => t.word), "Story"].map((label, idx) => (
                  <div key={label} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { if (idx <= step || idx === 0) setStep(idx); }}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
                        idx < step ? "bg-emerald-500 text-white" : idx === step ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-slate-500"
                      }`}
                    >
                      {idx < step ? <Check className="h-3 w-3" /> : idx + 1}
                    </button>
                    {idx < INPUT_TABS.length + 1 ? <div className="h-px w-2 bg-white/20" /> : null}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500">{answeredCount} / {allQuestionIds.length} answered</span>
              <button type="button" onClick={onClose} className="rounded-full bg-white/8 p-2 text-slate-400 hover:bg-white/12">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-white/10">
            <motion.div
              className="h-full bg-cyan-500"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {isSetup ? (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8"
                >
                  <div className="w-full max-w-[560px] space-y-6">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Step 1 of {TOTAL_STEPS}</p>
                      <h2 className="mt-1 text-2xl font-bold text-white">Start your scenario</h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Give it a name and we'll walk you through the ARCHITECT framework — WHY through WIN — then generate your full scenario package.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Scenario title</label>
                        <input
                          value={scenarioTitle}
                          onChange={(e) => setScenarioTitle(e.target.value)}
                          placeholder="e.g. Healthcare Data Platform Modernization"
                          className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Industry</label>
                        <input
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g. Healthcare, Life Sciences, Financial Services"
                          className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
                        />
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold text-slate-300">You'll answer questions across:</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {INPUT_TABS.map((t) => (
                          <span key={t.id} className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                            {t.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : isStory ? (
                <motion.div
                  key="story"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
                >
                  <div className="mx-auto w-full max-w-[760px] space-y-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Final Step — T: Two-Minute Summary</p>
                      <h2 className="mt-1 text-2xl font-bold text-white">Generate your STORY</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {answeredCount} of {allQuestionIds.length} questions answered. Generate your executive narrative and save the scenario.
                      </p>
                    </div>

                    {!story ? (
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || answeredCount === 0}
                        className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {isGenerating ? <Activity className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isGenerating ? "Generating..." : "Generate STORY"}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {(["strategy", "technology", "outcome", "returnValue", "years"] as const).map((field) => {
                          const labels: Record<string, string> = { strategy: "Strategy", technology: "Technology", outcome: "Outcomes", returnValue: "Return on Investment", years: "Long-term Vision" };
                          return (
                            <div key={field} className="rounded-[20px] border border-cyan-500/30 bg-cyan-500/5 p-5">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{labels[field]}</p>
                              <textarea
                                value={story[field]}
                                onChange={(e) => setStory((prev) => prev ? { ...prev, [field]: e.target.value } : prev)}
                                rows={3}
                                className="w-full resize-y rounded-[12px] border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-100 outline-none focus:border-cyan-500/50"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : currentTab ? (
                <motion.div
                  key={currentTab.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <ArchitectTab tab={currentTab} answers={answers} onAnswerChange={updateAnswer} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/15 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <p className="text-xs text-slate-600">Step {step + 1} of {TOTAL_STEPS}</p>
            {isStory && story ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                <Check className="h-4 w-4" />
                Save Scenario
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
                disabled={isSetup && !scenarioTitle.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {step === INPUT_TABS.length ? "Go to Story" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
