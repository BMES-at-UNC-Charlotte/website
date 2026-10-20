"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ComponentProps, ReactNode } from "react";
import { useFormContext } from "./contexts";

export function SubmitButton({
  children,
  pending,
  showSpinner = true,
  ...props
}: ComponentProps<typeof Button> & {
  pending?: ReactNode;
  showSpinner?: boolean;
}) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          {...props}
          type="submit"
          disabled={isSubmitting ? true : props.disabled}
        >
          {isSubmitting
            ? (pending ?? (
                <>
                  {showSpinner ? <Spinner /> : null}
                  {children}
                </>
              ))
            : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
