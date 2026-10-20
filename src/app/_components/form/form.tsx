"use client";

import { createFormHook } from "@tanstack/react-form";

import { BooleanRadioField } from "./boolean-radio-field";
import { CheckboxGroupField } from "./checkbox-group-field";
import { fieldContext, formContext } from "./contexts";
import { RadioCardField } from "./radio-card-field";
import { RadioGroupField } from "./radio-group-field";
import { SubmitButton } from "./submit-button";
import { TextareaField } from "./textarea-field";
import { TextField } from "./text-field";

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    BooleanRadioField,
    CheckboxGroupField,
    RadioCardField,
    RadioGroupField,
    TextareaField,
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
