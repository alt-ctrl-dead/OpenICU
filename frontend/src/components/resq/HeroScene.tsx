import { motion } from "framer-motion";
import hospitalImg from "@/assets/hospital.png";
import ambulanceImg from "@/assets/hero-scene.png";

export function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* deep gradient sky */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(58,0,5,0.65),transparent_60%),linear-gradient(180deg,#050505_0%,#0B0B0F_60%,#050505_100%)]" />

      {/* sweeping red beams */}
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[140vmin] h-[140vmin] pointer-events-none">
        <div className="absolute inset-0 animate-beam">
          <div className="absolute left-1/2 top-1/2 w-[2px] h-[70vmin] -translate-x-1/2 -translate-y-full bg-gradient-to-t from-[#FF1E2D]/0 via-[#FF1E2D]/40 to-[#FF1E2D]/0 blur-[2px]" />
          <div className="absolute left-1/2 top-1/2 w-[2px] h-[70vmin] -translate-x-1/2 -translate-y-full rotate-120 origin-bottom bg-gradient-to-t from-[#E50914]/0 via-[#E50914]/30 to-transparent blur-[3px]" />
        </div>
      </div>

      {/* scene */}
      <div className="absolute left-1/2 top-[72%] -translate-x-1/2 -translate-y-1/2 w-[min(110vw,1200px)] aspect-square">
        {/* Hospital */}
        <motion.img
          src={hospitalImg}
          alt="Hospital"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-1/2 top-[6%] -translate-x-1/2 w-[44%] drop-shadow-[0_30px_60px_rgba(229,9,20,0.35)]"
        />
        {/* Hospital + sign red glow overlay */}
        <div className="absolute left-1/2 top-[14%] -translate-x-1/2 w-[10%] aspect-square rounded-full bg-[#FF1E2D]/40 blur-3xl animate-pulse-red" />

        {/* Ambulance */}
        <motion.img
          src={ambulanceImg}
          alt="Ambulance"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
          className="absolute left-[18%] top-[40%] w-[58%] drop-shadow-[0_25px_40px_rgba(0,0,0,0.8)]"
        />
        {/* ambulance light glow */}
        <div className="absolute left-[44%] top-[48%] w-24 h-24 rounded-full bg-[#FF1E2D] blur-3xl animate-pulse-red opacity-70" />

        {/* Rotating circular platform */}
        <div className="absolute left-1/2 top-[78%] -translate-x-1/2 w-[95%] aspect-[2/1] pointer-events-none">
          <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(229,9,20,0.18),transparent_70%)]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            className="absolute inset-0 rounded-[50%] border border-[#E50914]/30"
            style={{
              backgroundImage:
                "conic-gradient(from 0deg, rgba(229,9,20,0.0), rgba(229,9,20,0.35), rgba(255,30,45,0.0), rgba(229,9,20,0.25), rgba(229,9,20,0.0))",
              maskImage:
                "radial-gradient(ellipse at center, black 40%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 90, ease: "linear", repeat: Infinity }}
            className="absolute inset-[8%] rounded-[50%] border border-dashed border-[#E50914]/20"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, ease: "linear", repeat: Infinity }}
            className="absolute inset-[18%] rounded-[50%] border border-[#E50914]/15"
          />
        </div>
      </div>

      {/* drifting particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute block w-1 h-1 rounded-full bg-[#FF1E2D] animate-drift"
            style={{
              left: `${(i * 53) % 100}%`,
              bottom: `${(i * 17) % 40}%`,
              animationDelay: `${(i % 9) * 1.1}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* dark overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
    </div>
  );
}
