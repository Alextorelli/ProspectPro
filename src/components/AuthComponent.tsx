import { User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

export const AuthComponent: React.FC<AuthComponentProps> = ({
  onAuthChange,
}) => {
  const {
    user: authUser,
    loading: authLoading,
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

  const initializeCaptcha = useCallback(() => {
    if (!showEmailForm || !isSignUp) {
      return;
    }

    if (!window.hcaptcha || captchaWidgetIdRef.current) {
      return;
    }

    try {
      const widgetId = window.hcaptcha.render("auth-hcaptcha-container", {
        sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
        size: "invisible",
        callback: () => undefined,
      });
      captchaWidgetIdRef.current = widgetId;
    } catch (err) {
      console.warn("Unable to initialize hCaptcha", err);
    }
  }, [isSignUp, showEmailForm]);

  const executeCaptcha = useCallback(async () => {
    if (!window.hcaptcha || !captchaWidgetIdRef.current) {
      return null;
    }

    try {
      const result = await window.hcaptcha.execute(captchaWidgetIdRef.current);
      return result.response;
    } catch (err) {
      console.warn("Unable to complete hCaptcha", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (showEmailForm && isSignUp) {
      initializeCaptcha();
    }
  }, [showEmailForm, isSignUp, initializeCaptcha]);

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase.from("user_profiles").upsert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || fullName || "",
          avatar_url: user.user_metadata?.avatar_url || "",
          subscription_tier: "free",
          total_spent: 0,
          monthly_budget: 100.0,
        },
      ]);

      if (error && error.code !== "23505") {
        console.error("Error creating user profile:", error);
      }
    } catch (err) {
      console.error("Error creating user profile:", err);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain uppercase, lowercase, and number";
    }
    return null;
  };

  const getRedirectTo = () => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return (
        import.meta.env.VITE_AUTH_REDIRECT_URL ?? `${window.location.origin}/`
      );
    }

    return import.meta.env.VITE_AUTH_REDIRECT_URL ?? "/";
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLocalLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLocalLoading(false);
          return;
        }

        const passwordValidationError = validatePassword(password);
        if (passwordValidationError) {
          setError(passwordValidationError);
          setLocalLoading(false);
          return;
        }

        if (window.hcaptcha) {
          const token = await executeCaptcha();
          if (!token) {
            setError("Captcha verification failed. Please try again.");
            setLocalLoading(false);
            return;
          }
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectTo(),
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setSuccess(
          "Check your email to confirm your account. Once confirmed, sign in to continue."
        );
        resetForm();
        setShowEmailForm(false);
        setIsMenuOpen(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        resetForm();
        setShowEmailForm(false);
        setIsMenuOpen(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setSuccess(null);
    setLocalLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectTo(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLocalLoading(true);
    setError(null);

    try {
      await contextSignOut();
      resetForm();
      setIsMenuOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign out right now.";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  if (combinedLoading && !authUser) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-blue-600"></div>
        <span className="text-sm font-medium text-gray-800">Loading…</span>
      </div>
    );
  }

  if (authUser) {
    const displayName = authUser.user_metadata?.full_name || "ProspectPro user";
    const emailLabel = authUser.email || "Authenticated";
    const initials = displayName
      .split(" ")
      .map((segment: string) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="relative" ref={menuContainerRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-3 rounded-full border border-transparent bg-white/80 px-3 py-1.5 text-left text-sm font-medium text-gray-900 shadow-sm transition-colors hover:border-blue-600 hover:bg-white dark:bg-slate-900/70 dark:text-slate-100"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-100 text-base font-semibold text-blue-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200">
            {authUser.user_metadata?.avatar_url ? (
              <img
                src={authUser.user_metadata.avatar_url}
                alt={displayName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              initials || "PP"
            )}
          </span>
          <span className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-tight">
              {displayName}
            </span>
            <span className="text-xs text-gray-600 leading-tight dark:text-slate-300">
              {emailLabel}
            </span>
          </span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform dark:text-slate-300 ${
              isMenuOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isMenuOpen && (
          <div
            className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
            role="menu"
            aria-label="Account menu"
          >
            <div className="mb-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Signed in as
              </p>
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="truncate text-xs text-gray-600 dark:text-slate-300">
                {emailLabel}
              </p>
            </div>

            <div className="flex flex-col gap-1" role="none">
              <Link
                to="/account"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                Account settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={combinedLoading}
                className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuContainerRef}>
      <button
        type="button"
        onClick={() =>
          setIsMenuOpen((prev) => {
            const next = !prev;
            if (!next) {
              setShowEmailForm(false);
              resetForm();
            }
            return next;
          })
        }
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-white dark:border-sky-500/40 dark:bg-slate-900/70 dark:text-sky-200"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <span>Sign in / Sign up</span>
        <svg
          className={`h-4 w-4 text-blue-500 transition-transform dark:text-sky-300 ${
            isMenuOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isMenuOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
          role="menu"
          aria-label="Authentication menu"
        >
          <div className="space-y-4" role="none">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={combinedLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              role="menuitem"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
              <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
              <span>or</span>
              <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !showEmailForm;
                setShowEmailForm(next);
                setError(null);
                setSuccess(null);

                if (!next) {
                  resetForm();
                }
              }}
              className="w-full rounded-md border border-transparent bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
              role="menuitem"
            >
              {showEmailForm ? "Hide email options" : "Continue with email"}
            </button>

            {showEmailForm && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    {isSignUp ? "Create an account" : "Sign in with email"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp((prev) => !prev);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    {isSignUp
                      ? "Have an account? Sign in"
                      : "New user? Create account"}
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {isSignUp && (
                    <input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                  )}

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />

                  {isSignUp && (
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                  )}

                  <button
                    type="submit"
                    disabled={combinedLoading}
                    className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
                  >
                    {combinedLoading ? (
                      <span>Processing…</span>
                    ) : isSignUp ? (
                      "Create account"
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-3 rounded border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {success}
                  </div>
                )}

                <div id="auth-hcaptcha-container" className="hidden" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
