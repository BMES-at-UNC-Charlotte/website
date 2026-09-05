import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import Link from "next/link";

const navigationItems = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Gallery", href: "/gallery" },
  { title: "Sponsor Us", href: "/sponsors" },
  // Only include dev link in development environment
  ...(process.env.NODE_ENV === "development"
    ? [{ title: "Dev", href: "/dev" }]
    : []),
];

export function NavBar() {
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
      </nav>
    </header>
  );
}
