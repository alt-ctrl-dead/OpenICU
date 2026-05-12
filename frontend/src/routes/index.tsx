import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BedDouble, Ambulance, ShieldCheck, ArrowRight, X,
  Activity, Building2, MapPin, Clock, Radio, Star, Lock, FileLock2, Eye, Navigation
} from "lucide-react";
import { HeroScene } from "@/components/resq/HeroScene";
import { BookBedFlow, HospitalDetailModal } from "@/components/resq/BookBedFlow";
import { AmbulanceFlow } from "@/components/resq/AmbulanceFlow";
import { ProfilePanel } from "@/components/resq/ProfilePanel";
import { StatsBar } from "@/components/resq/StatsBar";
import { useAuth } from "@/context/AuthContext";
import { api, type HospitalData, type AmbulanceProviderData, type AuditEventData, type StatsData } from "@/lib/api";
import { LocationPickerMap } from "@/components/resq/GoogleMap";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "OpenICU — Emergency care access when every minute matters" }] }),
  component: Index,
});

const PRIVACY = [
  { i: ShieldCheck, t: "Consent first", d: "Patient contact details are stored only with explicit consent." },
  { i: FileLock2, t: "No silent records", d: "OpenICU does not copy hospital patient files into the platform." },
  { i: Eye, t: "Audit log", d: "Every reservation, dispatch, and hospital update is timestamped and reviewable." },
  { i: Lock, t: "Secure uploads", d: "Uploaded reports are used only for the selected emergency request." },
  { i: ShieldCheck, t: "Data minimization", d: "Only the data needed for the current request is collected." },
];

const AUDIT_ICONS: Record<string, typeof Activity> = {
  bed_update: BedDouble, ambulance_dispatch: Ambulance, reservation_created: Activity,
  hospital_verify: ShieldCheck, payment_created: BedDouble, ai_recommendation: Activity,
};

function timeAgo(date: string): string {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)}h ago`;
}

function Index() {
  const { user } = useAuth();
  const [bedOpen, setBedOpen] = useState(false);
  const [ambOpen, setAmbOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [detail, setDetail] = useState<"icu" | "ambulance" | "activity" | "privacy" | null>(null);
  const [hospitalDetail, setHospitalDetail] = useState<HospitalData | null>(null);

  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceProviderData[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  const fetchAll = () => {
    api.hospitals.list().then(setHospitals).catch(() => {});
    api.ambulances.list().then(setAmbulances).catch(() => {});
    api.audit.list(10).then(setAuditEvents).catch(() => {});
    api.stats.get().then(setStats).catch(() => {});
  };

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 15000); return () => clearInterval(iv); }, []);

  return (
    <div className="relative min-h-screen text-foreground">
      <section className="relative min-h-[100svh] flex flex-col">
        <HeroScene />
        <header className="relative z-20 flex items-center justify-between px-5 md:px-10 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center red-glow-soft"><Plus className="w-6 h-6" strokeWidth={3} /></div>
            <div className="leading-tight"><div className="font-extrabold tracking-tight text-lg">OpenICU</div><div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Emergency Network</div></div>
          </div>
          <button onClick={() => setAuthOpen(true)} className="px-4 py-1.5 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition text-sm font-medium">
            {user ? user.email.split("@")[0] : "Sign in"}
          </button>
        </header>

        <div className="relative z-10 flex-1 flex items-center px-5 md:px-10">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-[11px] uppercase tracking-[0.35em] text-primary font-semibold mb-3">OpenICU</div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.02] tracking-tight">Emergency care access <span className="text-gradient-red">when every minute matters</span>.</h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => setBedOpen(true)} className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base red-glow hover:bg-crimson transition">
                <BedDouble className="w-5 h-5" /> Book Bed <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <button onClick={() => setAmbOpen(true)} className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-black/50 border border-primary text-foreground font-semibold text-base hover:bg-primary/15 transition backdrop-blur">
                <Ambulance className="w-5 h-5 text-primary" /> Call Ambulance
              </button>
            </motion.div>
            {stats && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8"><StatsBar data={stats} /></motion.div>}
          </div>
        </div>
        <div className="relative z-10 pb-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Scroll for live network</div>
      </section>

      <main className="relative z-10 px-5 md:px-10 py-16 space-y-16">
        <Sec eyebrow="Live network" title="Live ICU Network" onOpen={() => setDetail("icu")}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.slice(0, 6).map((h) => (
              <button key={h.id} onClick={() => setHospitalDetail(h)} className="text-left glass-card rounded-2xl p-5 hover:border-primary/60 transition group hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary shrink-0" /><h4 className="font-semibold truncate">{h.name}</h4></div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{h.area}</div></div>
                  <SBadge s={h.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3"><Met k="ICU" v={h.icu} /><Met k="Ventilator" v={h.ven} /></div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-warning"><Star className="w-3 h-3 fill-warning" /> {h.rating} · {h.reviewCount.toLocaleString()}</span>
                  <span className="text-primary font-semibold inline-flex items-center gap-1">View details <ArrowRight className="w-3 h-3" /></span>
                </div>
              </button>))}
          </div>
        </Sec>

        <Sec eyebrow="Interactive" title="Explore Nearby Facilities">
          <div className="rounded-2xl overflow-hidden border border-border/60 glass-card">
            <div className="p-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Hospital Map — Bengaluru Network</span>
              </div>
              <div className="text-[10px] text-muted-foreground flex gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Hospital</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Patient</span>
              </div>
            </div>
            <div className="h-[400px]">
              <LocationPickerMap 
                hospitals={hospitals.filter(h => h.latitude && h.longitude).map(h => ({
                  lat: h.latitude, lng: h.longitude, name: h.name, beds: h.icu
                }))}
              />
            </div>
            <div className="p-3 bg-elevated/40 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Navigation className="w-3 h-3" /> Click on markers to view bed availability and emergency status.
            </div>
          </div>
        </Sec>

        <Sec eyebrow="Fleet" title="Ambulances Nearby" onOpen={() => setDetail("ambulance")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ambulances.slice(0, 4).map((a) => (
              <button key={a.id} onClick={() => setAmbOpen(true)} className="text-left glass-card rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-primary/60 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center"><Ambulance className="w-5 h-5" /></div>
                  <div><div className="font-semibold">{a.providerName}</div><div className="text-xs text-muted-foreground">{a.vehicleType} · {a.area}</div></div>
                </div>
                <div className="text-right"><div className="text-2xl font-bold">{a.etaMinutes} min</div><span className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground inline-block mt-1">Dispatch</span></div>
              </button>))}
          </div>
        </Sec>

        <Sec eyebrow="Audit" title="Recent Emergency Activity" onOpen={() => setDetail("activity")}>
          <div className="glass-card rounded-2xl divide-y divide-border/60">
            {auditEvents.slice(0, 5).map((ev) => { const Icon = AUDIT_ICONS[ev.eventType] || Activity; return (
              <button key={ev.id} onClick={() => setDetail("activity")} className="w-full text-left flex items-center justify-between p-4 hover:bg-primary/5 transition">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div><span className="text-sm">{ev.message}</span></div>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(ev.createdAt)}</span>
              </button>); })}
          </div>
        </Sec>

        <Sec eyebrow="Trust" title="Privacy & Trust" onOpen={() => setDetail("privacy")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRIVACY.slice(0, 3).map((p) => (
              <button key={p.t} onClick={() => setDetail("privacy")} className="text-left glass-card rounded-2xl p-5 hover:border-primary/60 transition">
                <p.i className="w-6 h-6 text-primary" /><h4 className="font-semibold mt-3">{p.t}</h4><p className="text-sm text-muted-foreground mt-1">{p.d}</p>
              </button>))}
          </div>
        </Sec>
      </main>

      <footer className="relative z-10 border-t border-border/60 px-5 md:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© OpenICU · Bengaluru emergency network · Prototype build</div>
        <div className="inline-flex items-center gap-2"><Radio className="w-3 h-3 text-primary animate-pulse-red" /> Network status: operational</div>
      </footer>

      <BookBedFlow open={bedOpen} onClose={() => setBedOpen(false)} />
      <AmbulanceFlow open={ambOpen} onClose={() => setAmbOpen(false)} />
      <ProfilePanel open={authOpen} onClose={() => setAuthOpen(false)} />
      <HospitalDetailModal hospital={hospitalDetail} onClose={() => setHospitalDetail(null)} onReserve={() => { setHospitalDetail(null); setBedOpen(true); }} onAmbulance={() => { setHospitalDetail(null); setAmbOpen(true); }} />

      <DetailDrawer open={detail !== null} onClose={() => setDetail(null)}
        title={detail === "icu" ? "Live ICU Network — Bengaluru" : detail === "ambulance" ? "Ambulances Nearby" : detail === "activity" ? "Recent Emergency Activity" : detail === "privacy" ? "Privacy & Trust" : ""}>
        {detail === "icu" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{hospitals.map((h) => (
          <div key={h.id} className="glass-card rounded-2xl p-5 hover:border-primary/60 transition">
            <div className="flex items-start justify-between"><div><h4 className="font-semibold">{h.name}</h4><div className="text-xs text-muted-foreground mt-1">{h.area} · ★ {h.rating}</div></div><SBadge s={h.status} /></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Met k="ICU" v={h.icu} /><Met k="Ventilator" v={h.ven} /></div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setDetail(null); setHospitalDetail(h); }} className="flex-1 py-2 rounded-lg border border-border bg-card text-xs hover:border-primary/60">View Details</button>
              <button onClick={() => { setDetail(null); setBedOpen(true); }} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-crimson">Reserve Bed</button>
            </div></div>))}</div>}
        {detail === "ambulance" && <div className="space-y-3">{ambulances.map((a) => (
          <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center"><Ambulance className="w-5 h-5" /></div>
              <div><div className="font-semibold">{a.providerName}</div><div className="text-xs text-muted-foreground">{a.vehicleType} · {a.area} · <span className={a.status === "available" ? "text-success" : "text-warning"}>{a.status}</span></div></div></div>
            <div className="text-right"><div className="text-xl font-bold">{a.etaMinutes} min</div><button onClick={() => { setDetail(null); setAmbOpen(true); }} className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-crimson mt-1">Dispatch</button></div>
          </div>))}</div>}
        {detail === "activity" && <div className="relative pl-6 space-y-5"><div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {auditEvents.map((ev) => { const Icon = AUDIT_ICONS[ev.eventType] || Activity; return (
            <div key={ev.id} className="relative"><div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full bg-primary red-glow-soft" />
              <div className="glass-card rounded-xl p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium"><Icon className="w-4 h-4 text-primary" />{ev.message}</div><span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(ev.createdAt)}</span></div></div></div>); })}</div>}
        {detail === "privacy" && <div className="space-y-4">{PRIVACY.map((p) => (
          <div key={p.t} className="glass-card rounded-xl p-5 flex gap-4"><div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0"><p.i className="w-5 h-5" /></div>
            <div><h4 className="font-semibold">{p.t}</h4><p className="text-sm text-muted-foreground mt-1">{p.d}</p></div></div>))}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">Direct user contact information is stored only with consent. Hospital-side patient records are not copied into OpenICU.</p></div>}
      </DetailDrawer>
    </div>
  );
}

function Sec({ eyebrow, title, children, onOpen }: { eyebrow: string; title: string; children: React.ReactNode; onOpen?: () => void }) {
  return (<section><div className="mb-6 flex items-end justify-between gap-4"><div><div className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">{eyebrow}</div><h2 className="text-2xl md:text-3xl font-bold mt-1">{title}</h2></div>
    {onOpen && <button onClick={onOpen} className="text-xs uppercase tracking-widest text-primary hover:text-crimson inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>}</div>{children}</section>);
}
function SBadge({ s }: { s: string }) {
  const map: Record<string, string> = { Live: "border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10", Verified: "border-primary/40 text-primary bg-primary/10", Stale: "border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[s] || map.Stale}`}>{s}</span>;
}
function Met({ k, v }: { k: string; v: number }) {
  return (<div className="rounded-lg bg-elevated/60 border border-border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-bold">{v}</div></div>);
}
function DetailDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (<AnimatePresence>{open && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 28 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="glass-panel relative w-full md:max-w-3xl md:rounded-2xl flex flex-col max-h-screen md:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-gradient-to-b from-elevated to-transparent">
          <div><div className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">OpenICU</div><h2 className="text-xl md:text-2xl font-bold mt-1">{title}</h2></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-border bg-black/40 hover:bg-primary/20 hover:border-primary text-muted-foreground hover:text-foreground transition flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 md:p-6">{children}</div>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>);
}
