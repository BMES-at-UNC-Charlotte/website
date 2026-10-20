"use client";

import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { ComponentProps, ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLabel } from "./field-label";

type TextareaFieldProps = Omit<
  ComponentProps<typeof Textarea>,
  "value" | "onChange" | "onBlur"
> & {
  label: ReactNode;
  description?: ReactNode;
};

export function TextareaField({
  label,
  description,
  required,
  rows = 5,
  ...props
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const { invalid, errorId, errors } = useFieldErrorState(field);

  return (
    <Field data-invalid={invalid}>
      <FormFieldLabel
        htmlFor={field.name}
        label={label}
        description={description}
        required={required}
      />
      <Textarea
        {...props}
        id={field.name}
        name={field.name}
        required={required}
        rows={rows}
        value={field.state.value ?? ""}
        aria-describedby={invalid ? errorId : undefined}
        aria-invalid={invalid}
        onBlur={() => field.handleBlur()}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {invalid ? <FieldErrors id={errorId} errors={errors} /> : null}
    </Field>
  );
}
