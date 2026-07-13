import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Layout for development routes.
 * This is used to only enable development routes in a development
 * environment (e.g. running `pnpm dev`).
 */
export default function DevelopmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Return a 404 page if not in a development environment,
  // which will block any routes in this folder.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return children;
}
