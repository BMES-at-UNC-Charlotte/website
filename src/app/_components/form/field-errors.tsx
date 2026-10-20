"use client";

import { FieldError } from "@/components/ui/field";
import { useSelector, type AnyFieldApi } from "@tanstack/react-form";

function getErrorMessages(errors: readonly unknown[]): string[] {
  return errors.flatMap((error) => {
    if (Array.isArray(error)) {
      return getErrorMessages(error);
    }

    if (typeof error === "string") {
      return error;
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    return [];
  });
}

export function getFieldErrorState(
  field: {
    name: string;
    state: {
      meta: { isTouched: boolean; isValid: boolean; errors: unknown[] };
    };
  },
  isSubmitted: boolean,
) {
  const invalid =
    !field.state.meta.isValid && (field.state.meta.isTouched || isSubmitted);

  return {
    invalid,
    errorId: `${field.name}-error`,
    errors: field.state.meta.errors,
  };
}

export function useFieldErrorState(field: AnyFieldApi) {
  const isSubmitted = useSelector(
    field.form.store,
    (state) => state.submissionAttempts > 0,
  );
  return getFieldErrorState(field, isSubmitted);
}

export function FieldErrors({ id, errors }: { id: string; errors: unknown[] }) {
  const messages = getErrorMessages(errors);

  if (messages.length === 0) {
    return null;
  }

  return (
    <FieldError id={id} errors={messages.map((message) => ({ message }))} />
  );
}
