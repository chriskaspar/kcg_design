import { useState } from "react";
import type { ArchitectAnswers, ArchitectTabDefinition } from "../types/architect";

interface ArchitectTabProps {
  tab: ArchitectTabDefinition;
  answers: ArchitectAnswers;
  onAnswerChange: (questionId: string, value: string) => void;
}

export function ArchitectTab({ tab, answers, onAnswerChange }: ArchitectTabProps) {
  const answeredCount = tab.questions.filter((q) => answers[q.id]?.trim().length > 0).length;
  const total = tab.questions.length;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  // Group questions by letter/meaning
  type QuestionGroup = { letter: string; meaning: string; questions: typeof tab.questions };
  const groups: QuestionGroup[] = [];
  const seen = new Set<string>();
  for (const q of tab.questions) {
    const key = `${q.letter}:${q.meaning}`;
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({ letter: q.letter, meaning: q.meaning, questions: [] });
    }
    groups.find((g) => `${g.letter}:${g.meaning}` === key)!.questions.push(q);
  }

  const groupKey = (g: QuestionGroup) => `${g.letter}:${g.meaning}`;
  const [activeGroup, setActiveGroup] = useState(groups[0] ? groupKey(groups[0]) : "");

  const currentGroup = groups.find((g) => groupKey(g) === activeGroup) ?? groups[0];
  const groupAnswered = (g: QuestionGroup) => g.questions.filter((q) => answers[q.id]?.trim().length > 0).length;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Tab header — full width */}
      <div className="border-b border-white/10 bg-slate-900/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">{tab.stage}</p>
            <h2 className="mt-1 text-xl font-bold text-white">{tab.word}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{tab.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${answeredCount === total ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"}`}>
              {answeredCount} / {total} answered
            </span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Category sub-tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {groups.map((g) => {
            const answered = groupAnswered(g);
            const isActive = groupKey(g) === activeGroup;
            const complete = answered === g.questions.length;
            return (
              <button
                key={groupKey(g)}
                type="button"
                onClick={() => setActiveGroup(groupKey(g))}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-500 text-slate-950"
                    : complete
                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-white/8 text-slate-400 hover:bg-white/12 hover:text-slate-200"
                }`}
              >
                <span className="font-bold">{g.letter}</span>
                <span className="hidden sm:inline">— {g.meaning}</span>
                {answered > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-slate-950/30" : "bg-white/15"}`}>
                    {answered}/{g.questions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions — full width, scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {currentGroup ? (
          <div className="px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
                {currentGroup.letter}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{currentGroup.meaning}</p>
                <p className="text-xs text-slate-500">{currentGroup.questions.length} question{currentGroup.questions.length !== 1 ? "s" : ""} in this category</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
              {currentGroup.questions.map((q, idx) => {
                const isAnswered = answers[q.id]?.trim().length > 0;
                return (
                  <div
                    key={q.id}
                    className={`flex flex-col rounded-[20px] border p-5 transition ${
                      isAnswered ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium leading-6 text-slate-100">{q.question}</p>
                    </div>
                    <textarea
                      value={answers[q.id] ?? ""}
                      onChange={(e) => onAnswerChange(q.id, e.target.value)}
                      placeholder="Enter your response..."
                      rows={4}
                      className="mt-auto w-full resize-y rounded-[14px] border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const idx = groups.findIndex((g) => groupKey(g) === activeGroup);
                  if (idx > 0) setActiveGroup(groupKey(groups[idx - 1]));
                }}
                disabled={groups[0] ? groupKey(groups[0]) === activeGroup : true}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/15 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-600">
                {groups.findIndex((g) => groupKey(g) === activeGroup) + 1} of {groups.length} categories
              </span>
              <button
                type="button"
                onClick={() => {
                  const idx = groups.findIndex((g) => groupKey(g) === activeGroup);
                  if (idx < groups.length - 1) setActiveGroup(groupKey(groups[idx + 1]));
                }}
                disabled={groups[groups.length - 1] ? groupKey(groups[groups.length - 1]) === activeGroup : true}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/15 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
