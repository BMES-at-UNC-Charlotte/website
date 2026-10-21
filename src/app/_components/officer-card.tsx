import { Typography } from "@/app/_components/typography";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User2 } from "lucide-react";
import Image from "next/image";

type OfficerCardProps = {
  className?: string;
  image?: string;
  name: string;
  priority?: boolean;
  role: string;
};

export function OfficerCard({
  className,
  image,
  name,
  priority = false,
  role,
}: OfficerCardProps) {
  return (
    <Card className={cn("w-full gap-0 overflow-hidden py-0", className)}>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={800}
          height={800}
          priority={priority}
          sizes="(min-width: 1024px) 342px, (min-width: 640px) 50vw, 100vw"
          className="aspect-square h-auto w-full object-cover"
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
