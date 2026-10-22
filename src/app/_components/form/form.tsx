"use client";

import { createFormHook } from "@tanstack/react-form";

import { CheckboxGroupField } from "./checkbox-group-field";
import { fieldContext, formContext } from "./contexts";
import { RadioCardField } from "./radio-card-field";
import { SubmitButton } from "./submit-button";
import { TextareaField } from "./textarea-field";
import { TextField } from "./text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    CheckboxGroupField,
    RadioCardField,
    TextareaField,
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
