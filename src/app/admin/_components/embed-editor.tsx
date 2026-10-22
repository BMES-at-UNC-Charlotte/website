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
  embeddedPageInputSchema,
  embeddedPageToday,
  type EmbeddedPageInput,
} from "@/lib/embeds";
import { api, type RouterOutputs } from "@/trpc/react";

export type EmbeddedPage = RouterOutputs["embed"]["list"][number];

export function EmbeddedPageEditor({
  page,
  onClose,
}: {
  page: EmbeddedPage | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState<EmbeddedPageInput>(
    page ?? {
      comment: "",
      path: "",
      url: "",
      live: false,
      closesOn: null,
    },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof EmbeddedPageInput, string[]>>
  >({});
  const utils = api.useUtils();
  const create = api.embed.create.useMutation();
  const update = api.embed.update.useMutation();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function change<Key extends keyof EmbeddedPageInput>(
    key: Key,
    value: EmbeddedPageInput[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    create.reset();
    update.reset();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = embeddedPageInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    try {
      if (page) await update.mutateAsync({ id: page.id, values: parsed.data });
      else await create.mutateAsync(parsed.data);
      await utils.embed.list.invalidate();
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
            <DialogTitle>{page ? "Edit page" : "New page"}</DialogTitle>
            <DialogDescription>
              Embed a form, presentation, or other page with an easy-to-type
              link.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <fieldset disabled={pending} className="space-y-6">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.path)}>
                  <FieldLabel htmlFor="embed-path">Short link</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>/s/</InputGroupAddon>
                    <InputGroupInput
                      id="embed-path"
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
                      aria-describedby="embed-path-help embed-path-error"
                    />
                  </InputGroup>
                  <FieldDescription id="embed-path-help">
                    Letters, numbers, and hyphens. Changing this breaks the
                    previous link and its QR code.
                  </FieldDescription>
                  <FieldError id="embed-path-error">
                    {errors.path?.[0]}
                  </FieldError>
                </Field>
                <Field data-invalid={Boolean(errors.url)}>
                  <FieldLabel htmlFor="embed-url">Page URL</FieldLabel>
                  <Input
                    id="embed-url"
                    type="url"
                    required
                    maxLength={2048}
                    placeholder="https://example.com/presentation"
                    value={values.url}
                    onChange={(event) => change("url", event.target.value)}
                    aria-invalid={Boolean(errors.url)}
                    aria-describedby="embed-url-help embed-url-error"
                  />
                  <FieldDescription id="embed-url-help">
                    Paste any HTTP or HTTPS link. For Google Forms, use the full
                    docs.google.com/forms/…/viewform responder link. Other links
                    are embedded as entered; if a site blocks embedding,
                    visitors can open it in a new tab.
                  </FieldDescription>
                  <FieldError id="embed-url-error">
                    {errors.url?.[0]}
                  </FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="embed-comment">
                    Admin comment (optional)
                  </FieldLabel>
                  <Textarea
                    id="embed-comment"
                    maxLength={2000}
                    rows={3}
                    aria-describedby="embed-comment-help"
                    value={values.comment}
                    onChange={(event) => change("comment", event.target.value)}
                  />
                  <FieldDescription id="embed-comment-help">
                    Only visible to officers in the admin portal.
                  </FieldDescription>
                </Field>
                <Field data-invalid={Boolean(errors.closesOn)}>
                  <FieldLabel htmlFor="embed-close-date">
                    Close date (optional)
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="embed-close-date"
                      type="date"
                      min={embeddedPageToday()}
                      max="9999-12-31"
                      value={values.closesOn ?? ""}
                      onChange={(event) =>
                        change("closesOn", event.target.value || null)
                      }
                      aria-invalid={Boolean(errors.closesOn)}
                      aria-describedby="embed-date-help embed-date-error"
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
                  <FieldDescription id="embed-date-help">
                    Open through 11:59 PM on this day in EST. When expired, the
                    link turns off and the date clears. Leave blank to keep it
                    open until you turn it off.
                  </FieldDescription>
                  <FieldError id="embed-date-error">
                    {errors.closesOn?.[0]}
                  </FieldError>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="embed-live">
                      Page link is live
                    </FieldLabel>
                    <FieldDescription id="embed-live-help">
                      Visitors can access the page only while this is on.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="embed-live"
                    checked={values.live}
                    onCheckedChange={(live) => change("live", live)}
                    aria-describedby="embed-live-help"
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
              {page ? "Save changes" : "Create page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
