"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { ApiError } from "@/lib/api";

/**
 * Sign in / create account on one page.
 *
 * The current cart id goes with the request: the API hands that guest cart —
 * and the vehicles saved against it — to the account, so signing in at
 * checkout does not quietly empty the basket.
 *
 * Split out of the route because useSearchParams() forces a client bailout,
 * which Next requires a Suspense boundary for — see app/signin/page.tsx.
 */
export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, signIn, signUp } = useAuth();
  const { cart } = useCart();

  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next") || "/account";

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password, cart?.id);
      } else {
        await signUp(
          { email: email.trim(), password, full_name: fullName.trim() },
          cart?.id,
        );
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign you in.");
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <div className="crumbs">
        <Link href="/">Home</Link> / {mode === "signin" ? "Sign in" : "Create account"}
      </div>
      <h1 className="page-title">{mode === "signin" ? "Sign in" : "Create an account"}</h1>

      <form className="auth-card" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label className="field-group">
            <span className="field-label">Full name</span>
            <input
              className="field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label className="field-group">
          <span className="field-label">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field-group">
          <span className="field-label">Password</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 10 : undefined}
            required
          />
          {mode === "signup" && (
            <span className="field-hint">At least 10 characters.</span>
          )}
        </label>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn btn--block" disabled={busy}>
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="auth-card__switch"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>

        {mode === "signin" && (
          <p className="auth-card__demo">
            Demo account: <code>demo@revline.dev</code> / <code>revline-demo-2026</code>
          </p>
        )}
      </form>
    </div>
  );
}
