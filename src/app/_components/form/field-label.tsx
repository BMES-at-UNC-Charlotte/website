"use client";

import {
  FieldDescription,
  FieldLabel as UiFieldLabel,
  FieldLegend,
} from "@/components/ui/field";
import type { ReactNode } from "react";

function RequiredMark({ required }: { required?: boolean }) {
  if (!required) {
    return null;
  }

  return (
    <span className="text-destructive" aria-hidden>
      {" *"}
    </span>
  );
}

export function FormFieldLabel({
  htmlFor,
  label,
  description,
  required = false,
}: {
  htmlFor: string;
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
}) {
  return (
    <>
      <UiFieldLabel htmlFor={htmlFor}>
        {label}
        <RequiredMark required={required} />
      </UiFieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </>
  );
}

export function FormFieldLegend({
  label,
  description,
  required = false,
  hideLabel = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <>
      <FieldLegend
        variant="label"
        className={hideLabel ? "sr-only" : undefined}
      >
        {label}
        <RequiredMark required={required} />
      </FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </>
  );
}
