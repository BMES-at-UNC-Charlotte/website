import { cn } from "@/lib/utils";
import Image from "next/image";
import { type ReactNode } from "react";

type HeroImage = {
  alt: string;
  priority?: boolean;
  src: string;
};

type PageContainerProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  hero?: HeroImage;
  heroContent?: ReactNode;
};

/**
 * Provides the shared page container for the main content of each page.
 *
 * Pass `hero` for routes with a full-width image. `heroContent` is rendered
 * over the image for titles, calls to action, or other route-specific content.
 */
export function Container({
  children,
  className,
  contentClassName,
  hero,
  heroContent,
}: PageContainerProps) {
  return (
    <main className={cn("min-h-screen pt-16", className)}>
      {hero ? (
        <section className="relative isolate h-[clamp(18rem,32vw,28rem)] overflow-hidden">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority={hero.priority}
            className="object-cover"
            sizes="100vw"
          />
          {heroContent ? (
            <div className="relative z-10 mx-auto flex size-full max-w-6xl items-end px-4 py-10 sm:px-6 lg:px-8">
              {heroContent}
            </div>
          ) : null}
        </section>
      ) : null}

      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8",
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
