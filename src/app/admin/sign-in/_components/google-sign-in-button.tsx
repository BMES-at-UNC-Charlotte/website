"use client";

import { GoogleLogo } from "@/app/_components/google-logo";
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
        {isSigningIn ? <Spinner /> : <GoogleLogo />}
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
