"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import type { ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLegend } from "./field-label";

export type CheckboxOption = {
  label: ReactNode;
  value: string;
};

export function CheckboxGroupField({
  label,
  description,
  options,
}: {
  label: ReactNode;
  description?: ReactNode;
  options: CheckboxOption[];
}) {
  const field = useFieldContext<string[]>();
  const { invalid, errorId, errors } = useFieldErrorState(field);

  return (
    <FieldSet data-invalid={invalid}>
      <FormFieldLegend label={label} description={description} />
      <FieldGroup data-slot="checkbox-group">
        {options.map((option) => {
          const id = `${field.name}-${option.value}`;
          const checked = field.state.value.includes(option.value);

          return (
            <Field key={option.value} orientation="horizontal">
              <Checkbox
                checked={checked}
                id={id}
                name={field.name}
                value={option.value}
                aria-invalid={invalid}
                onCheckedChange={(nextChecked) => {
                  field.handleChange(
                    nextChecked
                      ? [...field.state.value, option.value]
                      : field.state.value.filter(
                          (value) => value !== option.value,
                        ),
                  );
                }}
              />
              <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
      {invalid ? <FieldErrors id={errorId} errors={errors} /> : null}
    </FieldSet>
  );
}
