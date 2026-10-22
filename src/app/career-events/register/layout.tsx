import { Container } from "@/app/_components/container";
import type { ReactNode } from "react";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <Container contentClassName="space-y-12">{children}</Container>;
}
