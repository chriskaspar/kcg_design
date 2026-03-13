import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { Activity, ArrowRight, Bot, ClipboardCopy, FileOutput, FolderOpen, Maximize2, Minimize2, Moon, PanelLeftClose, PanelLeftOpen, Save, Search, Sparkles, SunMedium } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DesignCanvas } from "./components/DesignCanvas";
import { normalizeArchitecture, starterArchitecture } from "./lib/architecture";
import { getGroupedIcons, getIconById, iconCatalog } from "./lib/iconCatalog";
import { sampleArchitecture, samplePlaybook, starterScenarioCatalog, starterScenarioInput, starterScenarios } from "./lib/mockData";
import { staticScenarioLibrary } from "./lib/scenarioLibrary";
import type { ArchitectureSpec, ChatMessage, IconDefinition, SavedScenario, ScenarioInput, ScenarioPlaybook, WorkspaceTab } from "./types/architecture";

const storageKey = "solution-architect-scenario-studio";

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content
});

const loadingSteps = [
  "Framing problem...",
  "Generating discovery questions...",
  "Designing architecture options...",
  "Preparing mock interview..."
];

const scenarioSections = [
  "Overview",
  "Discovery",
  "Problem Framing",
  "Architecture",
  "Meeting Prep",
  "Customer Questions",
  "Risks and Failure Modes",
  "Deliverables",
  "Executive Summary",
  "SA Toolkit"
] as const;

const workspaceTabs: WorkspaceTab[] = ["Overview", "solution", "design", ...scenarioSections.filter((item) => item !== "Overview")];

const parseWorkspaceTab = (value: string | null): WorkspaceTab =>
  workspaceTabs.includes((value ?? "") as WorkspaceTab) ? ((value ?? "Overview") as WorkspaceTab) : "Overview";

const readInitialUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    tab: parseWorkspaceTab(params.get("tab")),
    scenario: params.get("scenario") ?? staticScenarioLibrary[0]?.id ?? "",
    services: params.get("services") !== "collapsed",
    servicesExpanded: params.get("servicesExpanded") !== "collapsed",
    compact: params.get("compact") === "true"
  };
};

const initialMessages = [
  createMessage("assistant", "Describe the customer situation or refine the current design. I will update the diagram, narrative, and scenario playbook together.")
];

const createMockResponse = (request: string, scenarioInput: ScenarioInput, currentArchitecture: ArchitectureSpec) => ({
  architecture: normalizeArchitecture({
    ...sampleArchitecture,
    title: scenarioInput.scenarioTitle || currentArchitecture.title || sampleArchitecture.title,
    summary: request ? `${sampleArchitecture.summary} Prompt focus: ${request}` : sampleArchitecture.summary,
    solutionOverview: sampleArchitecture.solutionOverview
  }),
  playbook: {
    ...samplePlaybook,
    scenarioTitle: scenarioInput.scenarioTitle || samplePlaybook.scenarioTitle,
    scenarioSummary: request ? `${samplePlaybook.scenarioSummary} Latest focus: ${request}` : samplePlaybook.scenarioSummary
  },
  assistantMessage: "Scenario playbook refreshed. Review the design board, adjust the narrative, and use the scenario sections to prepare the meeting."
});

const autoLayoutArchitecture = (architecture: ArchitectureSpec): ArchitectureSpec => {
  const laneColumns = ["Source Systems", "Ingestion", "Platform / Processing", "Governance", "Consumption / AI"];
  const grouped = laneColumns.reduce<Record<string, ArchitectureSpec["nodes"]>>((acc, lane) => {
    acc[lane] = [];
    return acc;
  }, {});

  architecture.nodes.forEach((node) => {
    const lane = laneColumns.includes(node.lane ?? "") ? (node.lane as string) : "Platform / Processing";
    grouped[lane].push(node);
  });

  const nodes = laneColumns.flatMap((lane, laneIndex) =>
    grouped[lane].map((node, rowIndex) => ({
      ...node,
      x: 80 + laneIndex * 300,
      y: 90 + rowIndex * 120
    }))
  );

  return {
    ...architecture,
    nodes
  };
};

function App() {
  const initialUrlState = readInitialUrlState();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>(initialUrlState.tab);
  const [architecture, setArchitecture] = useState<ArchitectureSpec>(starterArchitecture);
  const [playbook, setPlaybook] = useState<ScenarioPlaybook>(samplePlaybook);
  const [scenarioInput, setScenarioInput] = useState<ScenarioInput>(starterScenarioInput);
  const [solutionNarrative, setSolutionNarrative] = useState<string>(sampleArchitecture.solutionOverview);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(loadingSteps[0]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(starterScenarios);
  const [toolboxOpen, setToolboxOpen] = useState(initialUrlState.services);
  const [sidecarOpen, setSidecarOpen] = useState(false);
  const [toolboxQuery, setToolboxQuery] = useState("");
  const [workspaceFullscreen, setWorkspaceFullscreen] = useState(false);
  const [toolboxExpandAll, setToolboxExpandAll] = useState(initialUrlState.servicesExpanded);
  const [compactDesignNodes, setCompactDesignNodes] = useState(initialUrlState.compact);
  const [selectedStaticScenarioId, setSelectedStaticScenarioId] = useState(initialUrlState.scenario);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SavedScenario[];
      if (parsed.length) {
        setSavedScenarios(parsed);
      }
    } catch {
      // Ignore corrupted local state and keep starter scenarios.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  useEffect(() => {
    const selectedScenario = staticScenarioLibrary.find((scenario) => scenario.id === selectedStaticScenarioId);
    if (!selectedScenario) {
      return;
    }

    setScenarioInput(selectedScenario.input);
    setArchitecture(normalizeArchitecture(selectedScenario.architecture));
    setPlaybook(selectedScenario.playbook);
    setSolutionNarrative(selectedScenario.architecture.solutionOverview);
  }, [selectedStaticScenarioId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", workspaceTab);
    if (selectedStaticScenarioId) {
      params.set("scenario", selectedStaticScenarioId);
    }
    params.set("services", toolboxOpen ? "expanded" : "collapsed");
    params.set("servicesExpanded", toolboxExpandAll ? "expanded" : "collapsed");
    params.set("compact", compactDesignNodes ? "true" : "false");
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [compactDesignNodes, selectedStaticScenarioId, toolboxExpandAll, toolboxOpen, workspaceTab]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % loadingSteps.length;
      setLoadingStep(loadingSteps[index]);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [loading]);

  const groupedIcons = useMemo(() => getGroupedIcons(), []);
  const filteredIcons = useMemo(() => {
    const query = toolboxQuery.trim().toLowerCase();
    if (!query) {
      return groupedIcons;
    }

    return Object.fromEntries(
      Object.entries(groupedIcons)
        .map(([vendor, categories]) => [
          vendor,
          Object.fromEntries(
            Object.entries(categories)
              .map(([category, icons]) => [
                category,
                icons.filter((icon) =>
                  `${icon.label} ${icon.service} ${icon.category} ${icon.keywords.join(" ")}`.toLowerCase().includes(query)
                )
              ])
              .filter(([, icons]) => icons.length > 0)
          )
        ])
        .filter(([, categories]) => Object.keys(categories).length > 0)
    ) as Record<string, Record<string, IconDefinition[]>>;
  }, [groupedIcons, toolboxQuery]);
  const riskChart = useMemo(
    () =>
      playbook.risks.map((risk) => ({
        name: risk.title,
        impact: risk.impact === "High" ? 3 : risk.impact === "Medium" ? 2 : 1,
        likelihood: risk.likelihood === "High" ? 3 : risk.likelihood === "Medium" ? 2 : 1
      })),
    [playbook]
  );

  const updateScenarioField = (field: keyof ScenarioInput, value: string | string[]) => {
    setScenarioInput((current) => ({
      ...current,
      [field]: value
    }));
  };

  const addIconNode = (iconId: string, position?: { x: number; y: number }) => {
    const icon = getIconById(iconId);
    setArchitecture((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        {
          id: `node_${crypto.randomUUID()}`,
          label: icon.service,
          iconId: icon.id,
          vendor: icon.vendor,
          notes: icon.description,
          x: position?.x ?? 180 + current.nodes.length * 28,
          y: position?.y ?? 160 + current.nodes.length * 20,
          lane: "Platform / Processing"
        }
      ]
    }));
  };

  const runGeneration = async (request: string) => {
    if (!request.trim()) {
      return;
    }

    const nextMessages = [...messages, createMessage("user", request)];
    setMessages(nextMessages);
    setLoading(true);
    setLoadingStep(loadingSteps[0]);

    try {
      const mockResponse = createMockResponse(request, scenarioInput, architecture);
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request,
          scenarioInput,
          currentArchitecture: architecture,
          currentPlaybook: playbook,
          messages: nextMessages,
          mockResponse
        })
      });

      if (!response.ok) {
        throw new Error("Studio generation failed");
      }

      const payload = (await response.json()) as {
        architecture: ArchitectureSpec;
        playbook: ScenarioPlaybook;
        assistantMessage: string;
      };

      const normalizedArchitecture = normalizeArchitecture(payload.architecture);
      setArchitecture(normalizedArchitecture);
      setSolutionNarrative(payload.architecture.solutionOverview);
      setPlaybook(payload.playbook);
      setMessages((current) => [...current, createMessage("assistant", payload.assistantMessage)]);
      setWorkspaceTab("Overview");
      setChatDraft("");
      setChatOpen(false);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Generation failed, so the studio kept the current content. Check the API configuration or continue in mock mode.")
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveScenario = () => {
    const saved: SavedScenario = {
      id: crypto.randomUUID(),
      title: scenarioInput.scenarioTitle || playbook.scenarioTitle || "Untitled scenario",
      input: scenarioInput,
      architecture,
      playbook: {
        ...playbook,
        scenarioTitle: scenarioInput.scenarioTitle || playbook.scenarioTitle
      },
      updatedAt: new Date().toISOString()
    };
    setSavedScenarios((current) => [saved, ...current]);
  };

  const duplicateScenario = () => {
    setSavedScenarios((current) => {
      const duplicate: SavedScenario = {
        id: crypto.randomUUID(),
        title: `${scenarioInput.scenarioTitle || "Scenario"} copy`,
        input: scenarioInput,
        architecture,
        playbook,
        updatedAt: new Date().toISOString()
      };
      return [duplicate, ...current];
    });
  };

  const loadScenario = (scenario: SavedScenario) => {
    setScenarioInput(scenario.input);
    setArchitecture(normalizeArchitecture(scenario.architecture));
    setPlaybook(scenario.playbook);
    setSolutionNarrative(scenario.architecture.solutionOverview);
    setWorkspaceTab("Overview");
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const exportExecutiveSummary = () => {
    const summary = [
      playbook.executiveSummary.sponsorReady,
      "",
      `30-second version: ${playbook.executiveSummary.thirtySecond}`,
      "",
      `2-minute version: ${playbook.executiveSummary.twoMinute}`,
      "",
      "12-month success indicators:",
      ...playbook.executiveSummary.successIn12Months.map((item) => `- ${item}`)
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "executive-summary.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPlaybookPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const sections = [
      playbook.scenarioTitle,
      "",
      playbook.scenarioSummary,
      "",
      "Business drivers:",
      ...playbook.businessDrivers.map((item) => `- ${item}`),
      "",
      "Recommended approach:",
      ...playbook.recommendedEngagementApproach.map((item) => `- ${item}`),
      "",
      "Executive summary:",
      playbook.executiveSummary.twoMinute
    ];

    let y = 48;
    sections.forEach((line) => {
      const lines = doc.splitTextToSize(line, 500);
      doc.text(lines, 48, y);
      y += 18 * lines.length;
      if (y > 760) {
        doc.addPage();
        y = 48;
      }
    });

    doc.save("scenario-playbook.pdf");
  };

  const renderScenarioSection = (section: Exclude<WorkspaceTab, "design" | "solution">) => {
    switch (section) {
      case "Overview":
        return (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard title="Customer Situation Summary" actionLabel="Copy" onAction={() => copyText(playbook.scenarioSummary)}>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{playbook.scenarioSummary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <MetricPill title="Confidence" value={`${playbook.confidenceRating}%`} />
                <MetricPill title="Recommended path" value={`${playbook.recommendedConversationPath.length} steps`} />
              </div>
            </SectionCard>
            <SectionCard title="Business Drivers">
              <BulletList items={playbook.businessDrivers} />
            </SectionCard>
            <SectionCard title="Key Constraints">
              <BulletList items={playbook.constraints} />
            </SectionCard>
            <SectionCard title="Recommended Engagement Approach">
              <BulletList items={playbook.recommendedEngagementApproach} />
            </SectionCard>
          </div>
        );
      case "Discovery":
        return (
          <div className="grid gap-4">
            {playbook.discoveryQuestions.map((question) => (
              <SectionCard key={question.question} title={question.category}>
                <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">{question.question}</p>
                  <p><span className="font-medium text-slate-900 dark:text-white">Why it matters:</span> {question.whyItMatters}</p>
                  <p><span className="font-medium text-emerald-700 dark:text-emerald-300">Good signal:</span> {question.goodSignal}</p>
                  <p><span className="font-medium text-rose-700 dark:text-rose-300">Red flag:</span> {question.redFlag}</p>
                </div>
              </SectionCard>
            ))}
          </div>
        );
      case "Problem Framing":
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Problem Statement">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{playbook.problemFraming.statement}</p>
              <div className="rounded-2xl bg-slate-100/80 p-4 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {playbook.problemFraming.framingStatement}
              </div>
            </SectionCard>
            <SectionCard title="Desired Outcomes">
              <BulletList items={playbook.problemFraming.desiredOutcomes} />
            </SectionCard>
            <SectionCard title="Assumptions">
              <BulletList items={playbook.problemFraming.assumptions} />
            </SectionCard>
            <SectionCard title="Non-negotiables">
              <BulletList items={playbook.problemFraming.nonNegotiables} />
            </SectionCard>
          </div>
        );
      case "Architecture":
        return (
          <div className="grid gap-4">
            {playbook.architectureOptions.map((option) => (
              <SectionCard key={option.name} title={option.name} eyebrow={option.idealMaturityLevel}>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{option.summary}</p>
                <div className="grid gap-2 xl:grid-cols-2">
                  <CompactList title="When to use" items={option.whenToUse.slice(0, 3)} compact />
                  <CompactList title="Benefits" items={option.benefits.slice(0, 3)} compact />
                  <CompactList title="Tradeoffs" items={option.tradeoffs.slice(0, 3)} compact />
                  <CompactList title="Platform mapping" items={option.platformMapping.slice(0, 4)} compact />
                </div>
                <SectionSubheader label="Whiteboard talk track" />
                <BulletList items={option.talkTrack} />
              </SectionCard>
            ))}
          </div>
        );
      case "Meeting Prep":
        return (
          <SectionCard title="Meeting Rehearsal">
            <div className="space-y-4">
              {Array.from({ length: Math.ceil(playbook.mockInterview.length / 2) }).map((_, pairIndex) => {
                const prompt = playbook.mockInterview[pairIndex * 2];
                const response = playbook.mockInterview[pairIndex * 2 + 1];
                return (
                  <article key={`prep-${pairIndex}`} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/60">
                    {prompt ? (
                      <div className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{prompt.speaker}</p>
                        <p>{prompt.text}</p>
                      </div>
                    ) : null}
                    {response ? (
                      <div className="mt-3 rounded-2xl bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-950 dark:text-cyan-100">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">{response.speaker}</p>
                        <p>{response.text}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </SectionCard>
        );
      case "Customer Questions":
        return (
          <div className="grid gap-4">
            {playbook.customerQuestions.map((question) => (
              <SectionCard key={question.question} title="Customer Question">
                <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Question</p>
                  <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">{question.question}</p>
                </div>
                <div className="rounded-2xl bg-cyan-500/10 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Best response</p>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{question.bestAnswer}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Response guidance</p>
                  <p>{question.notes}</p>
                </div>
                {question.weakAnswer ? <ComparisonRow label="Weak answer" value={question.weakAnswer} tone="weak" /> : null}
                {question.strongAnswer ? <ComparisonRow label="Strong answer" value={question.strongAnswer} tone="strong" /> : null}
              </SectionCard>
            ))}
          </div>
        );
      case "Risks and Failure Modes":
        return (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Risk Register">
              <div className="space-y-3">
                {playbook.risks.map((risk) => (
                  <div key={risk.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/60">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{risk.title}</h4>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                        {risk.likelihood} / {risk.impact}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{risk.description}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-900 dark:text-white">Mitigation:</span> {risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Risk Heat">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChart}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 3]} />
                    <Tooltip />
                    <Bar dataKey="likelihood" fill="#f97316" radius={8} />
                    <Bar dataKey="impact" fill="#0ea5e9" radius={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        );
      case "Deliverables":
        return (
          <div className="grid gap-3 lg:grid-cols-2">
            {playbook.deliverables.map((deliverable) => (
              <SectionCard key={deliverable.name} title={deliverable.name}>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{deliverable.purpose}</p>
                <CompactList title="Sample outline" items={deliverable.outline.slice(0, 4)} compact />
              </SectionCard>
            ))}
          </div>
        );
      case "Executive Summary":
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Sponsor-ready Summary" actionLabel="Export" onAction={exportExecutiveSummary}>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{playbook.executiveSummary.sponsorReady}</p>
            </SectionCard>
            <SectionCard title="30-second Version">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{playbook.executiveSummary.thirtySecond}</p>
            </SectionCard>
            <SectionCard title="2-minute Version">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{playbook.executiveSummary.twoMinute}</p>
            </SectionCard>
            <SectionCard title="What Success Looks Like in 12 Months">
              <BulletList items={playbook.executiveSummary.successIn12Months} />
            </SectionCard>
          </div>
        );
      case "SA Toolkit":
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Meeting Checklist">
              <BulletList items={playbook.meetingChecklist} />
            </SectionCard>
            <SectionCard title="Next Steps">
              <BulletList items={playbook.nextSteps} />
            </SectionCard>
            <SectionCard title="Workshop Plan">
              <BulletList items={playbook.workshopPlan} />
            </SectionCard>
            <SectionCard title="Objection Handling">
              <div className="space-y-3">
                {playbook.objections.map((objection) => (
                  <div key={objection.objection} className="rounded-2xl bg-slate-100/80 p-4 text-sm dark:bg-slate-800/80">
                    <p className="font-semibold text-slate-900 dark:text-white">{objection.objection}</p>
                    <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{objection.response}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        );
      default:
        return null;
    }
  };

  const renderWorkspaceContent = () => {
    if (workspaceTab === "design") {
      return (
        <div
          className="grid h-full min-h-0 min-w-0 gap-2 overflow-hidden p-2"
          style={{ gridTemplateColumns: toolboxOpen ? "220px minmax(0,1fr)" : "54px minmax(0,1fr)" }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const iconId = event.dataTransfer.getData("text/icon-id");
            const fallbackIconId = event.dataTransfer.getData("text/plain");
            const nextIconId = iconId || fallbackIconId;
            if (!nextIconId) {
              return;
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            addIconNode(nextIconId, {
              x: Math.max(40, event.clientX - bounds.left - 120),
              y: Math.max(40, event.clientY - bounds.top - 60)
            });
          }}
        >
          <aside
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200/90 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          >
            <div className={`flex items-center ${toolboxOpen ? "justify-between gap-2 px-2 py-2" : "justify-center px-1.5 py-2"}`}>
              {toolboxOpen ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Services</p>
                  <p className="text-[10px] text-slate-500">Drag or click to add</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setToolboxOpen((current) => !current)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-700"
                title={toolboxOpen ? "Collapse services" : "Expand services"}
              >
                {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
            </div>
            {toolboxOpen ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2">
              <div className="flex items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-100 px-2.5 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={toolboxQuery}
                    onChange={(event) => setToolboxQuery(event.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-xs text-slate-700 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setToolboxExpandAll((current) => !current)}
                  className="rounded-full bg-slate-100 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                >
                  {toolboxExpandAll ? "Collapse" : "Expand all"}
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {Object.entries(filteredIcons).map(([vendor, categories]) => (
                  <details key={`${vendor}-${toolboxExpandAll ? "all" : "compact"}`} open={toolboxExpandAll} className="text-slate-900">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em]">
                      {vendor}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(categories).map(([category, icons]) => (
                        <details key={`${vendor}-${category}-${toolboxExpandAll ? "all" : "compact"}`} open={toolboxExpandAll}>
                          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {category} <span className="text-slate-400">({icons.length})</span>
                          </summary>
                          <div className="mt-1.5 grid gap-0.5">
                            {icons.map((icon) => (
                              <button
                                key={icon.id}
                                type="button"
                                onClick={() => addIconNode(icon.id)}
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.setData("text/icon-id", icon.id);
                                  event.dataTransfer.setData("text/plain", icon.id);
                                  event.dataTransfer.effectAllowed = "copy";
                                }}
                                className="grid cursor-grab grid-cols-[20px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-slate-100 active:cursor-grabbing"
                              >
                                <img className="h-5 w-5 object-contain" src={icon.assetPath} alt={icon.label} />
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] font-semibold text-slate-900">{icon.service}</p>
                                  <p className="truncate text-[10px] text-slate-500">{icon.label}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
                <div className="flex flex-col gap-0.5">
                {iconCatalog.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => addIconNode(icon.id)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/icon-id", icon.id);
                      event.dataTransfer.setData("text/plain", icon.id);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex cursor-grab items-center justify-center rounded-lg p-1.5 hover:bg-slate-100 active:cursor-grabbing"
                    title={icon.service}
                  >
                    <img className="h-5 w-5 object-contain" src={icon.assetPath} alt={icon.label} />
                  </button>
                ))}
                </div>
              </div>
            )}
          </aside>
          <div className="min-h-0 min-w-0 overflow-hidden">
            <DesignCanvas
              architecture={architecture}
              onArchitectureChange={setArchitecture}
              compactNodes={compactDesignNodes}
              onToggleCompactNodes={() => setCompactDesignNodes((current) => !current)}
              onAutoLayout={() =>
                setArchitecture((current) => autoLayoutArchitecture(current))
              }
            />
          </div>
        </div>
      );
    }

    if (workspaceTab === "solution") {
      return (
        <div className="grid min-h-0 min-w-0 gap-3 overflow-hidden p-3 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="min-h-0 overflow-y-auto rounded-[24px] border border-white/10 bg-white/8 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Editable Narrative</p>
                <h2 className="text-base font-semibold text-white">Solution overview</h2>
              </div>
              <button type="button" onClick={() => copyText(solutionNarrative)} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-200">
                <ClipboardCopy className="mr-1.5 inline h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <textarea
              value={solutionNarrative}
              onChange={(event) => setSolutionNarrative(event.target.value)}
              className="min-h-[320px] w-full rounded-[20px] border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-100 outline-none"
            />
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <InfoPanel title="Architecture Details">
                <div className="space-y-3">
                  {architecture.details.map((detail) => (
                    <div key={detail.title} className="rounded-2xl bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">{detail.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-300">{detail.body}</p>
                    </div>
                  ))}
                </div>
              </InfoPanel>
              <InfoPanel title="Assumptions">
                <BulletList items={architecture.assumptions} dark />
              </InfoPanel>
            </div>
          </section>
          <section className="min-h-0 overflow-y-auto rounded-[24px] border border-white/10 bg-white/8 p-4">
            <div className="grid gap-3">
              <InfoPanel title="Sponsor-ready Storyline">
                <p className="text-sm leading-6 text-slate-300">{playbook.executiveSummary.sponsorReady}</p>
              </InfoPanel>
              <InfoPanel title="Talking Points">
                <BulletList items={playbook.whiteboardTalkTrack} dark />
              </InfoPanel>
              <InfoPanel title="Recommended Architecture Options">
                <div className="space-y-3">
                  {playbook.architectureOptions.map((option) => (
                    <div key={option.name} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">{option.name}</h3>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-300">{option.summary}</p>
                    </div>
                  ))}
                </div>
              </InfoPanel>
            </div>
          </section>
        </div>
      );
    }

      return (
      <div className="flex min-h-0 min-w-0 flex-col items-stretch justify-start overflow-y-auto p-3">
        {renderScenarioSection(workspaceTab)}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#08111f_36%,#0f172a_100%)] text-slate-100 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#08111f_36%,#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-[1780px] flex-col px-3 pb-3 pt-2 md:px-4">
        <header className="sticky top-2 z-40 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-slate-950/72 px-3 py-1.5 shadow-[0_16px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              SA Assistant
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <h1 className="truncate text-[14px] font-semibold text-white">Architecture design, discovery, and meeting-ready delivery</h1>
            </div>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <label className="flex min-w-[240px] max-w-[360px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-200">
              <span className="shrink-0 uppercase tracking-[0.16em] text-slate-400">Scenario</span>
              <select
                value={selectedStaticScenarioId}
                onChange={(event) => setSelectedStaticScenarioId(event.target.value)}
                className="w-full bg-transparent text-[11px] outline-none"
              >
                {staticScenarioLibrary.map((scenario) => (
                  <option key={scenario.id} value={scenario.id} className="bg-slate-900 text-white">
                    {scenario.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 xl:block">
              {loading ? loadingStep : "Mock + OpenAI modes available"}
            </div>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
            >
              {theme === "dark" ? <SunMedium className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setChatOpen(true);
                setChatDraft(scenarioInput.problemStatement || playbook.scenarioSummary);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Bot className="h-4 w-4" />
              Generate Playbook
            </button>
          </div>
        </header>

        <main className={`${workspaceFullscreen ? "fixed inset-0 z-[52] bg-slate-950/96 p-2" : "mt-2 min-h-0 flex-1 overflow-hidden"}`}>
          <section className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_24px_54px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="flex min-h-[42px] items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1.5">
              <div className="flex min-h-[28px] min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                {workspaceTabs.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWorkspaceTab(value)}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${workspaceTab === value ? "bg-white text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  >
                    {value === "design" ? "Design" : value === "solution" ? "Solution" : value}
                  </button>
                ))}
              </div>
              <div className="flex min-h-[28px] shrink-0 items-center gap-1.5">
                <ActionButton icon={<Save className="h-3.5 w-3.5" />} label="Save" onClick={saveScenario} compact />
                <ActionButton icon={<FileOutput className="h-3.5 w-3.5" />} label="PDF" onClick={exportPlaybookPdf} compact />
                <button
                  type="button"
                  onClick={() => setWorkspaceFullscreen((current) => !current)}
                  className="rounded-full bg-white/8 p-2 text-slate-200 transition hover:bg-white/12"
                  title={workspaceFullscreen ? "Exit full screen" : "Full screen"}
                >
                  {workspaceFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {renderWorkspaceContent()}
          </section>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setSidecarOpen(true)}
        className="fixed bottom-24 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/88 text-slate-100 shadow-[0_18px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl transition hover:bg-slate-900"
        title="Open studio panel"
      >
        <PanelLeftOpen className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-[0_18px_50px_rgba(14,165,233,0.35)] transition hover:bg-cyan-400"
        title="Open scenario chat"
      >
        <Bot className="h-4.5 w-4.5" />
      </button>

      <AnimatePresence>
        {sidecarOpen ? (
          <motion.div
            className="fixed inset-0 z-[55] flex items-end justify-end bg-slate-950/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="grid h-[min(82vh,760px)] w-full max-w-[360px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 shadow-[0_30px_80px_rgba(2,6,23,0.58)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Studio Panel</p>
                  <h2 className="text-base font-semibold text-white">Samples and quick actions</h2>
                </div>
                <button type="button" onClick={() => setSidecarOpen(false)} className="rounded-full bg-white/8 px-3 py-2 text-xs font-semibold text-slate-300">
                  Close
                </button>
              </div>
              <div className="grid min-h-0 gap-3 overflow-y-auto p-4">
                <InfoPanel title="Starter scenarios" darkPanel>
                  <div className="grid gap-2">
                    {starterScenarioCatalog.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => {
                          updateScenarioField("scenarioTitle", title);
                          setSidecarOpen(false);
                          setChatOpen(true);
                          setChatDraft(title);
                        }}
                        className="rounded-2xl bg-white/5 px-3 py-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </InfoPanel>
                <InfoPanel title="Saved scenarios" darkPanel>
                  <div className="grid gap-2">
                    {savedScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          loadScenario(scenario);
                          setSidecarOpen(false);
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-white">{scenario.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(scenario.updatedAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                </InfoPanel>
                <InfoPanel title="Quick actions" darkPanel>
                  <div className="grid gap-2">
                    <ActionButton icon={<Save className="h-4 w-4" />} label="Save current scenario" onClick={saveScenario} />
                    <ActionButton icon={<FolderOpen className="h-4 w-4" />} label="Duplicate scenario" onClick={duplicateScenario} />
                    <ActionButton icon={<ClipboardCopy className="h-4 w-4" />} label="Copy executive summary" onClick={() => copyText(playbook.executiveSummary.twoMinute)} />
                  </div>
                </InfoPanel>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
        {chatOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-end bg-slate-950/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="grid h-[min(82vh,760px)] w-full max-w-[460px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 shadow-[0_30px_80px_rgba(2,6,23,0.58)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Prompt Studio</p>
                  <h2 className="text-base font-semibold text-white">Generate or refine</h2>
                </div>
                <button type="button" onClick={() => setChatOpen(false)} className="rounded-full bg-white/8 px-3 py-2 text-xs font-semibold text-slate-300">
                  Close
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`rounded-[22px] p-4 text-sm leading-6 ${message.role === "assistant" ? "bg-white/8 text-slate-100" : "bg-cyan-500/18 text-cyan-50"}`}>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">{message.role === "assistant" ? "Studio" : "You"}</p>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <textarea
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Describe the scenario, request a solution approach, or refine the current design."
                  className="min-h-[150px] w-full rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-100 outline-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">This chat controls both architecture generation and scenario playbook updates.</p>
                  <button
                    type="button"
                    disabled={loading || !chatDraft.trim()}
                    onClick={() => runGeneration(chatDraft)}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Activity className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {loading ? loadingStep : "Run"}
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InfoPanel({ title, children, darkPanel = false }: { title: string; children: ReactNode; darkPanel?: boolean }) {
  return (
    <section className={`rounded-[24px] border p-4 ${darkPanel ? "border-white/10 bg-white/5" : "border-white/10 bg-white/5"}`}>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

function SectionCard({
  title,
  eyebrow,
  children,
  actionLabel,
  onAction
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">{eyebrow}</p> : null}
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/8 dark:text-slate-100">
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </article>
  );
}

function BulletList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className={`rounded-2xl px-3 py-3 text-sm leading-6 ${dark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function CompactList({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className={`rounded-2xl bg-slate-100 dark:bg-slate-800 ${compact ? "p-3" : "p-4"}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{title}</p>
      <BulletList items={items} />
    </div>
  );
}

function MetricPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ComparisonRow({ label, value, tone }: { label: string; value: string; tone: "weak" | "strong" }) {
  return (
    <div className={`rounded-2xl p-4 text-sm leading-6 ${tone === "weak" ? "bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100" : "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"}`}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function SectionSubheader({ label }: { label: string }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>;
}

function ActionButton({
  icon,
  label,
  onClick,
  compact = false
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3"}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
