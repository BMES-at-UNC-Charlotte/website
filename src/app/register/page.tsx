import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { env } from "@/env";
import { EmployerRegistrationForm } from "@/app/register/_components/employer-registration-form";
import { Container } from "../_components/container";

export default function RegisterPage() {
  return (
    <Container contentClassName="space-y-12">
      <header className="max-w-4xl space-y-6">
        <Badge variant="secondary">Employer checkout</Badge>
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            Reserve your employer package
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Complete your organization profile and secure your place at the UNC
            Charlotte BMES biomedical industry employer event.
          </p>
        </div>
        <ItemGroup className="grid sm:grid-cols-3">
          <EventDetail icon={CalendarDays} label="October 7, 2026" />
          <EventDetail icon={Clock3} label="11:00 a.m.–3:00 p.m." />
          <EventDetail icon={MapPin} label="Duke Centennial Hall" />
        </ItemGroup>
      </header>
      <Separator />
      <EmployerRegistrationForm
        publishableKey={env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
      />
    </Container>
  );
}

function EventDetail({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <Item size="sm">
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
    </Item>
  );
}
