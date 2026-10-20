"use client";

import { FieldDescription, FieldSet } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReactNode } from "react";
import { useFieldContext } from "./contexts";
import { FieldErrors, useFieldErrorState } from "./field-errors";
import { FormFieldLegend } from "./field-label";

export type RadioCardOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function RadioCardField({
  label,
  description,
  options,
  required = false,
  empty,
}: {
  label: ReactNode;
  description?: ReactNode;
  options: RadioCardOption[];
  required?: boolean;
  empty?: ReactNode;
}) {
  const field = useFieldContext<string>();
  const { invalid, errorId, errors } = useFieldErrorState(field);

  return (
    <FieldSet data-invalid={invalid}>
      <FormFieldLegend
        label={label}
        description={description}
        required={required}
      />
      {options.length > 0 ? (
        <RadioGroup
          aria-describedby={invalid ? errorId : undefined}
          aria-invalid={invalid}
          aria-required={required}
          name={field.name}
          value={field.state.value}
          onValueChange={(nextValue) => {
            if (typeof nextValue !== "string" || nextValue === "") return;
            field.handleChange(nextValue);
            field.handleBlur();
          }}
        >
          {options.map((option) => (
            <Item
              key={option.value}
              render={<label htmlFor={`${field.name}-${option.value}`} />}
              variant={field.state.value === option.value ? "muted" : "outline"}
            >
              <ItemMedia>
                <RadioGroupItem
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="line-clamp-none whitespace-normal">
                  {option.title}
                </ItemTitle>
                {option.description ? (
                  <FieldDescription className="line-clamp-none whitespace-normal">
                    {option.description}
                  </FieldDescription>
                ) : null}
              </ItemContent>
              {option.action ? (
                <ItemActions>{option.action}</ItemActions>
              ) : null}
            </Item>
          ))}
        </RadioGroup>
      ) : (
        empty
      )}
      {invalid ? <FieldErrors id={errorId} errors={errors} /> : null}
    </FieldSet>
  );
}
