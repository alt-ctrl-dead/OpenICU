import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 w-full overflow-x-auto pb-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <motion.div
              layout
              className={[
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
                done
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : active
                    ? "bg-primary text-primary-foreground border-primary red-glow-soft"
                    : "bg-card border-border text-muted-foreground",
              ].join(" ")}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px]">
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="w-6 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
