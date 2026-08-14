"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/server/better-auth/client";
import { useState } from "react";

export function GoogleSignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setIsSigningIn(true);
    setError(undefined);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        errorCallbackURL: "/admin/sign-in?error=unauthorized",
      });

      if (result.error) {
        setError(result.error.message ?? "Google sign-in failed.");
        setIsSigningIn(false);
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
      setIsSigningIn(false);
    }
  }

  return (
    <>
      <Button
        className="w-full"
        disabled={isSigningIn}
        onClick={signIn}
        size="lg"
        type="button"
        variant="outline"
      >
        {isSigningIn ? (
          <Spinner />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22"
            />
            <path
              fill="#FBBC05"
              d="M6.39 13.86A6 6 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48z"
            />
            <path
              fill="#EA4335"
              d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01"
            />
          </svg>
        )}
        Continue with Google
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
