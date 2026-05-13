import { useState } from "react";
import { FlowShell } from "./FlowShell";
import { ShieldCheck, LogOut, Loader2, User, Mail, Phone, Lock, Eye, EyeOff, UserCircle, MapPin, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";

export function ProfilePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signup, login, logout } = useAuth();
  const { location, requestLocation, permissionStatus, loading: locLoading } = useLocation();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  // Signup fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [caregiverName, setCaregiverName] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!consent) { setError("Please agree to the consent"); return; }

    setLoading(true);
    setError("");
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone || undefined,
        password,
        caregiverName: caregiverName || undefined,
        consentContact: consent,
      });
      // Request location permission right after signup
      await requestLocation();
      onClose();
    } catch (e: any) {
      setError(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()) { setError("Please enter your email"); return; }
    if (!loginPassword) { setError("Please enter your password"); return; }

    setLoading(true);
    setError("");
    try {
      await login(loginEmail.trim(), loginPassword);
      await requestLocation();
      onClose();
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Logged-in Profile View ──────────────────────────────
  if (user) {
    return (
      <FlowShell open={open} onClose={onClose} title="Your Profile" subtitle="Signed in to OpenICU" accent="Account">
        <div className="space-y-4">
          {/* Avatar & greeting */}
          <div className="flex items-center gap-4 glass-card rounded-xl p-5">
            <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{user.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">OpenICU Emergency Account</p>
            </div>
          </div>

          {/* Details card */}
          <div className="glass-card rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2"><User className="w-3.5 h-3.5" /> Full Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="border-t border-border/60" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            {user.phone && (
              <>
                <div className="border-t border-border/60" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</span>
                  <span className="font-semibold">{user.phone}</span>
                </div>
              </>
            )}
            {user.caregiverName && (
              <>
                <div className="border-t border-border/60" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><UserCircle className="w-3.5 h-3.5" /> Caregiver</span>
                  <span className="font-semibold">{user.caregiverName}</span>
                </div>
              </>
            )}
          </div>

          {/* Location status */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">Live Location</span>
              </div>
              {location ? (
                <span className="text-xs text-[#22C55E] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Not set</span>
              )}
            </div>
            {location ? (
              <div className="mt-2 text-xs text-muted-foreground">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                {location.accuracy && <span> · ±{Math.round(location.accuracy)}m</span>}
              </div>
            ) : (
              <button onClick={requestLocation} disabled={locLoading}
                className="mt-2 w-full py-2 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 transition">
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                {locLoading ? "Getting location…" : "Enable Location Access"}
              </button>
            )}
          </div>

          <button onClick={() => { logout(); onClose(); }}
            className="w-full py-2.5 rounded-lg border border-border bg-card text-sm hover:border-primary/60 flex items-center justify-center gap-2 transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </FlowShell>
    );
  }

  // ── Sign Up / Login Forms ───────────────────────────────
  return (
    <FlowShell open={open} onClose={onClose}
      title={mode === "signup" ? "Create your account" : "Welcome back"}
      subtitle={mode === "signup" ? "Sign up to access emergency services" : "Sign in to your OpenICU account"}
      accent="Account">

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-card border border-border">
        <button onClick={() => { setMode("signup"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Sign Up
        </button>
        <button onClick={() => { setMode("login"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Sign In
        </button>
      </div>

      {mode === "signup" ? (
        <div className="space-y-3">
          <Field label="Full Name" value={name} onChange={setName} icon={User} placeholder="e.g. Vikash Kumar" required />
          <Field label="Email Address" value={email} onChange={setEmail} type="email" icon={Mail} placeholder="you@example.com" required />
          <Field label="Phone Number" value={phone} onChange={setPhone} type="tel" icon={Phone} placeholder="+91 98765 43210" />
          <div className="relative">
            <Field label="Password" value={password} onChange={setPassword}
              type={showPassword ? "text" : "password"} icon={Lock} placeholder="Min 6 characters" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Field label="Caregiver Name (if different from patient)" value={caregiverName} onChange={setCaregiverName} icon={UserCircle} placeholder="Optional" />

          <label className="flex items-start gap-2 text-sm mt-2">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#E50914]" />
            <span>I consent to be contacted for this emergency request and agree to the <span className="text-primary underline cursor-pointer">terms of service</span>.</span>
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p>Your information is encrypted and used only for emergency coordination. Hospital-side patient records are never stored on this platform.</p>
          </div>

          {error && <p className="text-sm text-[#E50914] font-medium">{error}</p>}

          <button disabled={loading} onClick={handleSignup}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-crimson red-glow-soft disabled:opacity-40 flex items-center justify-center gap-2 transition">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Email Address" value={loginEmail} onChange={setLoginEmail} type="email" icon={Mail} placeholder="you@example.com" required />
          <div className="relative">
            <Field label="Password" value={loginPassword} onChange={setLoginPassword}
              type={showLoginPassword ? "text" : "password"} icon={Lock} placeholder="Your password" required />
            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground">
              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-sm text-[#E50914] font-medium">{error}</p>}

          <button disabled={loading} onClick={handleLogin}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-crimson red-glow-soft disabled:opacity-40 flex items-center justify-center gap-2 transition">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      )}
    </FlowShell>
  );
}

function Field({ label, value, onChange, type = "text", icon: Icon, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: any; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      <div className="relative mt-1">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full bg-input/40 border border-border rounded-lg py-2.5 text-sm focus:outline-none focus:border-primary transition ${Icon ? "pl-9 pr-3" : "px-3"}`} />
      </div>
    </label>
  );
}
