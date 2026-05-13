import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Ambulance, Navigation, Radio, Loader2 } from "lucide-react";
import { FlowShell, OptionGrid, FlowNav } from "./FlowShell";
import { Stepper } from "./Stepper";
import { api, type AmbulanceProviderData, type AmbulanceRequestData } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { HospitalMap, LocationPickerMap } from "./GoogleMap";

const STEPS = ["Purpose", "Type", "Pickup", "Destination", "Vehicle", "Dispatch"];

const PURPOSES = [
  { id: "trauma", label: "Accident / Trauma" },
  { id: "icu", label: "ICU Transfer" },
  { id: "cardiac", label: "Cardiac Emergency" },
  { id: "stroke", label: "Stroke Emergency" },
  { id: "breathing", label: "Breathing Difficulty" },
  { id: "neonatal", label: "Pregnancy / Neonatal" },
  { id: "transfer", label: "Hospital Transfer" },
  { id: "other", label: "Other" },
];

const TYPES = [
  { id: "bls", label: "Basic Life Support", hint: "Stable patient transport" },
  { id: "als", label: "Advanced Life Support", hint: "Advanced critical care" },
  { id: "card", label: "Cardiac Ambulance", hint: "Defib + cardiac team" },
  { id: "neo", label: "Neonatal Ambulance", hint: "Incubator equipped" },
  { id: "ox", label: "Oxygen Support", hint: "High-flow oxygen" },
];

const DEST_OPTS = [
  { id: "select", label: "Select from available hospitals" },
  { id: "manual", label: "Enter destination manually" },
  { id: "auto", label: "Find nearest suitable hospital" },
];

const DISPATCH_STAGES = ["Request received", "Vehicle assigned", "En route", "Arrived"];

export function AmbulanceFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const geoLocation = useLocation();
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [pickupTab, setPickupTab] = useState<"live" | "manual">("live");
  const [pickup, setPickup] = useState({ city: "Bengaluru", area: "", full: "", landmark: "" });
  const [pickupLoc, setPickupLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [destMode, setDestMode] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<number | null>(null);
  const [vehicleName, setVehicleName] = useState("");

  const [ambulances, setAmbulances] = useState<AmbulanceProviderData[]>([]);
  const [dispatchResult, setDispatchResult] = useState<AmbulanceRequestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (open) api.ambulances.list().then(setAmbulances).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (pickupTab === "live" && !pickupLoc && geoLocation.location) {
      setPickupLoc({ lat: geoLocation.location.lat, lng: geoLocation.location.lng });
    }
  }, [pickupTab, pickupLoc, geoLocation.location]);

  const close = () => { onClose(); setTimeout(() => { setStep(0); setDispatchResult(null); setStage(0); }, 300); };
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleDispatch = async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const res = await api.ambulances.createRequest({
        providerId: vehicle,
        purpose: purpose || "other",
        ambulanceType: TYPES.find((t) => t.id === type)?.label || "Basic Life Support",
        pickupCity: pickup.city,
        pickupArea: pickup.area,
        pickupAddress: pickup.full,
        pickupLandmark: pickup.landmark,
        destinationType: destMode,
        email: user?.email,
      });
      setDispatchResult(res);
      next();
      // Simulate dispatch stages
      let s = 0;
      const iv = setInterval(() => {
        s++;
        setStage(s);
        if (s >= DISPATCH_STAGES.length - 1) clearInterval(iv);
      }, 3000);
    } catch { } finally {
      setLoading(false);
    }
  };

  const canNext = (() => {
    switch (step) {
      case 0: return !!purpose;
      case 1: return !!type;
      case 2: return pickupTab === "live" || (!!pickup.area && !!pickup.full);
      case 3: return !!destMode;
      case 4: return !!vehicle;
      default: return true;
    }
  })();

  const onNext = () => {
    if (step === 4) { handleDispatch(); return; }
    if (step === STEPS.length - 1) { close(); return; }
    next();
  };

  return (
    <FlowShell open={open} onClose={close} title="Dispatch an Ambulance" subtitle="Request the right vehicle for the emergency" accent="Ambulance Request">
      <div className="mb-6"><Stepper steps={STEPS} current={step} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {step === 0 && <Section title="Why do you need an ambulance?"><OptionGrid cols={2} options={PURPOSES} value={purpose} onChange={setPurpose} /></Section>}
          {step === 1 && <Section title="Select ambulance type"><OptionGrid cols={2} options={TYPES} value={type} onChange={setType} /></Section>}
          {step === 2 && (
            <Section title="Pickup location">
              <div className="flex gap-2 mb-4">
                {(["live", "manual"] as const).map((t) => (
                  <button key={t} onClick={() => setPickupTab(t)} className={`px-4 py-2 rounded-lg text-sm border ${pickupTab === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                    {t === "live" ? "Use Live Location" : "Enter Address Manually"}
                  </button>
                ))}
              </div>
              {pickupTab === "live" ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    {pickupLoc ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 flex items-center justify-center"><Navigation className="w-5 h-5 text-[#22C55E]" /></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm flex items-center gap-2">Location detected <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /></div>
                          <div className="text-xs text-muted-foreground">{pickupLoc.lat.toFixed(4)}, {pickupLoc.lng.toFixed(4)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Enable location access</div>
                          <div className="text-xs text-muted-foreground">Allow GPS for fastest ambulance dispatch</div>
                        </div>
                        <button onClick={async () => {
                          const loc = await geoLocation.requestLocation();
                          if (loc) setPickupLoc({ lat: loc.lat, lng: loc.lng });
                        }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-crimson">
                          {geoLocation.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Allow"}
                        </button>
                      </>
                    )}
                  </div>
                  <LocationPickerMap
                    userLat={pickupLoc?.lat}
                    userLng={pickupLoc?.lng}
                    onUserLocationChange={(lat, lng) => setPickupLoc({ lat, lng })}
                    className="h-[240px]"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="City" value={pickup.city} onChange={(v: string) => setPickup({ ...pickup, city: v })} />
                  <Field label="Area / Locality" value={pickup.area} onChange={(v: string) => setPickup({ ...pickup, area: v })} />
                  <Field label="Full Pickup Address" value={pickup.full} onChange={(v: string) => setPickup({ ...pickup, full: v })} className="sm:col-span-2" />
                  <Field label="Landmark" value={pickup.landmark} onChange={(v: string) => setPickup({ ...pickup, landmark: v })} className="sm:col-span-2" />
                </div>
              )}
            </Section>
          )}
          {step === 3 && <Section title="Destination"><OptionGrid cols={3} options={DEST_OPTS} value={destMode} onChange={setDestMode} /></Section>}
          {step === 4 && (
            <Section title="Available ambulances">
              <div className="space-y-3">
                {ambulances.map((a) => {
                  const sel = vehicle === a.id;
                  return (
                    <div key={a.id} className={`glass-card rounded-xl p-4 flex items-center justify-between gap-4 transition ${sel ? "ring-2 ring-primary red-glow-soft" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center"><Ambulance className="w-5 h-5" /></div>
                        <div>
                          <div className="font-semibold">{a.providerName}</div>
                          <div className="text-xs text-muted-foreground">{a.vehicleType} · {a.area} · <span className={a.status === "available" ? "text-[#22C55E]" : "text-[#F59E0B]"}>{a.status}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{a.etaMinutes} min</div>
                        <button onClick={() => { setVehicle(a.id); setVehicleName(a.providerName); }}
                          disabled={a.status !== "available"}
                          className="mt-1 text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-crimson disabled:opacity-40">
                          {sel ? "Selected" : "Dispatch"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
          {step === 5 && dispatchResult && (
            <Section title="Dispatch confirmed">
              <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-[#3A0005] to-black p-5 space-y-2 text-sm">
                <Row k="Request ID" v={dispatchResult.requestCode} />
                <Row k="Provider" v={vehicleName} />
                <Row k="ETA" v={`${ambulances.find((a) => a.id === vehicle)?.etaMinutes || "—"} min`} />
                <Row k="Pickup" v={pickupTab === "live" ? "Live location" : pickup.full || "—"} />
                <Row k="Status" v={DISPATCH_STAGES[stage]} tone={stage >= 2 ? "success" : "warn"} />
              </div>
              <div className="mt-4">
                <LocationPickerMap
                  userLat={pickupLoc?.lat}
                  userLng={pickupLoc?.lng}
                  className="h-[180px] grayscale brightness-75 contrast-125 opacity-80"
                />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Tracking</span><span><Radio className="w-3 h-3 inline animate-pulse-red text-primary" /> live</span>
                </div>
                <div className="relative h-2 rounded-full bg-elevated overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((stage + 1) / DISPATCH_STAGES.length) * 100}%` }} transition={{ duration: 1.2 }} className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-crimson" />
                </div>
                <div className="grid grid-cols-4 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {DISPATCH_STAGES.map((s, i) => (
                    <span key={s} className={i <= stage ? "text-foreground" : ""}><Navigation className={`w-3 h-3 inline ${i <= stage ? "text-primary" : ""}`} /> {s}</span>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </motion.div>
      </AnimatePresence>
      <FlowNav hideBack={step === 0} onBack={back} onNext={onNext}
        nextLabel={step === STEPS.length - 1 ? "Done" : step === 4 ? (loading ? "Dispatching…" : "Dispatch Ambulance") : "Continue"}
        disabled={!canNext || loading} />
    </FlowShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-lg font-bold mb-4">{title}</h3>{children}</div>;
}
function Field({ label, value, onChange, className = "" }: any) {
  return (<label className={`block ${className}`}><span className="text-xs text-muted-foreground">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></label>);
}
function Row({ k, v, tone }: { k: string; v: string; tone?: "warn" | "success" }) {
  const c = tone === "success" ? "text-[#22C55E]" : tone === "warn" ? "text-[#F59E0B]" : "text-foreground";
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className={`font-semibold ${c}`}>{v}</span></div>;
}
