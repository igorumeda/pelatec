"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function GoogleAuthButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleAuth() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full" onClick={handleGoogleAuth} disabled={loading}>
        {!loading ? <GoogleIcon /> : null}
        {loading ? "Conectando..." : "Continuar com Google"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.805 12.041c0-.787-.064-1.361-.203-1.957H12.2v3.793h5.518c-.111.942-.713 2.361-2.05 3.314l-.019.127 3.035 2.351.21.021c1.928-1.78 3.041-4.402 3.041-7.649Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.832c2.703 0 4.972-.889 6.63-2.426l-3.226-2.5c-.861.602-2.018 1.021-3.404 1.021-2.647 0-4.888-1.78-5.684-4.24l-.12.01-3.156 2.442-.041.115c1.649 3.277 5.037 5.578 9.001 5.578Z"
        fill="#34A853"
      />
      <path
        d="M6.516 13.687a5.868 5.868 0 0 1-.334-1.947c0-.676.121-1.33.315-1.947l-.006-.13-3.196-2.482-.104.05A9.782 9.782 0 0 0 2.118 11.74c0 1.628.389 3.171 1.072 4.508l3.326-2.561Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.552c1.747 0 2.924.759 3.594 1.396l2.622-2.556C17.163 3.239 14.903 2.26 12.2 2.26c-3.964 0-7.352 2.301-9.001 5.578l3.306 2.562c.805-2.462 3.046-4.848 5.694-4.848Z"
        fill="#EB4335"
      />
    </svg>
  );
}
