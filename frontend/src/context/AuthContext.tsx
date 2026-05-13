import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type AuthUser } from "@/lib/api";

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signup: (data: { name: string; email: string; phone?: string; password: string; caregiverName?: string; consentContact?: boolean }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  signup: async () => {}, login: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("openicu_token");
    if (stored) {
      setToken(stored);
      api.auth.me().then(setUser).catch(() => {
        localStorage.removeItem("openicu_token");
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; phone?: string; password: string; caregiverName?: string; consentContact?: boolean }) => {
    const res = await api.auth.signup(data);
    localStorage.setItem("openicu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem("openicu_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("openicu_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
