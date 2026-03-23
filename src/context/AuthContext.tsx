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
import {
  clearDeniedAccessMessage,
  getSharedAccessState,
  mapAuthUser,
  persistDeniedAccessMessage,
  signInWithGoogle,
  signInWithAuthorizedEmail,
  signOut,
  syncCurrentProfile,
  unlockSharedAccess,
} from "@/services/auth";
import { getProfessionalProfile } from "@/services/consultations";
import {
  acceptMyClinicInvite,
  getCurrentClinicMembership,
  getMyAccessState,
  tryAcceptSupabaseAuthInvite,
} from "@/services/clinic";
import type {
  AccessState,
  AuthAccessStatus,
  AuthUser,
  Clinic,
  ClinicMembership,
  ProfessionalProfile,
  SharedAccessState,
} from "@/types/domain";

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  clinic: Clinic | null;
  membership: ClinicMembership | null;
  accessStatus: AuthAccessStatus;
  accessState: AccessState | null;
  currentProfessionalProfile: ProfessionalProfile | null;
  sharedAccessRequired: boolean;
  sharedAccessUnlocked: boolean;
  loading: boolean;
  isConfigured: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  unlockWithSharedPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const emptyAuthState = {
  session: null,
  user: null,
  clinic: null,
  membership: null,
  accessStatus: "denied" as const,
  accessState: null,
  currentProfessionalProfile: null,
  sharedAccessRequired: false,
  sharedAccessUnlocked: false,
};

async function loadAuthContext(session: Session | null) {
  if (!session?.user) {
    return emptyAuthState;
  }

  await syncCurrentProfile(session.user);
  const currentProfessionalProfile = await getProfessionalProfile(session.user.id);
  let membership = await getCurrentClinicMembership(session.user.id);

  if (membership) {
    return {
      session,
      user: mapAuthUser(session.user),
      clinic: membership.clinic ?? null,
      membership,
      accessStatus: "member" as const,
      currentProfessionalProfile,
      accessState: {
        status: "member",
        clinicId: membership.clinicId,
        clinicName: membership.clinic.name,
        invitedEmail: session.user.email?.toLowerCase() ?? null,
      },
    };
  }

  const supabaseInviteMembership = await tryAcceptSupabaseAuthInvite();

  if (supabaseInviteMembership) {
    membership = await getCurrentClinicMembership(session.user.id);
  }

  if (membership) {
    return {
      session,
      user: mapAuthUser(session.user),
      clinic: membership.clinic ?? null,
      membership,
      accessStatus: "member" as const,
      currentProfessionalProfile,
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
    currentProfessionalProfile,
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

type ResolvedAuthState = Awaited<ReturnType<typeof loadAuthContext>>;

async function withSharedAccessState(
  nextState: ResolvedAuthState,
): Promise<ResolvedAuthState & SharedAccessState> {
  if (!nextState.session?.user) {
    return {
      ...nextState,
      required: false,
      unlocked: false,
    };
  }

  const sharedAccessState = await getSharedAccessState(nextState.session);

  return {
    ...nextState,
    ...sharedAccessState,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [membership, setMembership] = useState<ClinicMembership | null>(null);
  const [accessStatus, setAccessStatus] = useState<AuthAccessStatus>("denied");
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [currentProfessionalProfile, setCurrentProfessionalProfile] =
    useState<ProfessionalProfile | null>(null);
  const [sharedAccessRequired, setSharedAccessRequired] = useState(false);
  const [sharedAccessUnlocked, setSharedAccessUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyState = (nextState: ResolvedAuthState & SharedAccessState) => {
    setSession(nextState.session);
    setUser(nextState.user);
    setClinic(nextState.clinic);
    setMembership(nextState.membership);
    setAccessStatus(nextState.accessStatus);
    setAccessState(nextState.accessState);
    setCurrentProfessionalProfile(nextState.currentProfessionalProfile);
    setSharedAccessRequired(nextState.required);
    setSharedAccessUnlocked(nextState.unlocked);
  };

  const resolveSessionState = async (currentSession: Session | null) => {
    const nextState = await withSharedAccessState(await loadAuthContext(currentSession));

    if (!currentSession?.user) {
      return nextState;
    }

    if (
      nextState.session?.user &&
      nextState.accessStatus === "denied" &&
      !nextState.required
    ) {
      persistDeniedAccessMessage();
      await signOut();
      return emptyAuthState;
    }

    if (nextState.accessStatus !== "denied" || nextState.required) {
      clearDeniedAccessMessage();
    }

    return nextState;
  };

  const refreshContext = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      applyState(emptyAuthState);
      return;
    }

    setLoading(true);
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const nextState = await resolveSessionState(currentSession);
    applyState(nextState);
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
        void resolveSessionState(nextSession)
          .then((nextState) => {
            applyState(nextState);
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
      currentProfessionalProfile,
      sharedAccessRequired,
      sharedAccessUnlocked,
      loading,
      isConfigured: isSupabaseConfigured,
      loginWithEmail: signInWithAuthorizedEmail,
      loginWithGoogle: signInWithGoogle,
      unlockWithSharedPassword: async (password: string) => {
        if (!session) {
          throw new Error("Tu sesión ya no es válida. Volvé a ingresar.");
        }

        const sharedAccessState = await unlockSharedAccess(session, password);
        setSharedAccessRequired(sharedAccessState.required);
        setSharedAccessUnlocked(sharedAccessState.unlocked);
        await refreshContext();
      },
      logout: signOut,
      refreshContext,
    }),
    [
      session,
      user,
      clinic,
      membership,
      accessStatus,
      accessState,
      currentProfessionalProfile,
      sharedAccessRequired,
      sharedAccessUnlocked,
      loading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
