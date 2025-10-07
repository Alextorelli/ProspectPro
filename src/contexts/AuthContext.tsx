import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
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

const isAnonymousUser = (user: User | null | undefined) => {
  if (!user) return false;
  if (user.app_metadata?.provider === "anonymous") return true;
  return (
    user.identities?.some((identity) => identity.provider === "anonymous") ??
    false
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate or retrieve session ID for anonymous users
  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("prospect_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("prospect_session_id", sessionId);
    }
    return sessionId;
  };

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

        // If no session exists, create an anonymous session
        if (!session) {
          console.log("No session found, creating anonymous session...");
          const { data: anonData, error: anonError } =
            await supabase.auth.signInAnonymously();

          if (anonError) {
            console.error("Anonymous sign-in error:", anonError);
            // Fall back to session ID if anonymous auth fails
            setSessionUserId(getOrCreateSessionId());
            setLoading(false);
            return;
          }

          console.log(
            "✅ Anonymous session created:",
            anonData.session?.user?.id
          );
          setSession(anonData.session);
          setUser(null);
          setSessionUserId(
            anonData.session?.user?.id ?? getOrCreateSessionId()
          );
        } else {
          // Existing session found
          setSession(session);
          setUser(isAnonymousUser(session.user) ? null : session.user);
          setSessionUserId(session.user.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setSessionUserId(getOrCreateSessionId());
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      setSession(session);
      setUser(
        session?.user && !isAnonymousUser(session.user) ? session.user : null
      );

      // Update session user ID
      if (session?.user) {
        setSessionUserId(session.user.id);
        // Clear anonymous session ID
        localStorage.removeItem("prospect_session_id");
      } else {
        // If signed out, create new anonymous session
        if (event === "SIGNED_OUT") {
          console.log("User signed out, creating new anonymous session...");
          const { data: anonData } = await supabase.auth.signInAnonymously();
          setSession(anonData.session);
          setUser(null);
          setSessionUserId(
            anonData.session?.user?.id ?? getOrCreateSessionId()
          );
        } else {
          setSessionUserId(getOrCreateSessionId());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    // Generate new anonymous session ID
    setSessionUserId(getOrCreateSessionId());
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
