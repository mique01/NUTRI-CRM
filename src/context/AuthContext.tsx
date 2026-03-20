import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mapAuthUser, signInWithGoogle, signOut, syncCurrentProfile } from "@/services/auth";
import { getCurrentClinicMembership } from "@/services/clinic";
import type { AuthUser, Clinic, ClinicMembership } from "@/types/domain";

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  clinic: Clinic | null;
  membership: ClinicMembership | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

async function loadAuthContext(session: Session | null) {
  if (!session?.user) {
    return {
      session: null,
      user: null,
      clinic: null,
      membership: null,
    };
  }

  await syncCurrentProfile(session.user);
  const membership = await getCurrentClinicMembership(session.user.id);

  return {
    session,
    user: mapAuthUser(session.user),
    clinic: membership?.clinic ?? null,
    membership,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [membership, setMembership] = useState<ClinicMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContext = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setSession(null);
      setUser(null);
      setClinic(null);
      setMembership(null);
      return;
    }

    setLoading(true);
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const nextState = await loadAuthContext(currentSession);
    setSession(nextState.session);
    setUser(nextState.user);
    setClinic(nextState.clinic);
    setMembership(nextState.membership);
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    void refreshContext();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        void loadAuthContext(nextSession)
          .then((nextState) => {
            setSession(nextState.session);
            setUser(nextState.user);
            setClinic(nextState.clinic);
            setMembership(nextState.membership);
          })
          .finally(() => setLoading(false));
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      clinic,
      membership,
      loading,
      isConfigured: isSupabaseConfigured,
      loginWithGoogle: signInWithGoogle,
      logout: signOut,
      refreshContext,
    }),
    [session, user, clinic, membership, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
