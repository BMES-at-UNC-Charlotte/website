import { Typography } from "@/app/_components/typography";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User2 } from "lucide-react";

type OfficerCardProps = {
  className?: string;
  image?: string;
  name: string;
  role: string;
};

export function OfficerCard({
  className,
  image,
  name,
  role,
}: OfficerCardProps) {
  return (
    <Card className={cn("w-full gap-0 overflow-hidden py-0", className)}>
      {image ? (
        <img
          src={image}
          alt={name}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div
          className="bg-muted flex aspect-square h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <User2 strokeWidth={1.8} className="size-full p-26 opacity-40" />
        </div>
      )}
      <CardContent className="space-y-2 p-5 text-center">
        <Typography variant="h4">{name}</Typography>
        <Typography variant="caption">{role}</Typography>
      </CardContent>
    </Card>
  );
}
