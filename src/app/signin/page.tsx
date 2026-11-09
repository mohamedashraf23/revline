import { Suspense } from "react";

import { SignInForm } from "@/components/SignInForm";

export const metadata = {
  title: "Sign in — Revline",
  description: "Sign in to keep your garage and order history.",
};

/**
 * The form reads ?next= and ?mode= with useSearchParams(), which opts the
 * subtree out of prerendering — so it needs a Suspense boundary here.
 */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="page page--narrow">
          <h1 className="page-title">Sign in</h1>
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
