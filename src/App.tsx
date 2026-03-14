import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { Activity, ArrowRight, Bot, ClipboardCopy, Code2, FileOutput, FolderOpen, Maximize2, Minimize2, Moon, PanelLeftClose, PanelLeftOpen, Plus, Save, Search, Sparkles, SunMedium, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DesignCanvas } from "./components/DesignCanvas";
import { DiscoveryPanel } from "./components/DiscoveryPanel";
import { StoryTab } from "./components/StoryTab";
import { JsonEditorModal } from "./components/JsonEditorModal";
import { NewScenarioWizard } from "./components/NewScenarioWizard";
import { normalizeArchitecture, starterArchitecture } from "./lib/architecture";
import { ARCHITECT_TABS } from "./lib/architectFramework";
import { getGroupedIcons, getIconById, iconCatalog } from "./lib/iconCatalog";
import { sampleArchitecture, samplePlaybook, starterScenarioCatalog, starterScenarioInput, starterScenarios } from "./lib/mockData";
import { staticScenarioLibrary } from "./lib/scenarioLibrary";
import type { ArchitectureSpec, ChatMessage, IconDefinition, SavedScenario, ScenarioInput, ScenarioPlaybook, WorkspaceTab } from "./types/architecture";
import type { ArchitectAnswers, StoryOutput } from "./types/architect";

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

const workspaceTabs: WorkspaceTab[] = ["Scenario", "Discovery", "Design", "Solution", "Story"];

const parseWorkspaceTab = (value: string | null): WorkspaceTab =>
  workspaceTabs.includes((value ?? "") as WorkspaceTab) ? ((value ?? "Scenario") as WorkspaceTab) : "Scenario";

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
  const [architectAnswers, setArchitectAnswers] = useState<ArchitectAnswers>({});
  const [story, setStory] = useState<StoryOutput | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState<"scenario" | "architecture" | null>(null);
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);

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
    setArchitectAnswers(selectedScenario.architectAnswers ?? {});
    setStory(selectedScenario.story ?? null);
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
      setWorkspaceTab("Scenario");
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
      playbook: { ...playbook, scenarioTitle: scenarioInput.scenarioTitle || playbook.scenarioTitle },
      architectAnswers,
      story,
      updatedAt: new Date().toISOString()
    };
    setSavedScenarios((current) => [saved, ...current]);
  };

  const handleSaveNewScenario = (scenario: SavedScenario) => {
    setSavedScenarios((current) => [scenario, ...current]);
    loadScenario(scenario);
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
    setArchitectAnswers(scenario.architectAnswers ?? {});
    setStory(scenario.story ?? null);
    setWorkspaceTab("Scenario");
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const updateArchitectAnswer = (questionId: string, value: string) => {
    setArchitectAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    try {
      const response = await fetch("/api/studio/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: architectAnswers, scenarioInput, currentArchitecture: architecture })
      });

      if (response.ok) {
        const payload = await response.json() as { story: StoryOutput };
        setStory(payload.story);
      } else {
        setStory({
          strategy: `A governed ${scenarioInput.industry || "enterprise"} data platform built on a lakehouse architecture, unifying sources through a medallion lifecycle and enabling analytics and AI.`,
          technology: `The platform leverages cloud-native ingestion, a Delta Lake medallion architecture, centralized governance, and curated data products for BI, ML, and AI consumption.`,
          outcome: `Faster analytics delivery, reduced platform sprawl, trusted data products, and a governed foundation for machine learning and AI use cases.`,
          returnValue: `Reduced time to insight, lower operational costs through platform consolidation, and accelerated AI-readiness that creates new business value.`,
          years: `This architecture scales across domains, supports growing data volumes, and provides the governed foundation needed for advanced AI and automation in the years ahead.`
        });
      }
    } catch {
      setStory({
        strategy: `A governed lakehouse platform that unifies enterprise data, supports analytics and AI, and delivers trusted data products across the organization.`,
        technology: `Cloud-native data platform with medallion architecture, centralized governance, and curated consumption layers for BI, ML, and AI.`,
        outcome: `Improved analytics speed, trusted data products, reduced duplication, and an AI-ready governed foundation.`,
        returnValue: `Platform consolidation reduces costs; governed data products accelerate decision-making and enable new AI-driven capabilities.`,
        years: `Scalable, governed architecture that grows with the organization and supports future AI, automation, and cross-domain data sharing.`
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSaveScenarioJson = (parsed: unknown) => {
    const data = parsed as { input?: typeof scenarioInput; playbook?: typeof playbook; architecture?: typeof architecture; architectAnswers?: ArchitectAnswers; story?: StoryOutput };
    if (data.input) setScenarioInput(data.input);
    if (data.playbook) setPlaybook(data.playbook);
    if (data.architecture) {
      setArchitecture(normalizeArchitecture(data.architecture));
      setSolutionNarrative(data.architecture.solutionOverview || solutionNarrative);
    }
    if (data.architectAnswers) setArchitectAnswers(data.architectAnswers);
    if (data.story !== undefined) setStory(data.story);
  };

  const handleSaveArchitectureJson = (parsed: unknown) => {
    const arch = normalizeArchitecture(parsed as typeof architecture);
    setArchitecture(arch);
    setSolutionNarrative(arch.solutionOverview || solutionNarrative);
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

  const exportAssessmentPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = 500;
    let y = 48;

    const addLine = (text: string, fontSize = 11, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, pageWidth);
      doc.text(lines, 48, y);
      y += 16 * lines.length;
      if (y > 760) { doc.addPage(); y = 48; }
    };

    addLine("Discovery Assessment", 18, true);
    addLine(scenarioInput.scenarioTitle || "Untitled Scenario", 13, false);
    y += 12;

    ARCHITECT_TABS.forEach((tab) => {
      y += 8;
      addLine(`${tab.id} — ${tab.description}`, 13, true);
      y += 4;
      tab.questions.forEach((q) => {
        addLine(q.question, 10, true);
        const answer = architectAnswers[q.id]?.trim() || "(no response)";
        addLine(answer, 10, false);
        y += 4;
      });
    });

    doc.save(`${(scenarioInput.scenarioTitle || "assessment").replace(/\s+/g, "-").toLowerCase()}-assessment.pdf`);
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

  const renderScenarioSection = () => {
    return (
          <div className="flex h-full min-h-0 w-full flex-col">
            {/* Scenario title — large, prominent */}
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Scenario</p>
              <input
                value={scenarioInput.scenarioTitle}
                onChange={(e) => updateScenarioField("scenarioTitle", e.target.value)}
                placeholder="Enter scenario title..."
                className="mt-1 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-slate-600"
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="uppercase tracking-[0.18em]">Industry</span>
                  <select
                    value={scenarioInput.industry}
                    onChange={(e) => updateScenarioField("industry", e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500/50"
                  >
                    <option value="">Select industry</option>
                    {["Healthcare","Financial Services","Retail & E-commerce","Manufacturing","Energy & Utilities","Technology","Media & Entertainment","Government","Life Sciences / Pharma","Transportation & Logistics","Education","Telecommunications"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="uppercase tracking-[0.18em]">Customer type</span>
                  <select
                    value={scenarioInput.customerType}
                    onChange={(e) => updateScenarioField("customerType", e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500/50"
                  >
                    <option value="">Select type</option>
                    {["Enterprise","Mid-Market","Startup / ISV","Provider","Payer","Government Agency","Financial Institution","Retailer","Manufacturer","University / Research","Other"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="uppercase tracking-[0.18em]">Stakeholders</span>
                  <input
                    value={scenarioInput.stakeholders}
                    onChange={(e) => updateScenarioField("stakeholders", e.target.value)}
                    placeholder="e.g. CIO, VP Analytics"
                    className="min-w-[220px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
                  />
                </label>
              </div>
            </div>

            {/* Main scenario body — big, editable */}
            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
              <div className="flex flex-col border-r border-white/10 p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Scenario / Use Case</p>
                <textarea
                  value={scenarioInput.problemStatement}
                  onChange={(e) => updateScenarioField("problemStatement", e.target.value)}
                  placeholder="Describe the customer scenario and use case in detail. What is the organization trying to solve? What triggered this initiative? Who is involved and what do they need?"
                  className="min-h-0 flex-1 resize-none bg-transparent text-base leading-8 text-slate-100 outline-none placeholder:text-slate-700"
                />
              </div>
              <div className="flex min-h-0 flex-col overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Business Goals</p>
                    <textarea
                      value={scenarioInput.businessGoals}
                      onChange={(e) => updateScenarioField("businessGoals", e.target.value)}
                      placeholder="What are the top business goals driving this initiative?"
                      rows={3}
                      className="w-full resize-y rounded-[14px] border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current State</p>
                    <textarea
                      value={scenarioInput.currentState}
                      onChange={(e) => updateScenarioField("currentState", e.target.value)}
                      placeholder="What does the current environment look like? Systems, pain points, fragmentation..."
                      rows={3}
                      className="w-full resize-y rounded-[14px] border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Desired Future State</p>
                    <textarea
                      value={scenarioInput.desiredFutureState}
                      onChange={(e) => updateScenarioField("desiredFutureState", e.target.value)}
                      placeholder="What should the future look like? What capabilities does the organization want to have?"
                      rows={3}
                      className="w-full resize-y rounded-[14px] border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Constraints &amp; Compliance</p>
                    <textarea
                      value={scenarioInput.constraints}
                      onChange={(e) => updateScenarioField("constraints", e.target.value)}
                      placeholder="Budget, timeline, compliance requirements, legacy system constraints..."
                      rows={3}
                      className="w-full resize-y rounded-[14px] border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Timeline</p>
                    <input
                      value={scenarioInput.timeline}
                      onChange={(e) => updateScenarioField("timeline", e.target.value)}
                      placeholder="e.g. 12 months for measurable value"
                      className="w-full rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setChatOpen(true); setChatDraft(scenarioInput.problemStatement || scenarioInput.scenarioTitle); }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-cyan-500/15 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate playbook from this scenario
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
  };

  const renderWorkspaceContent = () => {
    if (workspaceTab === "Discovery") {
      return (
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <DiscoveryPanel
            answers={architectAnswers}
            onAnswerChange={updateArchitectAnswer}
          />
        </div>
      );
    }

    if (workspaceTab === "Story") {
      return (
        <div className="flex min-h-0 min-w-0 flex-col items-stretch overflow-y-auto p-6">
          <StoryTab
            story={story}
            answers={architectAnswers}
            onGenerate={handleGenerateStory}
            isGenerating={isGeneratingStory}
          />
        </div>
      );
    }

    if (workspaceTab === "Scenario") {
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {renderScenarioSection()}
        </div>
      );
    }

    if (workspaceTab === "Design") {
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
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-slate-900/95 shadow-[0_18px_42px_rgba(2,6,23,0.3)] backdrop-blur-xl"
          >
            <div className={`flex items-center ${toolboxOpen ? "justify-between gap-2 px-2 py-2" : "justify-center px-1.5 py-2"}`}>
              {toolboxOpen ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Services</p>
                  <p className="text-[10px] text-slate-400">Drag or click to add</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setToolboxOpen((current) => !current)}
                className="rounded-full bg-white/10 p-1.5 text-slate-200"
                title={toolboxOpen ? "Collapse services" : "Expand services"}
              >
                {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
            </div>
            {toolboxOpen ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2">
              <div className="flex items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={toolboxQuery}
                    onChange={(event) => setToolboxQuery(event.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setToolboxExpandAll((current) => !current)}
                  className="rounded-full bg-white/10 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  {toolboxExpandAll ? "Collapse" : "Expand all"}
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {Object.entries(filteredIcons).map(([vendor, categories]) => (
                  <details key={`${vendor}-${toolboxExpandAll ? "all" : "compact"}`} open={toolboxExpandAll} className="text-white">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      {vendor}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(categories).map(([category, icons]) => (
                        <details key={`${vendor}-${category}-${toolboxExpandAll ? "all" : "compact"}`} open={toolboxExpandAll}>
                          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {category} <span className="text-slate-500">({icons.length})</span>
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
                                className="grid cursor-grab grid-cols-[20px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-white/10 active:cursor-grabbing"
                              >
                                <img className="h-5 w-5 object-contain" src={icon.assetPath} alt={icon.label} />
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] font-semibold text-white">{icon.service}</p>
                                  <p className="truncate text-[10px] text-slate-400">{icon.label}</p>
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
                    className="flex cursor-grab items-center justify-center rounded-lg p-1.5 hover:bg-white/10 active:cursor-grabbing"
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

    if (workspaceTab === "Solution") {
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

    return null;
  };

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#08111f_36%,#0f172a_100%)] text-slate-100 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#08111f_36%,#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-[1780px] flex-col px-3 pb-3 pt-2 md:px-4">
        <header className="sticky top-2 z-40 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-slate-950/72 px-3 py-1.5 shadow-[0_16px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              SA Assistant
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
            <button
              type="button"
              onClick={() => setNewScenarioOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
              title="Create new scenario"
            >
              <Plus className="h-4 w-4" />
            </button>
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
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${workspaceTab === value ? "bg-white text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex min-h-[28px] shrink-0 items-center gap-1.5">
                <ActionButton icon={<Save className="h-3.5 w-3.5" />} label="Save" onClick={saveScenario} compact />
                <ActionButton icon={<FileText className="h-3.5 w-3.5" />} label="Export Assessment" onClick={exportAssessmentPdf} compact />
                <ActionButton icon={<FileOutput className="h-3.5 w-3.5" />} label="PDF" onClick={exportPlaybookPdf} compact />
                <ActionButton icon={<Code2 className="h-3.5 w-3.5" />} label="Scenario JSON" onClick={() => setJsonEditorOpen("scenario")} compact />
                <ActionButton icon={<Code2 className="h-3.5 w-3.5" />} label="Arch JSON" onClick={() => setJsonEditorOpen("architecture")} compact />
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

      <JsonEditorModal
        title="Scenario JSON"
        subtitle="Edit the full scenario including input, playbook, and ARCHITECT answers"
        value={{ input: scenarioInput, playbook, architecture, architectAnswers, story }}
        open={jsonEditorOpen === "scenario"}
        onSave={handleSaveScenarioJson}
        onClose={() => setJsonEditorOpen(null)}
      />
      <JsonEditorModal
        title="Architecture JSON"
        subtitle="Edit nodes and edges of the architecture diagram"
        value={architecture}
        open={jsonEditorOpen === "architecture"}
        onSave={handleSaveArchitectureJson}
        onClose={() => setJsonEditorOpen(null)}
      />
      <NewScenarioWizard
        open={newScenarioOpen}
        onClose={() => setNewScenarioOpen(false)}
        onSave={handleSaveNewScenario}
      />
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
