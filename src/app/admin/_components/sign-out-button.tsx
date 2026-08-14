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
      className="bg-card text-card-foreground ring-foreground/5 dark:ring-foreground/10 hover:bg-card/80 h-auto gap-2 rounded-4xl px-4 py-2 text-sm shadow-md ring-1"
      aria-label={`Sign out ${user.name}`}
      disabled={isSigningOut}
      onClick={signOut}
      type="button"
      variant="ghost"
    >
      <Avatar size="sm" className="-ml-1.5">
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
