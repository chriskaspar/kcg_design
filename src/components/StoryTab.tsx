import { Activity, ClipboardCopy, Sparkles } from "lucide-react";
import { ARCHITECT_TABS, STORY_FIELDS } from "../lib/architectFramework";
import type { ArchitectAnswers, StoryOutput } from "../types/architect";

interface StoryTabProps {
  story: StoryOutput | null;
  answers: ArchitectAnswers;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function StoryTab({ story, answers, onGenerate, isGenerating }: StoryTabProps) {
  const allQuestionIds = ARCHITECT_TABS.flatMap((t) => t.questions.map((q) => q.id));
  const totalQuestions = allQuestionIds.length;
  const answeredQuestions = allQuestionIds.filter((id) => answers[id]?.trim().length > 0).length;
  const overallProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const hasEnoughAnswers = answeredQuestions > 0;

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header + generate */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
              Executive Narrative
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">Story</h2>
            <p className="mt-1 text-sm text-slate-400">
              Your architecture narrative compiled from all Discovery responses.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !hasEnoughAnswers}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Story"}
          </button>
        </div>

        {/* Overall progress */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discovery completion</span>
            <span
              className={
                answeredQuestions === totalQuestions ? "text-emerald-300" : "text-slate-300"
              }
            >
              {answeredQuestions} / {totalQuestions} questions answered
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Per-tab pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {ARCHITECT_TABS.map((tab) => {
            const tabAnswered = tab.questions.filter(
              (q) => answers[q.id]?.trim().length > 0
            ).length;
            const complete = tabAnswered === tab.questions.length;
            const partial = tabAnswered > 0 && !complete;
            return (
              <span
                key={tab.id}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  complete
                    ? "bg-emerald-500/20 text-emerald-300"
                    : partial
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "bg-white/8 text-slate-500"
                }`}
              >
                {tab.word} {tabAnswered}/{tab.questions.length}
              </span>
            );
          })}
        </div>
      </div>

      {/* Story output */}
      {story ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {STORY_FIELDS.map((field) => {
            const value = story[field.id as keyof StoryOutput] ?? "";
            return (
              <div
                key={field.id}
                className="rounded-[20px] border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                      {field.hint}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-white">{field.label}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(value)}
                    className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/15"
                  >
                    <ClipboardCopy className="mr-1.5 inline h-3 w-3" />
                    Copy
                  </button>
                </div>
                <p className="text-sm leading-7 text-slate-300">{value}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">
            Answer questions in Discovery, then click{" "}
            <strong className="text-white">Generate Story</strong> above.
          </p>
        </div>
      )}

      {/* Full Q&A summary — all answers organized by ARCHITECT tab */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          All Discovery Responses
        </h3>
        {ARCHITECT_TABS.map((tab) => {
          const tabAnswers = tab.questions.filter((q) => answers[q.id]?.trim());
          if (tabAnswers.length === 0) return null;
          return (
            <div
              key={tab.id}
              className="overflow-hidden rounded-[20px] border border-white/10 bg-white/5"
            >
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                    {tab.id}
                  </span>
                  <span className="text-xs text-slate-500">{tab.description}</span>
                  <span className="ml-auto text-[10px] text-slate-600">
                    {tabAnswers.length}/{tab.questions.length} answered
                  </span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {tab.questions.map((q) => {
                  const answer = answers[q.id]?.trim();
                  if (!answer) return null;
                  return (
                    <div key={q.id} className="px-6 py-4">
                      <p className="mb-2 text-xs font-medium text-slate-400">{q.question}</p>
                      <p className="text-sm leading-6 text-slate-200">{answer}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
