"use client";

import { SignOutButton } from "@/app/admin/_components/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/server/better-auth/client";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type NavigationItem = {
  title: string;
  href: string;
};

const mainNavigationItems: NavigationItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Sponsors", href: "/sponsors" },
  // Only include dev link in development environment
  ...(process.env.NODE_ENV === "development"
    ? [{ title: "Dev", href: "/dev" }]
    : []),
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdminPage = pathname.startsWith("/admin");
  const isSurveyPage = pathname === "/s" || pathname.startsWith("/s/");
  const navigationItems: NavigationItem[] = isAdminPage
    ? [
        { title: "Dashboard", href: "/admin" },
        { title: "Surveys", href: "/admin/surveys" },
        ...(session?.user.adminUser?.role === "ADMIN"
          ? [{ title: "Sponsorships", href: "/admin/sponsorship" }]
          : []),
        { title: "Main Site", href: "/" },
      ]
    : mainNavigationItems;

  const isActive = (href: string) =>
    href === "/" || href === "/admin"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;

  const actions =
    isAdminPage && session?.user ? (
      <SignOutButton
        user={{ image: session.user.image, name: session.user.name }}
      />
    ) : null;

  return (
    <header className="bg-background/95 fixed z-50 w-full border-b">
      <nav
        aria-label="Main navigation"
        className={cn(
          "flex items-center justify-between gap-4 px-4 sm:px-6",
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
            src="/logo/horizontal-alt/horizontal-alt-white.png"
            alt="Charlotte Biomedical Engineering Society"
            width={1369}
            height={502}
            className={cn("w-auto", isSurveyPage ? "h-7" : "h-9")}
            priority
          />
        </Link>

        {/* Navigation menu */}
        <div className="hidden items-center gap-4 md:flex">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    active={isActive(item.href)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    render={<Link href={item.href} />}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive(item.href) && "bg-muted",
                    )}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          {actions}
        </div>
        <MobileNavMenu
          key={pathname}
          items={navigationItems}
          isActive={isActive}
          isAdminPage={isAdminPage}
          actions={actions}
        />
      </nav>
    </header>
  );
}

function MobileNavMenu({
  items,
  isActive,
  isAdminPage,
  actions,
}: {
  items: NavigationItem[];
  isActive: (href: string) => boolean;
  isAdminPage: boolean;
  actions: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" className="md:hidden" />}
        aria-label="Open menu"
      >
        Menu <Menu />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            {isAdminPage ? "Officer navigation" : "Charlotte BMES navigation"}
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label={
            isAdminPage ? "Mobile officer navigation" : "Mobile navigation"
          }
          className="min-h-0 flex-1 overflow-y-auto px-6 pb-6"
        >
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    buttonVariants({
                      variant: isActive(item.href) ? "secondary" : "ghost",
                    }),
                    "w-full justify-start",
                    isActive(item.href) && "hover:bg-secondary",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {actions ? (
          <SheetFooter className="border-t">{actions}</SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
