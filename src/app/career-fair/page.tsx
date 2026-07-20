import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Container } from "../_components/container";
import { Typography } from "../_components/typography";

export default function CareerFairPage() {
  return (
    <Container
      hero={{
        src: "/hero/career-fair.jpg",
        alt: "BMES Members in Professional Attire",
        priority: true,
      }}
      heroContent={
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Typography
            variant="h1"
            className="relative isolate text-center [text-shadow:-3px_-3px_8px_rgb(0_0_0_/_1)] before:absolute before:inset-0 before:-z-10 before:bg-black/28 before:blur-lg"
          >
            Fall 2026 Biomedical Industry Career Fair
          </Typography>
          <Link href="/career-fair/register">
            <Button className="border-none [box-shadow:0_2px_8px_rgb(0_0_0_/_1)]">
              Register as an Employer <ArrowUpRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      }
    >
      <Typography>
        UNC Charlotte's chapter of BMES has partnered with the William States
        Lee College of Engineering to host the first annual Biomedical Industry
        Engineering Career Fair. This event connects employers with
        undergraduate, master's, and Ph.D. students interested in biomedical
        engineering, medical devices, manufacturing, and related engineering
        careers, and aims to provide an opportunity for students to connect with
        employers for internships, co-ops, and full-time positions.
      </Typography>
    </Container>
  );
}
