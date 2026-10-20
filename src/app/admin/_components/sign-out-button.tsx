"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/better-auth/client";
import { LogOut } from "lucide-react";
import { useState } from "react";

type SignOutButtonProps = {
  user: {
    image?: string | null;
    name: string;
  };
};

export function SignOutButton({ user }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Initials in case the user has no image
  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  async function signOut() {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      window.location.assign("/admin/sign-in");
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      aria-label={`Sign out ${user.name}`}
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
      variant="outline"
    >
      <Avatar size="sm">
        <AvatarImage
          alt={`${user.name}'s profile`}
          src={user.image ?? undefined}
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {isSigningOut ? "Signing out…" : user.name}
      <LogOut />
    </Button>
  );
}
