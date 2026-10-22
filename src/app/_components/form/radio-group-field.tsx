"use client";

import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLegend } from "./field-label";

export type RadioOption = {
  label: ReactNode;
  value: string | number;
};

export function RadioGroupField({
  label,
  description,
  options,
  required = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  options: RadioOption[];
  required?: boolean;
}) {
  const field = useFieldContext<string | number>();
  const { invalid, errorId, errors } = useFieldErrorState(field);

  return (
    <FieldSet data-invalid={invalid}>
      <FormFieldLegend
        label={label}
        description={description}
        required={required}
      />
      <RadioGroup
        aria-describedby={invalid ? errorId : undefined}
        aria-invalid={invalid}
        aria-required={required}
        name={field.name}
        value={String(field.state.value)}
        onValueChange={(nextValue) => {
          if (typeof nextValue !== "string") return;
          const option = options.find(
            (item) => String(item.value) === nextValue,
          );
          if (!option) return;
          field.handleChange(option.value);
          field.handleBlur();
        }}
      >
        {options.map((option) => {
          const id = `${field.name}-${option.value}`;

          return (
            <Field key={String(option.value)} orientation="horizontal">
              <RadioGroupItem id={id} value={String(option.value)} />
              <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
      {invalid ? <FieldErrors id={errorId} errors={errors} /> : null}
    </FieldSet>
  );
}
