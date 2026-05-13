import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function FlowShell({
  open,
  onClose,
  title,
  subtitle,
  accent,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel relative w-full md:max-w-3xl md:rounded-2xl overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]"
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border/60 bg-gradient-to-b from-[#18181F] to-transparent">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                  {accent ?? "ResQ Bengaluru"}
                </div>
                <h2 className="text-xl md:text-2xl font-bold mt-1">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-border bg-black/40 hover:bg-primary/20 hover:border-primary text-muted-foreground hover:text-foreground transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 md:p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OptionGrid({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { id: string; label: string; hint?: string; tone?: "default" | "critical" | "high" | "medium" }[];
  value: string | null;
  onChange: (id: string) => void;
  cols?: 2 | 3;
}) {
  const toneMap: Record<string, string> = {
    critical: "from-[#E50914]/30 to-[#3A0005]/40 border-[#E50914]/60",
    high: "from-[#FF1E2D]/15 to-[#3A0005]/30 border-[#E50914]/40",
    medium: "from-[#F59E0B]/15 to-transparent border-[#F59E0B]/30",
  };
  return (
    <div className={`grid gap-3 ${cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {options.map((o) => {
        const selected = value === o.id;
        const toneCls = o.tone && o.tone !== "default" ? toneMap[o.tone] : "from-card to-card border-border";
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={[
              "text-left rounded-xl p-4 border bg-gradient-to-br transition-all duration-200",
              toneCls,
              selected ? "ring-2 ring-primary red-glow-soft scale-[1.01]" : "hover:border-primary/60 hover:-translate-y-0.5",
            ].join(" ")}
          >
            <div className="font-semibold">{o.label}</div>
            {o.hint && <div className="text-xs text-muted-foreground mt-1">{o.hint}</div>}
          </button>
        );
      })}
    </div>
  );
}

export function FlowNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  disabled,
  hideBack,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  disabled?: boolean;
  hideBack?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border/60">
      {!hideBack ? (
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-border bg-black/40 hover:bg-elevated text-sm"
        >
          Back
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={disabled}
        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-crimson red-glow-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {nextLabel}
      </button>
    </div>
  );
}
