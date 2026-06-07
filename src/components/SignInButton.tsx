"use client";

// BONUS-05 wired in Phase 8 — Google OAuth via useAuthActions

import { useAuthActions } from "@convex-dev/auth/react";

export function SignInButton() {
  const { signIn } = useAuthActions();

  return (
    <button
      type="button"
      onClick={() => void signIn("google")}
      className="bg-pen text-white h-12 w-full uppercase tracking-widest text-xs font-[family-name:var(--font-body)]"
    >
      SIGN IN WITH GOOGLE
    </button>
  );
}
