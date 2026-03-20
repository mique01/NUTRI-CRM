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
import {
  acceptMyClinicInvite,
  getCurrentClinicMembership,
  getMyAccessState,
} from "@/services/clinic";
import type { AccessState, AuthAccessStatus, AuthUser, Clinic, ClinicMembership } from "@/types/domain";

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  clinic: Clinic | null;
  membership: ClinicMembership | null;
  accessStatus: AuthAccessStatus;
  accessState: AccessState | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
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
      accessStatus: "denied" as const,
      accessState: null,
    };
  }

  await syncCurrentProfile(session.user);
  let membership = await getCurrentClinicMembership(session.user.id);

  if (membership) {
    return {
      session,
      user: mapAuthUser(session.user),
      clinic: membership.clinic ?? null,
      membership,
      accessStatus: "member" as const,
      accessState: {
        status: "member",
        clinicId: membership.clinicId,
        clinicName: membership.clinic.name,
        invitedEmail: session.user.email?.toLowerCase() ?? null,
      },
    };
  }

  const accessState = await getMyAccessState();

  if (accessState.status === "member") {
    membership = await getCurrentClinicMembership(session.user.id);
  }

  if (accessState.status !== "pending_bootstrap" && accessState.invitedEmail) {
    await acceptMyClinicInvite();
    membership = await getCurrentClinicMembership(session.user.id);
  }

  return {
    session,
    user: mapAuthUser(session.user),
    clinic: membership?.clinic ?? null,
    membership,
    accessStatus:
      membership?.clinic != null
        ? ("member" as const)
        : accessState.status,
    accessState:
      membership?.clinic != null
        ? {
            status: "member",
            clinicId: membership.clinicId,
            clinicName: membership.clinic.name,
            invitedEmail: session.user.email?.toLowerCase() ?? null,
          }
        : accessState,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [membership, setMembership] = useState<ClinicMembership | null>(null);
  const [accessStatus, setAccessStatus] = useState<AuthAccessStatus>("denied");
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContext = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setSession(null);
      setUser(null);
      setClinic(null);
      setMembership(null);
      setAccessStatus("denied");
      setAccessState(null);
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
    setAccessStatus(nextState.accessStatus);
    setAccessState(nextState.accessState);
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
            setAccessStatus(nextState.accessStatus);
            setAccessState(nextState.accessState);
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
      accessStatus,
      accessState,
      loading,
      isConfigured: isSupabaseConfigured,
      loginWithGoogle: signInWithGoogle,
      logout: signOut,
      refreshContext,
    }),
    [session, user, clinic, membership, accessStatus, accessState, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
