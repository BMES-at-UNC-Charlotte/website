import { Typography } from "@/app/_components/typography";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { type ReactNode } from "react";

type HighlightCardProps = {
  alt: string;
  children: ReactNode;
  image: string;
  title: string;
};

export function HighlightCard({
  alt,
  children,
  image,
  title,
}: HighlightCardProps) {
  return (
    <Card className="h-full py-0">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover/card:scale-[1.02]"
          sizes="(min-width: 768px) 768px, calc(100vw - 2rem)"
        />
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 py-6 sm:px-6">
        <Typography variant="h3" className="leading-tight">
          {title}
        </Typography>
        <div className="text-card-foreground/80 space-y-3 text-base leading-relaxed">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
