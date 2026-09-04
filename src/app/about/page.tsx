/*import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <Container>
      <Typography variant="h1">About Us </Typography>
      <Card className="inline-block max-w-sm">
        <CardHeader>This is a test</CardHeader>
        <CardContent>
          <img src="/about/lillian-cain.jpg" alt="Lillian Cain" />
        </CardContent>
        <CardDescription>I am Lillian Cain</CardDescription>
      </Card>
      <Card className="inline-block max-w-sm">
        <CardHeader>This is a test</CardHeader>
        <CardContent>
          <img src="/about/lillian-cain.jpg" alt="Lillian Cain" />
        </CardContent>
        <CardDescription>I am Lillian Cain</CardDescription>
      </Card>
    </Container>
  );
}
*/
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { Card, CardContent } from "@/components/ui/card";

const leadership = [
  {
    name: "Isabella Alzamora",
    role: "President",
    image: "/about/isabella.png",
  },
  {
    name: "Mario Portillo-Arreola",
    role: "Vice President",
    image: "",
  },
  {
    name: "Adriana Austin",
    role: "Secretary",
    image: "/about/adriana.png",
  },
  {
    name: "Rishi Bindela",
    role: "Treasurer",
    image: "/about/rishi.png",
  },
  {
    name: "Deepu Shishir Nallabothu",
    role: "Research Co-Chair",
    image: "/about/deepu.png",
  },
  {
    name: "Joshua Matherson",
    role: "Research Co-Chair",
    image: "/about/joshua.png",
  },
  {
    name: "Camryn Wheaton",
    role: "Professional Development Chair",
    image: "",
  },
  {
    name: "Jaden Reid",
    role: "Event Coordinator",
    image: "/about/jaden.png",
  },
  {
    name: "Ronnie Sahni",
    role: "Fundraising Chair",
    image: "/about/ronnie.png",
  },
  {
    name: "Jordan Nuno Rodriguez",
    role: "Outreach Director",
    image: "",
  },
  {
    name: "Scarlett Wilcher",
    role: "Social Media Manager",
    image: "",
  },
  {
    name: "Justin Brooks",
    role: "Webmaster",
    image: "/about/justin.png",
  },
  {
    name: "Lillian Cain",
    role: "Webmaster-Intern",
    image: "/about/lillian.png",
  },
];

export default function AboutPage() {
  return (
    <Container>
      {/* Page Title */}
      <div className="py-10 text-center">
        <Typography variant="h1">About Us</Typography>
      </div>

      {/* Leadership Title */}
      <div className="mb-10 text-center">
        <Typography variant="h2">Leadership</Typography>
      </div>

      {/* Leadership Cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {leadership.map((person, index) => (
          <Card
            key={`${person.name}-${index}`}
            className={`mx-auto w-full max-w-sm overflow-hidden ${
              index === leadership.length - 1 && leadership.length % 3 === 1
                ? "lg:col-start-2"
                : ""
            }`}
          >
            <CardContent className="p-0">
              {/* Officer Image */}
              <img
                src={person.image}
                alt={person.name}
                className="aspect-square w-full object-cover"
              />

              {/* Officer Information */}
              <div className="p-5 text-center">
                <h3 className="text-xl font-semibold">{person.name}</h3>

                <p className="text-muted-foreground mt-1">{person.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
