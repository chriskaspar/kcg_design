import { ClipboardCopy, Sparkles } from "lucide-react";
import { STORY_FIELDS } from "../lib/architectFramework";
import type { StoryOutput } from "../types/architect";

interface StoryTabProps {
  story: StoryOutput | null;
}

export function StoryTab({ story }: StoryTabProps) {
  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
          Executive Narrative
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Story</h2>
        <p className="mt-1 text-sm text-slate-400">
          Your architecture narrative compiled from all Discovery responses.
        </p>
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
            Use <strong className="text-white">View / Update</strong> to generate your story narrative.
          </p>
        </div>
      )}
    </div>
  );
}
