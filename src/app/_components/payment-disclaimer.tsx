"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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
            <p>
              This is not an official University of North Carolina at Charlotte
              (&quot;University&quot;) website. This registration and payment
              portal is administered by a third-party payment processor. The
              payment processor is responsible for the security and system
              availability of the payment portal. The University does not
              endorse, recommend, guarantee, control, or accept responsibility
              for any product or service made available by the payment
              processor. The presence of a link to the payment processor&#x27;s
              website does not imply any affiliation, endorsement, approval, or
              verification by the University.
            </p>
            <p>
              You understand that the payment processor&#x27;s website may
              contain terms and privacy policies that are different from the
              University&#x27;s terms and policies. You should review these
              provisions to ensure that you understand them, and to determine
              whether the website is suitable for you. The University does not
              review, and is not responsible for, these provisions.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
