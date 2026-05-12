import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, MapPin, Building2, BadgeCheck, FileText, Star, Phone, Navigation, X,
  Activity, Heart, Stethoscope, Wind, Baby, Bug, ShieldAlert, Pill, HelpCircle, Ambulance,
  Loader2, Brain, Clock, Sparkles,
} from "lucide-react";
import { FlowShell, OptionGrid, FlowNav } from "./FlowShell";
import { Stepper } from "./Stepper";
import { api, type HospitalData, type RecommendedHospital, type ReservationData, type PaymentData } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { HospitalMap, LocationPickerMap } from "./GoogleMap";

const STEPS = ["Bed", "Urgency", "Issue", "Reports", "Location", "AI Pick", "Hospital", "Payment", "Confirm"];

const BED_TYPES = [
  { id: "icu", label: "ICU", hint: "Adult intensive care" },
  { id: "cicu", label: "Cardiac ICU", hint: "Cardiology unit" },
  { id: "nicu", label: "NICU", hint: "Neonatal ICU" },
  { id: "picu", label: "PICU", hint: "Pediatric ICU" },
  { id: "vent", label: "Ventilator Bed", hint: "Respiratory support" },
  { id: "er", label: "Emergency Ward", hint: "Triage & stabilisation" },
];

const URGENCY = [
  { id: "critical", label: "Critical", hint: "Immediate support required", tone: "critical" as const },
  { id: "high", label: "High", hint: "Care needed within 1 hour", tone: "high" as const },
  { id: "medium", label: "Medium", hint: "Planned urgent admission", tone: "medium" as const },
];

const ISSUES = [
  { id: "trauma", label: "Accident / Trauma", icon: ShieldAlert },
  { id: "cardiac", label: "Cardiac Emergency", icon: Heart },
  { id: "stroke", label: "Stroke / Neurological", icon: Activity },
  { id: "breathing", label: "Breathing Difficulty", icon: Wind },
  { id: "neonatal", label: "Pregnancy / Neonatal", icon: Baby },
  { id: "sepsis", label: "Severe Infection / Sepsis", icon: Bug },
  { id: "post", label: "Post-surgery Complication", icon: Stethoscope },
  { id: "poison", label: "Poisoning / Overdose", icon: Pill },
  { id: "other", label: "Other", icon: HelpCircle },
];

const REPORTS = ["Prescription", "Lab Report", "Scan / Imaging Report", "Referral Note", "Discharge Summary"];

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800",
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800",
  "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800",
];

export type Hospital = HospitalData;
export const HOSPITALS: HospitalData[] = [];

export function BookBedFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const geoLocation = useLocation();
  const [step, setStep] = useState(0);
  const [bed, setBed] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [issue, setIssue] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reports, setReports] = useState<Record<string, boolean>>({});
  const [locTab, setLocTab] = useState<"live" | "manual">("live");
  const [addr, setAddr] = useState({ city: "Bengaluru", area: "", full: "", landmark: "" });
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const [pay, setPay] = useState("upi");
  const [detail, setDetail] = useState<HospitalData | null>(null);

  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedHospital[]>([]);
  const [aiReasoning, setAiReasoning] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) api.hospitals.list().then(setHospitals).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (locTab === "live" && !userLoc && geoLocation.location) {
      setUserLoc({ lat: geoLocation.location.lat, lng: geoLocation.location.lng });
    }
  }, [locTab, userLoc, geoLocation.location]);

  const close = () => { onClose(); setTimeout(() => { setStep(0); setReservation(null); setPayment(null); setError(""); }, 300); };
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const runAI = async () => {
    setAiLoading(true);
    setError("");
    try {
      const res = await api.recommend({
        bedType: bed!,
        urgency: urgency || undefined,
        medicalSituation: issue || undefined,
        patientLat: userLoc?.lat,
        patientLng: userLoc?.lng,
        description: notes || undefined,
      });
      setRecommendations(res.recommendations);
      setAiReasoning(res.aiReasoning);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (step === 5 && bed) runAI();
  }, [step]);

  const handlePayment = async () => {
    if (!selectedHospitalId) return;
    setLoading(true);
    setError("");
    try {
      // Step 1: Create the reservation
      const res = await api.reservations.create({
        hospitalId: selectedHospitalId,
        bedType: BED_TYPES.find((b) => b.id === bed)?.label || bed,
        urgency,
        medicalSituation: issue,
        issueDescription: notes,
        patientCity: addr.city,
        patientArea: addr.area,
        patientAddress: addr.full,
        patientLandmark: addr.landmark,
        latitude: userLoc?.lat,
        longitude: userLoc?.lng,
        email: user?.email,
      });
      setReservation(res);

      // Step 2: Create Stripe PaymentIntent
      const intentRes = await api.payments.createIntent({ reservationId: res.id, amount: 10000 });
      
      // Step 3: Load Stripe and confirm the payment
      const { loadStripe } = await import("@stripe/stripe-js");
      const configRes = await api.payments.config();
      const stripe = await loadStripe(configRes.publishableKey);
      if (!stripe) throw new Error("Failed to load Stripe");

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(intentRes.clientSecret, {
        payment_method: {
          card: { token: "tok_visa" }, // Stripe test token for demo
          billing_details: { name: user?.name || "OpenICU Patient", email: user?.email },
        } as any,
      });

      if (stripeError) throw new Error(stripeError.message);

      // Step 4: Confirm with our backend
      const confirmRes = await api.payments.confirm({
        paymentIntentId: intentRes.paymentIntentId,
        reservationId: res.id,
      });
      setReservation(confirmRes.reservation);
      setPayment({ id: intentRes.paymentId, paymentCode: intentRes.paymentIntentId, amount: 10000, method: "stripe", status: "succeeded" });
      next();
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const canNext = (() => {
    switch (step) {
      case 0: return !!bed;
      case 1: return !!urgency;
      case 2: return !!issue;
      case 4: return locTab === "live" || (!!addr.area && !!addr.full);
      case 5: return !aiLoading;
      case 6: return !!selectedHospitalId;
      default: return true;
    }
  })();

  const onNext = () => {
    if (step === 7) { handlePayment(); return; }
    if (step === STEPS.length - 1) { close(); return; }
    next();
  };

  return (
    <>
      <FlowShell open={open} onClose={close} title="Book an Emergency Bed" subtitle="Find and reserve ICU & critical-care beds in Bengaluru" accent="OpenICU · Bed Reservation">
        <div className="mb-6"><Stepper steps={STEPS} current={step} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {step === 0 && <Section title="What type of bed do you need?"><OptionGrid cols={3} options={BED_TYPES} value={bed} onChange={setBed} /></Section>}
            {step === 1 && <Section title="How urgent is the case?"><OptionGrid cols={3} options={URGENCY} value={urgency} onChange={setUrgency} /></Section>}
            {step === 2 && (
              <Section title="What is the medical situation?">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ISSUES.map((o) => {
                    const sel = issue === o.id;
                    return (
                      <button key={o.id} onClick={() => setIssue(o.id)}
                        className={`text-left rounded-xl p-4 border bg-card transition flex flex-col gap-2 ${sel ? "border-primary ring-2 ring-primary red-glow-soft" : "border-border hover:border-primary/60"}`}>
                        <o.icon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the situation in 2–3 lines."
                  className="mt-4 w-full bg-input/40 border border-border rounded-xl p-3 text-sm h-24 focus:outline-none focus:border-primary" />
              </Section>
            )}
            {step === 3 && (
              <Section title="Upload medical reports if available">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REPORTS.map((r) => {
                    const got = !!reports[r];
                    return (
                      <button key={r} onClick={() => setReports((p) => ({ ...p, [r]: !p[r] }))}
                        className={`rounded-xl border-2 border-dashed p-4 text-left transition flex items-center gap-3 ${got ? "border-primary bg-primary/10" : "border-border hover:border-primary/60 bg-card"}`}>
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                          {got ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{r}</div>
                          <div className="text-xs text-muted-foreground">{got ? "report.pdf · 1.2 MB · uploaded" : "Drag & drop or browse"}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}
            {step === 4 && (
              <Section title="Where is the patient located?">
                <div className="flex gap-2 mb-4">
                  {(["live", "manual"] as const).map((t) => (
                    <button key={t} onClick={() => setLocTab(t)}
                      className={`px-4 py-2 rounded-lg text-sm border ${locTab === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                      {t === "live" ? "Use Live Location" : "Enter Address Manually"}
                    </button>
                  ))}
                </div>
                {locTab === "live" ? (
                  <div className="space-y-3">
                    {/* Location status card */}
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                      {userLoc ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-[#22C55E]" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              Location detected
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                            </div>
                            <div className="text-xs text-muted-foreground">{userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">Enable location access</div>
                            <div className="text-xs text-muted-foreground">Allow browser location for fastest hospital matching</div>
                          </div>
                          <button onClick={async () => {
                            const loc = await geoLocation.requestLocation();
                            if (loc) setUserLoc({ lat: loc.lat, lng: loc.lng });
                          }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-crimson transition">
                            {geoLocation.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Allow"}
                          </button>
                        </>
                      )}
                    </div>
                    {/* Interactive Map */}
                    <LocationPickerMap
                      userLat={userLoc?.lat}
                      userLng={userLoc?.lng}
                      hospitals={hospitals.filter((h: any) => h.latitude && h.longitude).slice(0, 20).map((h: any) => ({
                        lat: h.latitude, lng: h.longitude, name: h.name, beds: h.beds || 0,
                      }))}
                      onUserLocationChange={(lat, lng) => setUserLoc({ lat, lng })}
                      className="h-[280px]"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="City" value={addr.city} onChange={(v: string) => setAddr({ ...addr, city: v })} />
                    <Field label="Area / Locality" value={addr.area} onChange={(v: string) => setAddr({ ...addr, area: v })} />
                    <Field label="Full Address" value={addr.full} onChange={(v: string) => setAddr({ ...addr, full: v })} className="sm:col-span-2" />
                    <Field label="Landmark" value={addr.landmark} onChange={(v: string) => setAddr({ ...addr, landmark: v })} className="sm:col-span-2" />
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">You can book for a relative in another city. Use the patient's location. Tap the map to adjust the pin.</p>
              </Section>
            )}
            {step === 5 && (
              <Section title="AI Hospital Recommendation">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center red-glow-soft"><Brain className="w-8 h-8 text-primary animate-pulse" /></div>
                    <div className="text-center"><div className="font-semibold">Analyzing {hospitals.length} hospitals…</div><div className="text-xs text-muted-foreground mt-1">Matching bed type, distance, ratings, and live availability</div></div>
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3"><Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div className="text-sm">{aiReasoning}</div></div>
                    {recommendations.map((r) => (
                      <button key={r.id} onClick={() => { setSelectedHospitalId(r.id); setHospitalName(r.name); next(); }}
                        className="w-full text-left glass-card rounded-xl p-4 hover:border-primary/60 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">#{r.rank}</span>
                              <h4 className="font-semibold">{r.name}</h4>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{r.area} · ★ {r.rating}{r.distanceKm !== null ? ` · ${r.distanceKm} km away` : ""}</div>
                            <div className="text-xs text-primary mt-1.5">{r.aiReason}</div>
                          </div>
                          <div className="text-right shrink-0"><div className="text-2xl font-bold">{r.availableBeds}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">beds</div></div>
                        </div>
                      </button>
                    ))}
                    <button onClick={next} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground">Skip AI pick → browse all hospitals</button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground"><p>{error || "No matching hospitals found."}</p><button onClick={next} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Browse All</button></div>
                )}
              </Section>
            )}
            {step === 6 && (
              <Section title="Choose a hospital">
                <div className="space-y-3">
                  {hospitals.map((h) => {
                    const sel = selectedHospitalId === h.id;
                    const stale = h.status === "Stale";
                    return (
                      <div key={h.id} className={`glass-card rounded-xl p-4 transition ${sel ? "ring-2 ring-primary red-glow-soft" : "hover:border-primary/40"}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap"><Building2 className="w-4 h-4 text-primary" /><h4 className="font-semibold">{h.name}</h4><StatusBadge s={h.status} /></div>
                            <div className="text-xs text-muted-foreground mt-1">{h.area} · ★ {h.rating} ({(h.reviewCount || h.reviews || 0).toLocaleString()}) · updated {timeAgo(h.updated)}</div>
                            <div className="text-xs text-muted-foreground mt-1">ICU: <span className="text-foreground font-semibold">{h.icu}</span> · Vent: <span className="text-foreground font-semibold">{h.ven}</span></div>
                          </div>
                          <div className="text-right"><div className="text-2xl font-bold">{h.beds}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">beds available</div></div>
                        </div>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <button onClick={() => setDetail(h)} className="px-3 py-2 rounded-lg border border-border text-xs hover:border-primary/60">View Details</button>
                          <button disabled={stale || h.beds === 0} onClick={() => { setSelectedHospitalId(h.id); setHospitalName(h.name); }}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-crimson disabled:opacity-40 disabled:cursor-not-allowed">{sel ? "Selected" : "Reserve Bed"}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
            {step === 7 && (
              <Section title="Emergency reservation deposit">
                <div className="rounded-2xl p-6 bg-gradient-to-br from-[#3A0005] to-black border border-primary/40 red-glow-soft">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Amount</div>
                  <div className="text-4xl font-bold text-gradient-red mt-1">₹10,000</div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Reservation valid for 4 hours from payment</div>
                </div>
                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Payment via Stripe</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg width="40" height="16" viewBox="0 0 60 25" className="opacity-60"><path fill="#6772e5" d="M59.6 14.2c0-5.2-2.5-9.3-7.3-9.3s-7.7 4.1-7.7 9.3c0 6.1 3.4 9.2 8.3 9.2 2.4 0 4.2-.5 5.6-1.3v-4c-1.4.7-2.9 1.1-4.9 1.1-1.9 0-3.6-.7-3.8-3h9.6c0-.3.2-1.3.2-2zm-9.7-1.9c0-2.2 1.4-3.2 2.6-3.2 1.2 0 2.5 1 2.5 3.2h-5.1zm-12.3-7.4c-1.9 0-3.2.9-3.9 1.5l-.3-1.2h-4.3v23.7l4.9-1 .01-5.7c.7.5 1.7 1.3 3.4 1.3 3.5 0 6.6-2.8 6.6-8.9-.01-5.6-3.2-9.7-6.9-9.7zm-1.2 14.9c-1.1 0-1.8-.4-2.3-1l-.01-7.9c.5-.6 1.2-1 2.3-1 1.8 0 3 2 3 5 .01 2.9-1.2 4.9-2.99 4.9zm-12.6-16l4.9-1.1V0l-4.9 1v2.8zm0 1.7h4.9v17.1h-4.9V5.5zm-5.3 1.5l-.3-1.5h-4.3v17.1h4.9v-11.6c1.2-1.5 3.1-1.2 3.7-1v-4.5c-.7-.2-2.8-.7-4 1.5zm-9.6-1.5h-3.3V2.4L1 3.4v2.1H0v3.8h1v7.3c0 3 1.4 4.1 3.5 4.1 1.1 0 1.9-.2 2.3-.4V16c-.3.1-1.1.2-1.7.2-.9 0-1.3-.4-1.3-1.5V9.3h3.3V5.5z"/></svg>
                      <span>Secure</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Your payment will be processed securely via Stripe using a test card. No real charges will be made.</p>
                  <div className="rounded-lg border border-border/60 bg-input/30 p-3 flex items-center gap-3">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                    <span className="text-sm text-muted-foreground">•••• •••• •••• 4242 (Test Card)</span>
                  </div>
                </div>
                {error && <p className="mt-3 text-sm text-[#E50914]">{error}</p>}
              </Section>
            )}
            {step === 8 && reservation && (
              <Section title="Reservation confirmed">
                <div className="rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/5 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center"><BadgeCheck className="w-5 h-5" /></div>
                  <div className="flex-1 space-y-1 text-sm">
                    <Row k="Reservation ID" v={reservation.reservationCode} />
                    <Row k="Hospital" v={hospitalName} />
                    <Row k="Bed Type" v={BED_TYPES.find((b) => b.id === bed)?.label ?? bed ?? "—"} />
                    <Row k="Payment" v={payment?.status === "succeeded" ? "✓ Paid via Stripe" : payment?.status === "mock_success" ? "Successful" : "Pending"} tone={payment?.status === "succeeded" || payment?.status === "mock_success" ? "success" : "warn"} />
                    <Row k="Hospital Review" v="Pending confirmation" tone="warn" />
                    {reservation.expiresAt && <Row k="Expires" v={new Date(reservation.expiresAt).toLocaleString()} />}
                  </div>
                </div>
                {reservation.expiresAt && <CountdownTimer expiresAt={reservation.expiresAt} />}
                <p className="mt-3 text-xs text-muted-foreground">Next step: Hospital desk will review and respond. You'll get an update within minutes.</p>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
        <FlowNav hideBack={step === 0} onBack={back} onNext={onNext}
          nextLabel={step === STEPS.length - 1 ? "Done" : step === 5 ? "Browse All Hospitals" : step === 7 ? (loading ? "Processing…" : "Pay ₹10,000 & Request Reservation") : "Continue"}
          disabled={!canNext || loading} />
      </FlowShell>
      <HospitalDetailModal hospital={detail} onClose={() => setDetail(null)}
        onReserve={() => { if (detail) { setSelectedHospitalId(detail.id); setHospitalName(detail.name); } setDetail(null); }} />
    </>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, [expiresAt]);
  return (<div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-primary" /> Reservation countdown</div>
    <div className="text-lg font-bold font-mono text-primary">{remaining}</div></div>);
}

export function HospitalDetailModal({ hospital, onClose, onReserve, onAmbulance }: { hospital: HospitalData | null; onClose: () => void; onReserve?: () => void; onAmbulance?: () => void }) {
  if (!hospital) return null;
  const imageUrl = hospital.imageUrl || STOCK_IMAGES[hospital.id % STOCK_IMAGES.length];
  return (
    <AnimatePresence>
      {hospital && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-stretch md:items-center justify-center p-0 md:p-6" onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 28 }} onClick={(e) => e.stopPropagation()}
            className="glass-panel relative w-full md:max-w-3xl md:rounded-2xl overflow-hidden flex flex-col max-h-screen md:max-h-[92vh]">
            <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-border hover:bg-primary/20 hover:border-primary text-foreground flex items-center justify-center"><X className="w-4 h-4" /></button>
            <div className="relative h-48 md:h-64 overflow-hidden">
              <img src={imageUrl} alt={hospital.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold mb-1">Hospital Profile</div>
                <h2 className="text-2xl md:text-3xl font-bold">{hospital.name}</h2>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3 h-3" />{hospital.area}
                  <span className="inline-flex items-center gap-1 text-warning"><Star className="w-3 h-3 fill-warning" />{hospital.rating} · {(hospital.reviewCount || hospital.reviews || 0).toLocaleString()} reviews</span>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto p-5 md:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Stat label="ICU available" value={hospital.icu} /><Stat label="Ventilator" value={hospital.ven} /><Stat label="ER status" value={hospital.status === "Stale" ? "Limited" : "Open"} text />
              </div>
              <div className="glass-card rounded-xl p-4 text-sm space-y-2">
                <Row k="Address" v={hospital.fullAddress} />
                <Row k="Phone" v={hospital.phone || "—"} />
                {hospital.emergency && <Row k="Emergency" v={hospital.emergency} />}
                <Row k="Last updated" v={timeAgo(hospital.updated)} />
                {hospital.category && <Row k="Category" v={`${hospital.category} · ${hospital.type}`} />}
              </div>
              {hospital.departments?.length > 0 && (
                <div><h4 className="text-sm font-semibold mb-2">Departments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {hospital.departments.slice(0, 15).map((d) => (<span key={d} className="px-2.5 py-1 rounded-full text-[10px] border border-border bg-card text-muted-foreground">{d}</span>))}
                    {hospital.departments.length > 15 && <span className="px-2.5 py-1 rounded-full text-[10px] border border-primary/30 text-primary">+{hospital.departments.length - 15} more</span>}
                  </div>
                </div>
              )}
              <div><h4 className="text-sm font-semibold mb-2">Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {["ICU", "Cardiac care", "Trauma care", "Emergency ward", "Ambulance bay", "Ventilator support"].map((f) => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs border border-border bg-card text-muted-foreground">{f}</span>))}
                </div>
              </div>
              <div><h4 className="text-sm font-semibold mb-2">Location</h4>
                {hospital.latitude && hospital.longitude ? (
                  <HospitalMap lat={hospital.latitude} lng={hospital.longitude} name={hospital.name} className="h-48" />
                ) : (
                  <div className="h-40 rounded-xl border border-border bg-card flex items-center justify-center text-xs text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" /> Location data not available
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sticky bottom-0 pt-2">
                <button onClick={onReserve} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-crimson red-glow-soft">Reserve Bed</button>
                <a href={`tel:${hospital.phone || hospital.emergency}`} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm hover:border-primary/60 flex items-center justify-center gap-1"><Phone className="w-4 h-4" /> Call</a>
                <button className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm hover:border-primary/60 flex items-center justify-center gap-1"><Navigation className="w-4 h-4" /> Directions</button>
                <button onClick={onAmbulance} className="px-4 py-2.5 rounded-lg border border-primary/60 text-primary text-sm hover:bg-primary/10 flex items-center justify-center gap-1"><Ambulance className="w-4 h-4" /> Ambulance</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-lg font-bold mb-4">{title}</h3>{children}</div>;
}
function Field({ label, value, onChange, className = "" }: any) {
  return (<label className={`block ${className}`}><span className="text-xs text-muted-foreground">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></label>);
}
function Row({ k, v, tone }: { k: string; v: string; tone?: "success" | "warn" }) {
  const c = tone === "success" ? "text-[#22C55E]" : tone === "warn" ? "text-[#F59E0B]" : "text-foreground";
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className={`font-semibold ${c} text-right`}>{v}</span></div>;
}
function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { Live: "border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10", Verified: "border-primary/40 text-primary bg-primary/10", Stale: "border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[s] || map.Stale}`}>{s}</span>;
}
function Stat({ label, value, text }: { label: string; value: number | string; text?: boolean }) {
  return (<div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 font-bold ${text ? "text-lg text-success" : "text-2xl"}`}>{value}</div></div>);
}
