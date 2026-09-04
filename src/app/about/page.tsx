import { Container } from "@/app/_components/container";
import { OfficerCard } from "@/app/_components/officer-card";
import { Typography } from "@/app/_components/typography";

const leadership = [
  {
    name: "Isabella Alzamora",
    role: "President",
    image: "/about/isabella.png",
  },
  {
    name: "Mario Portillo-Arreola",
    role: "Vice President",
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
  },
  {
    name: "Scarlett Wilcher",
    role: "Social Media Manager",
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
      <div className="space-y-6 text-center">
        <Typography variant="h1">About Us</Typography>
        <Typography variant="h2">Leadership</Typography>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {leadership.map((person, index) => (
            <OfficerCard
              key={`${person.name}-${index}`}
              name={person.name}
              role={person.role}
              image={person.image}
              className={
                index === leadership.length - 1 && leadership.length % 3 === 1
                  ? "lg:col-start-2"
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
