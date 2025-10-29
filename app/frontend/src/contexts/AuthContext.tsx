import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { identifyHighlightUser, isHighlightEnabled } from "../lib/highlight";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  sessionUserId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const highlightUserIdentifierRef = useRef<string | null>(null);
  const lastAuthSnapshotRef = useRef<{
    event: AuthChangeEvent | null;
    userId: string | null;
  }>({
    event: null,
    userId: null,
  });
  const significantEvents = useRef<Set<AuthChangeEvent>>(
    new Set([
      "SIGNED_IN",
      "SIGNED_OUT",
      "TOKEN_REFRESHED",
      "PASSWORD_RECOVERY",
      "USER_UPDATED",
    ])
  );

  useEffect(() => {
    // Initialize auth session (create anonymous session if needed)
    const initializeAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setSessionUserId(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setSessionUserId(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setSession(null);
        setUser(null);
        setSessionUserId(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id ?? null;
      const shouldLog =
        significantEvents.current.has(event) ||
        userId !== lastAuthSnapshotRef.current.userId ||
        (event === "SIGNED_IN" &&
          lastAuthSnapshotRef.current.event !== "SIGNED_IN");

      if (shouldLog) {
        console.log("Auth state changed:", event, userId);
      }

      lastAuthSnapshotRef.current = { event, userId };

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setSessionUserId(session.user.id);
      } else {
        setSession(null);
        setUser(null);
        setSessionUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isHighlightEnabled()) {
      return;
    }

    if (!user) {
      highlightUserIdentifierRef.current = null;
      return;
    }

    const identifier = user.email ?? user.id;

    if (!identifier) {
      return;
    }

    if (highlightUserIdentifierRef.current === identifier) {
      return;
    }

    highlightUserIdentifierRef.current = identifier;

    identifyHighlightUser(identifier, {
      id: user.id,
      email: user.email ?? undefined,
      aud: user.aud ?? undefined,
      role: user.role ?? undefined,
      highlightDisplayName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email ?? undefined,
      isEmailConfirmed: Boolean(user.email_confirmed_at),
      hasPhone: Boolean(user.phone),
      lastSignInAt: user.last_sign_in_at ?? undefined,
    });
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setSessionUserId(null);
  };

  const value = {
    user,
    session,
    sessionUserId,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
