"use client";

import { useCarousel } from "@/components/ui/carousel";
import { useEffect } from "react";

type CarouselAutoAdvanceProps = {
  delay: number;
};

export function CarouselAutoAdvance({ delay }: CarouselAutoAdvanceProps) {
  const { api } = useCarousel();

  useEffect(() => {
    if (!api) return;

    const carousel =
      api.rootNode().closest<HTMLElement>('[data-slot="carousel"]') ??
      api.rootNode();
    let timer: number | undefined;

    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      timer = window.setInterval(() => api.scrollNext(), delay);
    };
    const handlePointerOut = (event: PointerEvent) => {
      const nextTarget = event.relatedTarget;

      if (nextTarget instanceof Node && carousel.contains(nextTarget)) return;
      start();
    };

    carousel.addEventListener("pointerover", stop);
    carousel.addEventListener("pointerout", handlePointerOut);

    if (!carousel.matches(":hover")) start();

    return () => {
      stop();
      carousel.removeEventListener("pointerover", stop);
      carousel.removeEventListener("pointerout", handlePointerOut);
    };
  }, [api, delay]);

  return null;
}
