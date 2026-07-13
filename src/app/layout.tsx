import "@/styles/globals.css";

import { NavBar } from "@/app/_components/navbar";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/react";
import { type Metadata } from "next";
import { Crimson_Text, Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "400",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Charlotte BMES",
  description: "Biomedical Engineering Society at UNC Charlotte.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

/**
 * Root layout for the application.
 * Any code in this layout wraps every page in the application.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(fraunces.variable, crimsonText.variable, "dark")}
    >
      <body suppressHydrationWarning>
        <TRPCReactProvider>
          <NavBar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
