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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate or retrieve session ID for anonymous users
  const getOrCreateSessionId = () => {
    if (typeof window === "undefined") {
      return null;
    }

    let sessionId = window.localStorage.getItem("prospect_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      window.localStorage.setItem("prospect_session_id", sessionId);
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

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setSessionUserId(session.user.id);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("prospect_session_id");
          }
        } else {
          setSession(null);
          setUser(null);
          setSessionUserId(getOrCreateSessionId());
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

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setSessionUserId(session.user.id);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("prospect_session_id");
        }
      } else {
        setSession(null);
        setUser(null);
        setSessionUserId(getOrCreateSessionId());
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
    setSession(null);
    setUser(null);
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
