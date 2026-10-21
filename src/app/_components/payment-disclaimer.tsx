"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { PAYMENT_DISCLAIMER_PARAGRAPHS } from "@/lib/payment-disclaimer";

export function PaymentDisclaimer() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="text-muted-foreground flex w-full items-center justify-center gap-1.5 text-xs"
        >
          <Info size={14} aria-hidden="true" />
          Operated independently of UNC Charlotte
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-2">
            {PAYMENT_DISCLAIMER_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
