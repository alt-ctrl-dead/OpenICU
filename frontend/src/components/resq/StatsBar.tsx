import { Activity, BedDouble, Ambulance, Timer } from "lucide-react";
import { motion } from "framer-motion";
import type { StatsData } from "@/lib/api";

export function StatsBar({ data }: { data?: StatsData }) {
  const stats = [
    { icon: Activity, value: data ? String(data.liveHospitals) : "—", label: "Live Hospitals" },
    { icon: BedDouble, value: data ? String(data.icuBedsTracked) : "—", label: "ICU Beds Tracked" },
    { icon: Ambulance, value: data ? String(data.ambulancesNearby) : "—", label: "Ambulances Nearby" },
    { icon: Timer, value: data?.avgResponseTime || "—", label: "Avg Response" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
          className="glass-panel rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary"><s.icon className="w-4 h-4" /></div>
          <div className="leading-tight"><div className="text-lg font-bold text-foreground">{s.value}</div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div></div>
        </motion.div>
      ))}
    </div>
  );
}
