"use client";

import { Typography } from "@/app/_components/typography";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SPONSORSHIP_EMAIL } from "@/lib/sponsorship";
import { ArrowUpRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./footer.module.css";

// Chapter profiles verified against Niner Engage, Instagram, and LinkedIn.
// Instagram's Discord invite is active and has no expiration (Discord API).
const communityLinks = [
  { label: "Instagram", href: "https://www.instagram.com/bmes.unccharlotte/" },
  { label: "Discord", href: "https://discord.gg/afgyGKhe6J" },
  {
    label: "Niner Engage",
    href: "https://ninerengage.charlotte.edu/organization/bmes",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/biomedical-engineering-society-at-unc-charlotte/",
  },
  { label: "Email", href: `mailto:${SPONSORSHIP_EMAIL}` },
];

export function Footer() {
  const pathname = usePathname();

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/s" ||
    pathname.startsWith("/s/")
  ) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-y-6 sm:grid-cols-2 sm:gap-x-16 lg:grid-cols-[0.75fr_1fr_1fr]">
          <div className="order-1 space-y-2 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className={styles.brand}
              aria-label="Charlotte BMES home"
            >
              <Image
                src="/logo/horizontal-alt/horizontal-alt-white.png"
                alt="Charlotte Biomedical Engineering Society"
                width={1369}
                height={502}
                className="h-auto w-40"
              />
            </Link>
            <Typography variant="caption" className="max-w-xs">
              The Biomedical Engineering Society student chapter at UNC
              Charlotte.
            </Typography>
          </div>

          <nav
            aria-labelledby="footer-community-heading"
            className="order-3 space-y-2 sm:order-2"
          >
            <Typography variant="h4" as="h2" id="footer-community-heading">
              Connect with us
            </Typography>
            <ul>
              {communityLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={styles.link}>
                    {label}
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section
            aria-labelledby="footer-support-heading"
            className="order-2 space-y-2 sm:order-3"
          >
            <Typography variant="h4" as="h2" id="footer-support-heading">
              Support Charlotte BMES
            </Typography>
            <Typography variant="caption" className="max-w-xs">
              Help fund student projects, outreach, and professional
              development.
            </Typography>
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/sponsors#individual-heading"
              >
                Donate
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/sponsors#sponsorship-heading"
              >
                Become a sponsor
              </Link>
            </div>
          </section>
        </div>

        <Separator className="mt-8 mb-4" />
        <Typography variant="caption">
          © {new Date().getFullYear()} Charlotte BMES
        </Typography>
      </div>
    </footer>
  );
}
