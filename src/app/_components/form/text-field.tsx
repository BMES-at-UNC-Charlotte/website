"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ComponentProps, ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLabel } from "./field-label";

type TextFieldProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur"
> & {
  label: ReactNode;
  description?: ReactNode;
};

export function TextField({
  label,
  description,
  required,
  ...props
}: TextFieldProps) {
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
      <Input
        {...props}
        id={field.name}
        name={field.name}
        required={required}
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
