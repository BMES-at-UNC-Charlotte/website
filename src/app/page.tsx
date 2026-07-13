import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";

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
    >
      <Typography variant="h1">Home</Typography>
    </Container>
  );
}
