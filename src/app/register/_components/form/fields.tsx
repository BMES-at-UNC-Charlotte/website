"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useFieldContext } from "./contexts";

type Option = { label: string; value: string };

const fieldErrors = (errors: unknown[]) =>
  errors.map((error) => ({
    message:
      typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Invalid value",
  }));

export function TextField({
  label,
  type,
  placeholder,
  required = false,
}: {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
}) {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required ? " *" : ""}
      </FieldLabel>
      <Input
        aria-invalid={invalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={field.state.value ?? ""}
      />
      <FieldError errors={fieldErrors(field.state.meta.errors)} />
    </Field>
  );
}

export function TextareaField({
  label,
  description,
  rows = 5,
  required = false,
}: {
  label: string;
  description?: string;
  rows?: number;
  required?: boolean;
}) {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required ? " *" : ""}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <Textarea
        aria-invalid={invalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        required={required}
        rows={rows}
        value={field.state.value ?? ""}
      />
      <FieldError errors={fieldErrors(field.state.meta.errors)} />
    </Field>
  );
}

export function CheckboxGroupField({
  label,
  description,
  options,
}: {
  label: string;
  description?: string;
  options: Option[];
}) {
  const field = useFieldContext<string[]>();

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldGroup data-slot="checkbox-group">
        {options.map((option) => {
          const checked = field.state.value.includes(option.value);
          return (
            <Field key={option.value} orientation="horizontal">
              <Checkbox
                checked={checked}
                id={`${field.name}-${option.value}`}
                name={field.name}
                onCheckedChange={(nextChecked) => {
                  field.handleChange(
                    nextChecked
                      ? [...field.state.value, option.value]
                      : field.state.value.filter(
                          (value) => value !== option.value,
                        ),
                  );
                }}
                value={option.value}
              />
              <FieldLabel htmlFor={`${field.name}-${option.value}`}>
                {option.label}
              </FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
      <FieldError errors={fieldErrors(field.state.meta.errors)} />
    </FieldSet>
  );
}

export function BooleanRadioField({
  label,
  optional = false,
}: {
  label: string;
  optional?: boolean;
}) {
  const field = useFieldContext<boolean | undefined>();
  const value =
    field.state.value === undefined ? "" : field.state.value ? "yes" : "no";

  return (
    <FieldSet>
      <FieldLegend variant="label">
        {label}
        {optional ? " (optional)" : " *"}
      </FieldLegend>
      <RadioGroup
        aria-required={!optional}
        onValueChange={(nextValue) => {
          field.handleChange(nextValue === "yes");
          field.handleBlur();
        }}
        value={value}
      >
        {[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ].map((option) => (
          <Field key={option.value} orientation="horizontal">
            <RadioGroupItem
              id={`${field.name}-${option.value}`}
              value={option.value}
            />
            <FieldLabel htmlFor={`${field.name}-${option.value}`}>
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      <FieldError errors={fieldErrors(field.state.meta.errors)} />
    </FieldSet>
  );
}

export function RepresentativeField({
  additionalUnitAmount,
  formatPrice,
}: {
  additionalUnitAmount?: number;
  formatPrice: (amount: number) => string;
}) {
  const field = useFieldContext<number>();

  return (
    <FieldSet>
      <FieldLegend variant="label">Representatives</FieldLegend>
      <FieldDescription>
        Two representatives are included with registration.
      </FieldDescription>
      <RadioGroup
        aria-required
        onValueChange={(nextValue) => field.handleChange(Number(nextValue))}
        value={String(field.state.value)}
      >
        {[1, 2, 3, 4].map((count) => (
          <Field key={count} orientation="horizontal">
            <RadioGroupItem
              id={`${field.name}-${count}`}
              value={String(count)}
            />
            <FieldLabel htmlFor={`${field.name}-${count}`}>
              {count} {count === 1 ? "representative" : "representatives"}
              {count > 2 && additionalUnitAmount
                ? ` · +${formatPrice((count - 2) * additionalUnitAmount)}`
                : ""}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      <FieldError errors={fieldErrors(field.state.meta.errors)} />
    </FieldSet>
  );
}
