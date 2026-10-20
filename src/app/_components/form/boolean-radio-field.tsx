"use client";

import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLegend } from "./field-label";

export function BooleanRadioField({
  label,
  description,
  required = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
}) {
  const field = useFieldContext<boolean | undefined>();
  const { invalid, errorId, errors } = useFieldErrorState(field);
  const value =
    field.state.value === undefined ? "" : field.state.value ? "yes" : "no";

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
        value={value}
        onValueChange={(nextValue) => {
          if (typeof nextValue !== "string") return;
          field.handleChange(nextValue === "yes");
          field.handleBlur();
        }}
      >
        {[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ].map((option) => {
          const id = `${field.name}-${option.value}`;

          return (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem id={id} value={option.value} />
              <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
      {invalid ? <FieldErrors id={errorId} errors={errors} /> : null}
    </FieldSet>
  );
}
