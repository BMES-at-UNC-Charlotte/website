"use client";

import { SignOutButton } from "@/app/admin/_components/sign-out-button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/server/better-auth/client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNavigationItems = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Gallery", href: "/gallery" },
  { title: "Sponsors", href: "/sponsors" },
  // Only include dev link in development environment
  ...(process.env.NODE_ENV === "development"
    ? [{ title: "Dev", href: "/dev" }]
    : []),
];

const adminNavigationItems = [
  { title: "Dashboard", href: "/admin" },
  { title: "Employer Events", href: "/admin/career" },
  { title: "Main Site", href: "/" },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdminPage = pathname.startsWith("/admin");
  const navigationItems = isAdminPage
    ? adminNavigationItems
    : mainNavigationItems;

  return (
    <header className="bg-background/95 fixed z-50 w-full border-b">
      <nav
        aria-label="Main navigation"
        className="flex h-16 items-center justify-between px-4 sm:px-6"
      >
        {/* Logo */}
        <Link
          href={isAdminPage ? "/admin" : "/"}
          className="shrink-0"
          aria-label={isAdminPage ? "Officer dashboard" : "Charlotte BMES home"}
        >
          <Image
            src="/logo/text-white.png"
            alt="Charlotte Biomedical Engineering Society"
            width={1256}
            height={441}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Navigation menu */}
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    render={<Link href={item.href} />}
                    className={navigationMenuTriggerStyle({
                      className: "px-3 py-2",
                    })}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          {isAdminPage && session?.user ? (
            <SignOutButton
              user={{
                image: session.user.image,
                name: session.user.name,
              }}
            />
          ) : null}
        </div>
      </nav>
    </header>
  );
}
