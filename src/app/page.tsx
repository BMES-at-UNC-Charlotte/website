import { CarouselAutoAdvance } from "@/app/_components/carousel-auto-advance";
import { Container } from "@/app/_components/container";
import { HighlightCard } from "@/app/_components/highlight-card";
import { Typography } from "@/app/_components/typography";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Fragment } from "react";

/**
 * Home page.
 * This page is the default home page for the application.
 */
export default function HomePage() {
  return (
    <Container
      hero={{
        src: "/hero/home.jpg",
        alt: "Charlotte BMES members",
        priority: true,
      }}
      heroContent={
        <Typography variant="h3">Biomedical Engineering Society</Typography>
      }
      contentClassName="space-y-8"
    >
      <Typography variant="h1">Purpose</Typography>
      <section className="space-y-4">
        <Typography variant="h2">
          UNC Charlotte Biomedical Engineering Society
        </Typography>
        <Typography>
          The Biomedical Engineering Society at UNC Charlotte is dedicated to
          advancing the field by building a supportive, inclusive community that
          empowers the next generation of engineers. We foster innovation and
          professional growth by providing hands-on projects, professional
          development opportunities, and community outreach that bridge the gap
          between academic theory and real-world engineering application.
        </Typography>
      </section>
      <section className="space-y-4">
        <Typography variant="h2">Mini BEE and Community Impact</Typography>
        <Typography>
          Develop your technical toolkit through our specialized workshop series
          and the &quot;Mini-BEE&quot; events designed to build core engineering
          and professional skills.
        </Typography>
      </section>
      <section className="space-y-4">
        <Typography variant="h2">BMES Projects</Typography>
        <Typography>
          We compete annually in the prestigious Medtronic Medical Design
          Competition at the National BMES Conference. Our members gain hands-on
          engineering experience in the Super Fab Lab, where we are currently
          building an advanced prosthetic arm and a companion robot named Art-E.
        </Typography>
      </section>
      <section className="space-y-4">
        <Typography variant="h2">
          Networking & Interdisciplinary Events
        </Typography>
        <Typography>
          Expand your network by engaging with peers and industry professionals
          through cross-club collaborations and joint professional development
          sessions.
        </Typography>
      </section>

      <section aria-labelledby="highlights-heading" className="space-y-4">
        <Carousel
          opts={{ align: "center", loop: true }}
          className="relative left-1/2 w-dvw -translate-x-1/2"
        >
          <CarouselAutoAdvance delay={7500} />
          <div className="mx-auto mb-4 flex w-full max-w-6xl justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <Typography id="highlights-heading" variant="h2">
              Our highlights
            </Typography>
            <div className="space-x-2">
              <CarouselPrevious className="static" />
              <CarouselNext className="static" />
            </div>
          </div>
          <div className="relative">
            <CarouselContent className="ml-0 gap-4 px-4">
              {Array.from({ length: 2 }, (_, setIndex) => (
                <Fragment key={setIndex}>
                  <CarouselItem className="max-w-3xl basis-[calc(100dvw-2rem)] pl-0">
                    <HighlightCard
                      title="Projects"
                      image="/home-page/BMES-Project.png"
                      alt="BMES members working on a design project in the lab"
                    >
                      <p>
                        We compete each year in the Medtronic Medical Design
                        Competition at the National BMES Conference.
                      </p>
                      <p>
                        Our current builds include a prosthetic arm and a
                        companion robot named Art-E.
                      </p>
                      <p>
                        Join us in the Super Fab Lab. Fall meeting details are
                        coming soon.
                      </p>
                    </HighlightCard>
                  </CarouselItem>

                  <CarouselItem className="max-w-3xl basis-[calc(100dvw-2rem)] pl-0">
                    <HighlightCard
                      title="Mini BEE outreach"
                      image="/home-page/mini-bee-photo.png"
                      alt="Students taking part in a Mini BEE hands-on activity"
                    >
                      <p>
                        Created with Honeywell, Mini BEE introduces K-12
                        students to biomedical engineering through hands-on kits
                        and activities.
                      </p>
                      <p>
                        We work with the Charlotte Mecklenburg Library, Society
                        of Women Engineers, and Discovery Place.
                      </p>
                      <p>
                        The program gives local students an approachable first
                        look at engineering.
                      </p>
                    </HighlightCard>
                  </CarouselItem>

                  <CarouselItem className="max-w-3xl basis-[calc(100dvw-2rem)] pl-0">
                    <HighlightCard
                      title="Professional development"
                      image="/home-page/Networking & Interdisciplinary Events.png"
                      alt="BMES members at a professional networking event"
                    >
                      <p>
                        We work with alumni, industry professionals, the College
                        of Engineering, and the Office of Undergraduate
                        Research.
                      </p>
                      <p>
                        Members get access to engineering and networking events
                        on and off campus.
                      </p>
                      <p>
                        These connections help members prepare for careers in
                        biomedical engineering and related fields.
                      </p>
                    </HighlightCard>
                  </CarouselItem>
                </Fragment>
              ))}
            </CarouselContent>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10"
              style={{
                width: "max(0px, calc((100dvw - 72rem) / 2))",
                background:
                  "linear-gradient(to right, var(--background), transparent)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10"
              style={{
                width: "max(0px, calc((100dvw - 72rem) / 2))",
                background:
                  "linear-gradient(to left, var(--background), transparent)",
              }}
            />
          </div>
        </Carousel>
      </section>
    </Container>
  );
}
