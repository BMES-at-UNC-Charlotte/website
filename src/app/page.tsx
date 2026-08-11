import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";

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
      heroContent={<Typography variant="h3">Biomedical Engineering Society</Typography>}
    >
      <Typography variant="h1">Purpose</Typography>
      <Typography variant="h2">UNCC Biomedical Engineering Society</Typography>
        The Biomedical Engineering Society at UNC Charlotte is dedicated to advancing the field by building a supportive, inclusive community that empowers the next generation of engineers. We foster innovation and professional growth by providing hands-on projects, professional development opportunities, and community outreach that bridge the gap between academic theory and real-world engineering application. 
    
      <section className="space-y-4">
        <div className="space-y-1">
          <Typography variant="h2">Mini BEE and Community Impact</Typography>
            Develop your technical toolkit through our specialized workshop series and the "Mini-BEE" events designed to build core engineering and professional skills.
        <img src="mini-bee-photo.png" alt="Mini BEE and Community Impact Photo"></img>
          <Typography variant="h2">BMES Projects</Typography>  
           We compete annually in the prestigious Medtronic Medical Design Competition at the National BMES Conference. 
           Our members gain hands-on engineering experience in the Super Fab Lab, where we are currently building an advanced prosthetic arm and a companion robot named Art-E.
        <img src="BMES-Project.png" alt="BMES Projects Photo"></img>
           
       <Typography variant="h2">Networking & Interdisciplinary Events</Typography> 
      Expand your network by engaging with peers and industry professionals through cross-club collaborations and joint professional development sessions
        <img src="Networking & Interdisciplinary Events.png" alt="Networking & Interdisciplinary Events Photo"></img>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Typography variant="h2">Our Highlights</Typography>
          <Typography variant="h3">Projects</Typography>
          + National Design Competition: We compete annually in the prestigious Medtronic Medical Design Competition at the National BMES Conference.
          <Typography>+ Current Builds: We are actively engineering a prosthetic arm and a companion robot named Art-E.</Typography>
          + Where We Meet: Catch us in the Super Fab Lab! (TIME AND DATE TO BE DETERMINED LATER IN THE FALL)
       
        <Typography variant="h3">Mini BEE (Outreach)</Typography>
        +The Mission: Launched in partnership with Honeywell, our signature program introduces K-12 students to the incredible world of biomedical engineering through hands-on kits and activities.
        <Typography>+Our Partners: We proudly collaborate with the Charlotte Mecklenburg Library, SWE (Society of Women Engineers), and the Discovery Place Museum.</Typography>
        + The Goal: To positively educate, nurture, and give back to our local community.
      
        <Typography variant="h3">Professional Development</Typography>
        +Strategic Partnerships: We collaborate with Alumni, industry professionals, the College of Engineering, and the Office of Undergraduate Research (OUR).
        <Typography>+Networking & Events: We connect our members to exclusive professional engineering opportunities and networking events, both on and off campus.</Typography>
      + Future Prep: Our goal is to fully prepare members for post-grad careers and future endeavors in biomedical engineering and overlapping fields.
      </CardContent>
      </Card>
      </div>
      </section>
    </Container>
    
  );
}
