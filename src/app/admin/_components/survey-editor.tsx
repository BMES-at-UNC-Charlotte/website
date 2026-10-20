"use client";

import { type FormEvent, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  surveyInputSchema,
  surveyToday,
  type SurveyInput,
} from "@/lib/surveys";
import { api, type RouterOutputs } from "@/trpc/react";

export type Survey = RouterOutputs["survey"]["list"][number];

export function SurveyEditor({
  survey,
  onClose,
}: {
  survey: Survey | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState<SurveyInput>(
    survey ?? {
      comment: "",
      path: "",
      formUrl: "",
      live: false,
      closesOn: null,
    },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof SurveyInput, string[]>>
  >({});
  const utils = api.useUtils();
  const create = api.survey.create.useMutation();
  const update = api.survey.update.useMutation();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function change<Key extends keyof SurveyInput>(
    key: Key,
    value: SurveyInput[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    create.reset();
    update.reset();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = surveyInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    try {
      if (survey)
        await update.mutateAsync({ id: survey.id, values: parsed.data });
      else await create.mutateAsync(parsed.data);
      await utils.survey.list.invalidate();
      onClose();
    } catch {
      // Keep entered values and display the server error in the dialog.
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>{survey ? "Edit survey" : "New survey"}</DialogTitle>
            <DialogDescription>
              Embed a Google Form and choose an easy-to-type link for its page.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <fieldset disabled={pending} className="space-y-6">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.path)}>
                  <FieldLabel htmlFor="survey-path">Short link</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>/s/</InputGroupAddon>
                    <InputGroupInput
                      id="survey-path"
                      autoFocus
                      placeholder="member-feedback"
                      required
                      maxLength={64}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={values.path}
                      onChange={(event) =>
                        change("path", event.target.value.toLowerCase())
                      }
                      aria-invalid={Boolean(errors.path)}
                      aria-describedby="survey-path-help survey-path-error"
                    />
                  </InputGroup>
                  <FieldDescription id="survey-path-help">
                    Letters, numbers, and hyphens. Changing this breaks the
                    previous link and its QR code.
                  </FieldDescription>
                  <FieldError id="survey-path-error">
                    {errors.path?.[0]}
                  </FieldError>
                </Field>
                <Field data-invalid={Boolean(errors.formUrl)}>
                  <FieldLabel htmlFor="survey-form-url">
                    Google Form URL
                  </FieldLabel>
                  <Input
                    id="survey-form-url"
                    type="url"
                    required
                    maxLength={2048}
                    placeholder="https://docs.google.com/forms/…/viewform"
                    value={values.formUrl}
                    onChange={(event) => change("formUrl", event.target.value)}
                    aria-invalid={Boolean(errors.formUrl)}
                    aria-describedby="survey-url-help survey-url-error"
                  />
                  <FieldDescription id="survey-url-help">
                    Paste the full docs.google.com/forms/…/viewform responder
                    link, rather than a shortened forms.gle link or editor URL.
                    Responses are collected in Google Forms.
                  </FieldDescription>
                  <FieldError id="survey-url-error">
                    {errors.formUrl?.[0]}
                  </FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="survey-comment">
                    Admin comment (optional)
                  </FieldLabel>
                  <Textarea
                    id="survey-comment"
                    maxLength={2000}
                    rows={3}
                    aria-describedby="survey-comment-help"
                    value={values.comment}
                    onChange={(event) => change("comment", event.target.value)}
                  />
                  <FieldDescription id="survey-comment-help">
                    Only visible to officers in the admin portal.
                  </FieldDescription>
                </Field>
                <Field data-invalid={Boolean(errors.closesOn)}>
                  <FieldLabel htmlFor="survey-close-date">
                    Close date (optional)
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="survey-close-date"
                      type="date"
                      min={surveyToday()}
                      max="9999-12-31"
                      value={values.closesOn ?? ""}
                      onChange={(event) =>
                        change("closesOn", event.target.value || null)
                      }
                      aria-invalid={Boolean(errors.closesOn)}
                      aria-describedby="survey-date-help survey-date-error"
                    />
                    {values.closesOn && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => change("closesOn", null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <FieldDescription id="survey-date-help">
                    Open through 11:59 PM on this day in Charlotte time. When
                    expired, the link turns off and the date clears. Leave blank
                    to keep it open until you turn it off.
                  </FieldDescription>
                  <FieldError id="survey-date-error">
                    {errors.closesOn?.[0]}
                  </FieldError>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="survey-live">
                      Survey link is live
                    </FieldLabel>
                    <FieldDescription id="survey-live-help">
                      Visitors can access the survey only while this is on.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="survey-live"
                    checked={values.live}
                    onCheckedChange={(live) => change("live", live)}
                    aria-describedby="survey-live-help"
                  />
                </Field>
              </FieldGroup>
            </fieldset>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error.data?.zodError
                    ? Object.values(error.data.zodError.fieldErrors)
                        .flat()
                        .join(" ")
                    : error.message}
                </AlertDescription>
              </Alert>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {survey ? "Save changes" : "Create survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
