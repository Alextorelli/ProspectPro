import { User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface AuthComponentProps {
  onAuthChange?: (user: User | null) => void;
}

// HCaptcha component integration (if available)
declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string, options: any) => string;
      execute: (widgetId: string) => Promise<{ response: string }>;
      reset: (widgetId: string) => void;
    };
  }
}

const createUserProfile = async (user: User) => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error } = await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      });

      if (error) {
        console.error("Error creating user profile:", error);
      }
    }
  } catch (error) {
    console.error("Error in createUserProfile:", error);
  }
};

export const AuthComponent: React.FC<AuthComponentProps> = ({
  onAuthChange,
}) => {
  const {
    user: authUser,
    loading: authLoading,
    signIn,
    signUp,
    signOut: contextSignOut,
  } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const hasEnsuredProfileRef = useRef(false);
  const captchaWidgetIdRef = useRef<string | null>(null);

  const combinedLoading = authLoading || localLoading;

  const resetForm = useCallback(() => {
    setIsSignUp(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setError(null);
    setSuccess(null);

    if (window.hcaptcha && captchaWidgetIdRef.current) {
      window.hcaptcha.reset(captchaWidgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(authUser ?? null);
    }
  }, [authUser, onAuthChange]);

  useEffect(() => {
    if (authUser && !hasEnsuredProfileRef.current) {
      hasEnsuredProfileRef.current = true;
      void createUserProfile(authUser);
    }

    if (!authUser) {
      hasEnsuredProfileRef.current = false;
      setIsMenuOpen(false);
      setShowEmailForm(false);
      resetForm();
    }
  }, [authUser, resetForm]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setShowEmailForm(false);
        resetForm();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setShowEmailForm(false);
        resetForm();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, resetForm]);

  if (combinedLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuContainerRef} className="relative">
      {authUser ? (
        <div className="flex items-center space-x-4">
          <button
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span>{authUser.email}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    contextSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          onClick={() => setShowEmailForm(true)}
        >
          Sign In
        </button>
      )}

      {showEmailForm && !authUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLocalLoading(true);
                setError(null);

                try {
                  if (isSignUp) {
                    if (password !== confirmPassword) {
                      throw new Error("Passwords don't match");
                    }
                    await signUp(email, password);
                    setSuccess("Check your email for confirmation!");
                  } else {
                    await signIn(email, password);
                  }
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "An error occurred"
                  );
                } finally {
                  setLocalLoading(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignUp && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between items-center mb-4">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    resetForm();
                  }}
                >
                  {isSignUp ? "Already have an account?" : "Need an account?"}
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={localLoading}
                  type="submit"
                >
                  {localLoading
                    ? "Loading..."
                    : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
