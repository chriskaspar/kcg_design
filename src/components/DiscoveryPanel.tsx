import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { ARCHITECT_TABS } from "../lib/architectFramework";
import type { ArchitectAnswers, ArchitectTabId } from "../types/architect";

interface DiscoveryPanelProps {
  answers: ArchitectAnswers;
  onAnswerChange: (questionId: string, value: string) => void;
}

const ALL_QUESTIONS = ARCHITECT_TABS.flatMap((tab) =>
  tab.questions.map((question) => ({ tab, question }))
);

export function DiscoveryPanel({ answers, onAnswerChange }: DiscoveryPanelProps) {
  const [showOverview, setShowOverview] = useState(true);
  const [selectedTabId, setSelectedTabId] = useState(ARCHITECT_TABS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ARCHITECT_TABS[0].questions[0]?.meaning ?? ""
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    ARCHITECT_TABS[0].questions[0]?.id ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [navVisible, setNavVisible] = useState(true);

  const currentIndex = ALL_QUESTIONS.findIndex((q) => q.question.id === selectedQuestionId);
  const currentEntry = ALL_QUESTIONS[currentIndex];

  const selectQuestion = useCallback((questionId: string) => {
    const found = ALL_QUESTIONS.find((q) => q.question.id === questionId);
    if (found) {
      setSelectedTabId(found.tab.id as ArchitectTabId);
      setSelectedCategory(found.question.meaning);
      setSelectedQuestionId(questionId);
      setSearchQuery("");
      setShowOverview(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < ALL_QUESTIONS.length - 1)
      selectQuestion(ALL_QUESTIONS[currentIndex + 1].question.id);
  }, [currentIndex, selectQuestion]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0)
      selectQuestion(ALL_QUESTIONS[currentIndex - 1].question.id);
  }, [currentIndex, selectQuestion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showOverview) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, showOverview]);

  const handleTabSelect = (tabId: string) => {
    const tab = ARCHITECT_TABS.find((t) => t.id === tabId);
    if (!tab) return;
    setSelectedTabId(tab.id as ArchitectTabId);
    const firstQ = tab.questions[0];
    if (firstQ) {
      setSelectedCategory(firstQ.meaning);
      setSelectedQuestionId(firstQ.id);
    }
  };

  const handleCategorySelect = (tabId: string, category: string) => {
    setSelectedTabId(tabId as ArchitectTabId);
    setSelectedCategory(category);
    const tab = ARCHITECT_TABS.find((t) => t.id === tabId);
    const firstQ = tab?.questions.find((q) => q.meaning === category);
    if (firstQ) setSelectedQuestionId(firstQ.id);
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? ALL_QUESTIONS.filter(
        ({ tab, question }) =>
          question.question.toLowerCase().includes(trimmedQuery) ||
          question.meaning.toLowerCase().includes(trimmedQuery) ||
          tab.id.toLowerCase().includes(trimmedQuery) ||
          tab.description.toLowerCase().includes(trimmedQuery)
      )
    : null;

  const totalAnswered = ALL_QUESTIONS.filter(({ question }) => answers[question.id]?.trim()).length;

  // ── Overview mode ──────────────────────────────────────────────────────────
  if (showOverview) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col overflow-hidden">
        {/* Compact header */}
        <div className="shrink-0 border-b border-white/10 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">Discovery</h2>
              <div className="flex flex-1 items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.round((totalAnswered / ALL_QUESTIONS.length) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                  {totalAnswered}/{ALL_QUESTIONS.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/8 px-2 py-1">
              <Search className="h-3 w-3 shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-36 bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-500"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-[9px] text-slate-500 hover:text-slate-300">✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Search results — scrollable */}
        {searchResults ? (
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {searchResults.map(({ tab, question }) => {
                const isAnswered = Boolean(answers[question.id]?.trim());
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => selectQuestion(question.id)}
                    className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/4 p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/8"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-400">{tab.id} · {question.meaning}</span>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isAnswered ? "bg-emerald-400" : "bg-slate-600"}`} />
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-[1.4] text-slate-300 group-hover:text-white transition-colors">
                      {question.question}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 4×2 tab card grid — no scroll, fills height */
          <div className="flex-1 overflow-hidden grid grid-cols-4 grid-rows-2 gap-2 p-2">
            {ARCHITECT_TABS.map((tab) => {
              const answeredCount = tab.questions.filter((q) => answers[q.id]?.trim()).length;
              const categories = [...new Set(tab.questions.map((q) => q.meaning))];
              return (
                <div key={tab.id} className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-2.5">
                  {/* Card header */}
                  <div className="mb-2 flex shrink-0 items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.22em] text-cyan-300">{tab.id}</span>
                    <span className="flex-1 truncate text-[10px] text-slate-500">{tab.description}</span>
                    <span className={`shrink-0 text-[9px] font-semibold tabular-nums ${answeredCount === tab.questions.length ? "text-emerald-400" : answeredCount > 0 ? "text-cyan-400" : "text-slate-600"}`}>
                      {answeredCount}/{tab.questions.length}
                    </span>
                  </div>

                  {/* Questions by subcategory */}
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    {categories.map((category) => {
                      const catQs = tab.questions.filter((q) => q.meaning === category);
                      return (
                        <div key={category} className="flex min-h-0 flex-col">
                          <p className="mb-0.5 shrink-0 text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            {category}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {catQs.map((q) => {
                              const isAnswered = Boolean(answers[q.id]?.trim());
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => selectQuestion(q.id)}
                                  className="group flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/8"
                                >
                                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isAnswered ? "bg-emerald-400" : "bg-slate-600"}`} />
                                  <span className="line-clamp-1 text-[10px] leading-tight text-slate-400 group-hover:text-slate-100 transition-colors">
                                    {q.question}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Q&A mode ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full min-h-0">
      {/* Collapsible left nav */}
      {navVisible && (
        <nav className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/10">
          <div className="shrink-0 border-b border-white/10 px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/8 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-transparent text-[12px] text-slate-200 outline-none placeholder:text-slate-500"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-[10px] text-slate-500 hover:text-slate-300">✕</button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchResults ? (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map(({ tab, question }) => {
                  const isActive = question.id === selectedQuestionId;
                  const isAnswered = Boolean(answers[question.id]?.trim());
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => selectQuestion(question.id)}
                      className={`flex w-full items-start gap-2 px-4 py-2 text-left transition ${isActive ? "bg-cyan-500/15" : "hover:bg-white/5"}`}
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isAnswered ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">{tab.id} · {question.meaning}</p>
                        <p className={`line-clamp-2 text-[11px] leading-5 ${isActive ? "text-white" : "text-slate-400"}`}>{question.question}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              ARCHITECT_TABS.map((tab) => {
                const isTabActive = tab.id === selectedTabId;
                const answeredCount = tab.questions.filter((q) => answers[q.id]?.trim()).length;
                const categories = [...new Set(tab.questions.map((q) => q.meaning))];
                return (
                  <div key={tab.id}>
                    <button
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${isTabActive ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold tracking-[0.2em] ${isTabActive ? "text-cyan-300" : "text-slate-500"}`}>{tab.id}</span>
                        <span className="max-w-[100px] truncate text-[11px] text-slate-500">{tab.description.split(" ").slice(0, 3).join(" ")}</span>
                      </div>
                      <span className={`shrink-0 text-[10px] font-medium ${answeredCount === tab.questions.length ? "text-emerald-400" : answeredCount > 0 ? "text-cyan-400" : "text-slate-600"}`}>
                        {answeredCount}/{tab.questions.length}
                      </span>
                    </button>

                    {isTabActive && categories.map((category) => {
                      const isCatActive = category === selectedCategory;
                      const catQs = tab.questions.filter((q) => q.meaning === category);
                      const catAnswered = catQs.filter((q) => answers[q.id]?.trim()).length;
                      return (
                        <div key={category}>
                          <button
                            type="button"
                            onClick={() => handleCategorySelect(tab.id, category)}
                            className={`flex w-full items-center justify-between py-2 pl-8 pr-4 text-left transition ${isCatActive ? "text-cyan-200" : "text-slate-500 hover:text-slate-300"}`}
                          >
                            <span className="text-xs font-medium">{category}</span>
                            <span className={`text-[10px] ${catAnswered === catQs.length ? "text-emerald-400" : "text-slate-600"}`}>{catAnswered}/{catQs.length}</span>
                          </button>
                          {isCatActive && catQs.map((q) => {
                            const isQActive = q.id === selectedQuestionId;
                            const isAnswered = Boolean(answers[q.id]?.trim());
                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => setSelectedQuestionId(q.id)}
                                className={`flex w-full items-start gap-2 py-1.5 pl-12 pr-3 text-left text-[11px] leading-5 transition ${isQActive ? "bg-cyan-500/15 text-white" : "text-slate-500 hover:text-slate-300"}`}
                              >
                                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isAnswered ? "bg-emerald-400" : "bg-slate-600"}`} />
                                <span className="line-clamp-2">{q.question}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </nav>
      )}

      {/* Right panel — CSS grid locks the footer in place regardless of content height */}
      <div className="grid min-h-0 flex-1 overflow-hidden grid-rows-[auto_1fr_68px]">
        {currentEntry ? (
          <>
            {/* Question header */}
            <div className="overflow-hidden border-b border-white/10 px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                {/* Nav toggle */}
                <button
                  type="button"
                  onClick={() => setNavVisible((v) => !v)}
                  className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                  title={navVisible ? "Hide navigation" : "Show navigation"}
                >
                  {navVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </button>
                {/* Back to overview */}
                <button
                  type="button"
                  onClick={() => setShowOverview(true)}
                  className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                  title="Back to overview"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                  {currentEntry.tab.id}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{currentEntry.question.meaning}</span>
                <span className="ml-auto text-[10px] text-slate-600">{currentIndex + 1} / {ALL_QUESTIONS.length}</span>
              </div>
              <p className="text-[22px] font-semibold leading-[1.45] text-white">
                {currentEntry.question.question}
              </p>
            </div>

            {/* Answer textarea — fills remaining space */}
            <div className="overflow-y-auto px-6 py-5">
              <textarea
                key={currentEntry.question.id}
                value={answers[currentEntry.question.id] ?? ""}
                onChange={(e) => onAnswerChange(currentEntry.question.id, e.target.value)}
                placeholder="Type your response here..."
                className="h-full min-h-[120px] w-full resize-none bg-transparent text-base leading-8 text-slate-100 outline-none placeholder:text-slate-700"
                autoFocus
              />
            </div>

            {/* Footer — exact fixed height via grid row, buttons never move */}
            <div className="flex items-center justify-between border-t border-white/10 px-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1.5">
                {ARCHITECT_TABS.map((tab) => {
                  const answered = tab.questions.filter((q) => answers[q.id]?.trim()).length;
                  const isActive = tab.id === (searchResults ? currentEntry.tab.id : selectedTabId);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      title={`${tab.id}: ${answered}/${tab.questions.length}`}
                      className={`h-1.5 rounded-full transition-all ${isActive ? "w-8 bg-cyan-400" : answered === tab.questions.length ? "w-4 bg-emerald-500/70" : answered > 0 ? "w-4 bg-cyan-500/40" : "w-4 bg-white/15"}`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex === ALL_QUESTIONS.length - 1}
                className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15 disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="col-span-full flex items-center justify-center text-slate-600">No questions available</div>
        )}
      </div>
    </div>
  );
}
