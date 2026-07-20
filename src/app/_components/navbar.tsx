"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  title: string;
  href: string;
  items?: {
    title: string;
    href: string;
  }[];
};

const navigationItems: NavigationItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  // { title: "Gallery", href: "/gallery" },
  {
    title: "Career Fair",
    href: "/career-fair",
    items: [
      {
        title: "Employer Registration",
        href: "/career-fair/register",
      },
    ],
  },
  { title: "Sponsors", href: "/sponsors" },
  // Only include dev link in development environment
  ...(process.env.NODE_ENV === "development"
    ? [{ title: "Dev", href: "/dev" }]
    : []),
];

export function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <header className="bg-background/95 fixed z-50 w-full border-b">
      <nav
        aria-label="Main navigation"
        className="flex h-16 items-center justify-between px-4 sm:px-6"
      >
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="Charlotte BMES home">
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
        <NavigationMenu>
          <NavigationMenuList className="space-x-2">
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                {item.items ? (
                  <>
                    <NavigationMenuTrigger
                      className={cn(
                        "px-3 py-2",
                        isActive(item.href) && "bg-muted",
                      )}
                    >
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="min-w-52">
                      <NavigationMenuLink
                        aria-current={
                          pathname === item.href ? "page" : undefined
                        }
                        render={<Link href={item.href} />}
                        className={cn(
                          pathname === item.href && "bg-muted",
                        )}
                      >
                        Overview
                      </NavigationMenuLink>
                      {item.items.map((subItem) => (
                        <NavigationMenuLink
                          key={subItem.href}
                          aria-current={
                            isActive(subItem.href) ? "page" : undefined
                          }
                          render={<Link href={subItem.href} />}
                          className={cn(
                            isActive(subItem.href) && "bg-muted",
                          )}
                        >
                          {subItem.title}
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    aria-current={isActive(item.href) ? "page" : undefined}
                    render={<Link href={item.href} />}
                    className={navigationMenuTriggerStyle({
                      className: cn(
                        "px-3 py-2",
                        isActive(item.href) && "bg-muted",
                      ),
                    })}
                  >
                    {item.title}
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </header>
  );
}
