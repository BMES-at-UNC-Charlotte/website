import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import "tailwindcss";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    >
      <section className="space-y-5">
        <Typography variant="h1">Purpose</Typography>
        <Typography variant="h2">
          UNCC Biomedical Engineering Society
        </Typography>
        <Typography variant="h6">
          The Biomedical Engineering Society at UNC Charlotte is dedicated to
          advancing the field by building a supportive, inclusive community that
          empowers the next generation of engineers. We foster innovation and
          professional growth by providing hands-on projects, professional
          development opportunities, and community outreach that bridge the gap
          between academic theory and real-world engineering application.
        </Typography>
        <div className="gap flex flex-wrap"></div>
      </section>
      <section className="space-y-3.5">
        <div className="gap flex flex-wrap"></div>
        <Typography variant="h2">Mini BEE and Community Impact</Typography>
        <Typography variant="h6">
          Develop your technical toolkit through our specialized workshop series
          and the "Mini-BEE" events designed to build core engineering and
          professional skills.
        </Typography>
        <section className="space-y-3.5">
          <div className="gap flex flex-wrap"></div>
          <Typography variant="h2">BMES Projects</Typography>
          <Typography variant="h6">
            We compete annually in the prestigious Medtronic Medical Design
            Competition at the National BMES Conference. Our members gain
            hands-on engineering experience in the Super Fab Lab, where we are
            currently building an advanced prosthetic arm and a companion robot
            named Art-E.
          </Typography>
        </section>
        <Typography variant="h2">
          Networking & Interdisciplinary Events
        </Typography>
        <Typography variant="h6">
          Expand your network by engaging with peers and industry professionals
          through cross-club collaborations and joint professional development
          sessions.
        </Typography>
        <div className="gap flex flex-wrap"></div>
        <Card>
          <CardContent className="space-y-3 pt-8">
            <Typography variant="h2">Our Highlights</Typography>
            <Typography variant="h3">Projects</Typography>
            <div className="flex items-start gap-3">
              <img
                src="home-page/BMES-Project.png"
                alt="BMES Projects Photo"
                width="205"
                height="205"
                loading="auto"
                align="left"
              />

              <ul className="list-inside list-disc">
                <font size="4">
                  <li>
                    National Design Competition: We compete annually in the
                    prestigious Medtronic Medical Design Competition at the
                    National BMES Conference.
                  </li>
                </font>
                <font size="4">
                  <li>
                    Current Builds: We are actively engineering a prosthetic arm
                    and a companion robot named Art-E.
                  </li>
                </font>
                <font size="4">
                  <li>
                    Where We Meet: Catch us in the Super Fab Lab! (TIME AND DATE
                    TO BE DETERMINED LATER IN THE FALL)
                  </li>
                </font>
              </ul>
            </div>

            <div className="gap flex flex-wrap"></div>
            <Typography variant="h3">Mini BEE (Outreach)</Typography>
            <div className="flex items-start gap-3">
              <img
                src="home-page/mini-bee-photo.png"
                alt="Mini BEE and Community Impact Photo"
                width="205"
                height="205"
                loading="auto"
                align="left"
              />
              <ul className="list-inside list-disc">
                <font size="4">
                  <li>
                    The Mission: Launched in partnership with Honeywell, our
                    signature program introduces K-12 students to the incredible
                    world of biomedical engineering through hands-on kits and
                    activities.
                  </li>
                </font>
                <font size="4">
                  <li>
                    Our Partners: We proudly collaborate with the Charlotte
                    Mecklenburg Library, SWE (Society of Women Engineers), and
                    the Discovery Place Museum.
                  </li>
                </font>
                <font size="4">
                  <li>
                    The Goal: To positively educate, nurture, and give back to
                    our local community.
                  </li>
                </font>
              </ul>
            </div>

            <div className="gap flex flex-wrap"></div>
            <Typography variant="h3">Professional Development</Typography>
            <div className="flex items-start gap-3">
              <img
                src="home-page/Networking & Interdisciplinary Events.png"
                alt="Mini BEE and Community Impact Photo"
                width="205"
                height="205"
                loading="auto"
                align="left"
              />
              <ul className="list-inside list-disc">
                <font size="4">
                  <li>
                    Strategic Partnerships: We collaborate with Alumni, industry
                    professionals, the College of Engineering, and the Office of
                    Undergraduate Research (OUR).
                  </li>
                </font>
                <font size="4">
                  <li>
                    Networking & Events: We connect our members to exclusive
                    professional engineering opportunities and networking
                    events, both on and off campus.
                  </li>
                </font>
                <font size="4">
                  <li>
                    Future Prep: Our goal is to fully prepare members for
                    post-grad careers and future endeavors in biomedical
                    engineering and overlapping fields.
                  </li>
                </font>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </Container>
  );
}
