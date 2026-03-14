import { useState, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JsonEditorModalProps {
  title: string;
  subtitle?: string;
  value: unknown;
  open: boolean;
  onSave: (parsed: unknown) => void;
  onClose: () => void;
}

export function JsonEditorModal({ title, subtitle, value, open, onSave, onClose }: JsonEditorModalProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(JSON.stringify(value, null, 2));
      setError(null);
    }
  }, [open, value]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(draft);
      setError(null);
      onSave(parsed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="flex h-[min(85vh,740px)] w-full max-w-[800px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_40px_100px_rgba(2,6,23,0.7)]"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">JSON Editor</p>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="rounded-full bg-white/8 p-2 text-slate-400 hover:bg-white/12 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Editor */}
            <div className="flex min-h-0 flex-1 flex-col">
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(null); }}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-200 outline-none"
                style={{ tabSize: 2 }}
              />
            </div>

            {/* Error */}
            {error ? (
              <div className="border-t border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
              <p className="text-[11px] text-slate-600">
                <span className="text-slate-400">⌘ + Enter</span> to apply
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="rounded-full bg-white/8 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/12">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
