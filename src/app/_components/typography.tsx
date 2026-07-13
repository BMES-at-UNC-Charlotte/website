import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "font-heading text-4xl tracking-tight sm:text-5xl",
      h2: "font-heading text-3xl",
      h3: "font-heading text-2xl",
      h4: "font-heading text-xl",
      h5: "font-heading text-lg",
      h6: "font-heading text-base",
      p: "text-base",
      subtitle: "text-lg text-muted-foreground",
      caption: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

const defaultElement: Record<
  TypographyVariant,
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
  subtitle: "p",
  caption: "p",
};

type TypographyProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  };

function Typography({
  className,
  variant = "p",
  as,
  ...props
}: TypographyProps) {
  const Comp = as ?? defaultElement[variant ?? "p"];

  return (
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
