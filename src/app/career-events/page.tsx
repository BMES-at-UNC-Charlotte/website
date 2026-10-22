import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Container } from "../_components/container";
import { Typography } from "../_components/typography";

export default function CareerEventsPage() {
  return (
    <Container
      hero={{
        src: "/hero/career-fair.jpg",
        alt: "BMES Members in Professional Attire",
        priority: true,
      }}
      heroContent={
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Typography variant="h1" className="text-center">
            Fall 2026 Biomedical Industry Career Events
          </Typography>
          <Button
            nativeButton={false}
            render={<Link href="/career-events/register" />}
          >
            Register as an Employer <ArrowUpRightIcon />
          </Button>
        </div>
      }
    >
      <Typography>
        UNC Charlotte&apos;s chapter of BMES has partnered with the William
        States Lee College of Engineering to host biomedical industry career
        events. These events connect employers with undergraduate,
        master&apos;s, and Ph.D. students interested in biomedical engineering,
        medical devices, manufacturing, and related engineering careers, and aim
        to provide an opportunity for students to connect with employers for
        internships, co-ops, and full-time positions.
      </Typography>
    </Container>
  );
}
