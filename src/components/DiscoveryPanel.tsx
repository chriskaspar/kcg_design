import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ARCHITECT_TABS } from "../lib/architectFramework";
import type { ArchitectAnswers } from "../types/architect";

interface DiscoveryPanelProps {
  answers: ArchitectAnswers;
  onAnswerChange: (questionId: string, value: string) => void;
}

// Build flat list of all questions for linear keyboard navigation
const ALL_QUESTIONS = ARCHITECT_TABS.flatMap((tab) =>
  tab.questions.map((question) => ({ tab, question }))
);

export function DiscoveryPanel({ answers, onAnswerChange }: DiscoveryPanelProps) {
  const [selectedTabId, setSelectedTabId] = useState(ARCHITECT_TABS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ARCHITECT_TABS[0].questions[0]?.meaning ?? ""
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    ARCHITECT_TABS[0].questions[0]?.id ?? ""
  );

  const currentIndex = ALL_QUESTIONS.findIndex((q) => q.question.id === selectedQuestionId);
  const currentEntry = ALL_QUESTIONS[currentIndex];

  const selectQuestion = useCallback((questionId: string) => {
    const found = ALL_QUESTIONS.find((q) => q.question.id === questionId);
    if (found) {
      setSelectedTabId(found.tab.id);
      setSelectedCategory(found.question.meaning);
      setSelectedQuestionId(questionId);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < ALL_QUESTIONS.length - 1) {
      selectQuestion(ALL_QUESTIONS[currentIndex + 1].question.id);
    }
  }, [currentIndex, selectQuestion]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      selectQuestion(ALL_QUESTIONS[currentIndex - 1].question.id);
    }
  }, [currentIndex, selectQuestion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const handleTabSelect = (tabId: string) => {
    const tab = ARCHITECT_TABS.find((t) => t.id === tabId);
    if (!tab) return;
    setSelectedTabId(tabId);
    const firstQ = tab.questions[0];
    if (firstQ) {
      setSelectedCategory(firstQ.meaning);
      setSelectedQuestionId(firstQ.id);
    }
  };

  const handleCategorySelect = (tabId: string, category: string) => {
    setSelectedTabId(tabId);
    setSelectedCategory(category);
    const tab = ARCHITECT_TABS.find((t) => t.id === tabId);
    const firstQ = tab?.questions.find((q) => q.meaning === category);
    if (firstQ) setSelectedQuestionId(firstQ.id);
  };

  const currentTab = ARCHITECT_TABS.find((t) => t.id === selectedTabId) ?? ARCHITECT_TABS[0];
  const tabCategories = [...new Set(currentTab.questions.map((q) => q.meaning))];

  return (
    <div className="flex h-full min-h-0">
      {/* Left nav — 3 levels */}
      <nav className="flex w-[252px] shrink-0 flex-col overflow-y-auto border-r border-white/10">
        {ARCHITECT_TABS.map((tab) => {
          const isTabActive = tab.id === selectedTabId;
          const answeredCount = tab.questions.filter((q) => answers[q.id]?.trim()).length;
          const categories = [...new Set(tab.questions.map((q) => q.meaning))];

          return (
            <div key={tab.id}>
              {/* Level 1 — ARCHITECT tab */}
              <button
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  isTabActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-bold tracking-[0.2em] ${
                      isTabActive ? "text-cyan-300" : "text-slate-500"
                    }`}
                  >
                    {tab.id}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[100px]">
                    {tab.description.split(" ").slice(0, 3).join(" ")}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-medium ${
                    answeredCount === tab.questions.length
                      ? "text-emerald-400"
                      : answeredCount > 0
                      ? "text-cyan-400"
                      : "text-slate-600"
                  }`}
                >
                  {answeredCount}/{tab.questions.length}
                </span>
              </button>

              {/* Level 2 — Categories (only when tab is active) */}
              {isTabActive &&
                categories.map((category) => {
                  const isCatActive = category === selectedCategory;
                  const catQs = tab.questions.filter((q) => q.meaning === category);
                  const catAnswered = catQs.filter((q) => answers[q.id]?.trim()).length;

                  return (
                    <div key={category}>
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(tab.id, category)}
                        className={`flex w-full items-center justify-between py-2 pl-8 pr-4 text-left transition ${
                          isCatActive ? "text-cyan-200" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-xs font-medium">{category}</span>
                        <span
                          className={`text-[10px] ${
                            catAnswered === catQs.length ? "text-emerald-400" : "text-slate-600"
                          }`}
                        >
                          {catAnswered}/{catQs.length}
                        </span>
                      </button>

                      {/* Level 3 — Questions (only when category is active) */}
                      {isCatActive &&
                        catQs.map((q) => {
                          const isQActive = q.id === selectedQuestionId;
                          const isAnswered = Boolean(answers[q.id]?.trim());
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setSelectedQuestionId(q.id)}
                              className={`flex w-full items-start gap-2 py-1.5 pl-12 pr-3 text-left text-[11px] leading-5 transition ${
                                isQActive
                                  ? "bg-cyan-500/15 text-white"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                  isAnswered ? "bg-emerald-400" : "bg-slate-600"
                                }`}
                              />
                              <span className="line-clamp-2">{q.question}</span>
                            </button>
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Right panel — single question */}
      <div className="flex min-h-0 flex-1 flex-col">
        {currentEntry && (
          <>
            {/* Question header */}
            <div className="border-b border-white/10 px-8 py-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                  {currentEntry.tab.id}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {currentEntry.question.meaning}
                </span>
                <span className="ml-auto text-[10px] text-slate-600">
                  {currentIndex + 1} / {ALL_QUESTIONS.length}
                </span>
              </div>
              <p className="text-[22px] font-semibold leading-[1.45] text-white">
                {currentEntry.question.question}
              </p>
            </div>

            {/* Answer textarea */}
            <div className="flex min-h-0 flex-1 flex-col px-8 py-6">
              <textarea
                key={currentEntry.question.id}
                value={answers[currentEntry.question.id] ?? ""}
                onChange={(e) => onAnswerChange(currentEntry.question.id, e.target.value)}
                placeholder="Type your response here..."
                className="min-h-0 flex-1 resize-none bg-transparent text-base leading-8 text-slate-100 outline-none placeholder:text-slate-700"
                autoFocus
              />
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-8 py-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* Tab-level progress pills */}
              <div className="flex items-center gap-1.5">
                {ARCHITECT_TABS.map((tab) => {
                  const answered = tab.questions.filter((q) => answers[q.id]?.trim()).length;
                  const isActive = tab.id === selectedTabId;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      title={`${tab.id}: ${answered}/${tab.questions.length}`}
                      className={`h-1.5 rounded-full transition-all ${
                        isActive
                          ? "w-8 bg-cyan-400"
                          : answered === tab.questions.length
                          ? "w-4 bg-emerald-500/70"
                          : answered > 0
                          ? "w-4 bg-cyan-500/40"
                          : "w-4 bg-white/15"
                      }`}
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
        )}
      </div>
    </div>
  );
}
