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
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  title: string;
  href: string;
};

const mainNavigationItems: NavigationItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Gallery", href: "/gallery" },
  { title: "Sponsors", href: "/sponsors" },
  // Only include dev link in development environment
  ...(process.env.NODE_ENV === "development"
    ? [{ title: "Dev", href: "/dev" }]
    : []),
];

const adminNavigationItems: NavigationItem[] = [
  { title: "Dashboard", href: "/admin" },
  { title: "Surveys", href: "/admin/surveys" },
  { title: "Sponsorships", href: "/admin/sponsorship" },
  { title: "Main Site", href: "/" },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdminPage = pathname.startsWith("/admin");
  const isSurveyPage = pathname === "/s" || pathname.startsWith("/s/");
  const navigationItems = isAdminPage
    ? adminNavigationItems
    : mainNavigationItems;

  const isActive = (href: string) =>
    href === "/" || href === "/admin"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <header className="bg-background/95 fixed z-50 w-full border-b">
      <nav
        aria-label="Main navigation"
        className={cn(
          "flex items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6",
          isSurveyPage ? "h-12" : "h-16",
        )}
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
            className={cn("w-auto", isSurveyPage ? "h-7" : "h-9")}
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
                    active={isActive(item.href)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    render={<Link href={item.href} />}
                    className={navigationMenuTriggerStyle()}
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
