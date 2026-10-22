"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, type RouterOutputs } from "@/trpc/react";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type RegistrationPackage =
  RouterOutputs["registration"]["adminConfiguration"]["packages"][number];

type PackageDraft = {
  id?: string;
  title: string;
  priceIds: string;
  enabled: boolean;
  sortOrder: number;
};

const emptyPackage: PackageDraft = {
  title: "",
  priceIds: "",
  enabled: true,
  sortOrder: 0,
};

const packageDraft = (
  registrationPackage: RegistrationPackage,
): PackageDraft => ({
  id: registrationPackage.id,
  title: registrationPackage.title,
  priceIds: registrationPackage.stripePriceIds.join("\n"),
  enabled: registrationPackage.enabled,
  sortOrder: registrationPackage.sortOrder,
});

const parsePriceIds = (value: string) =>
  value
    .split(/[\s,]+/)
    .map((priceId) => priceId.trim())
    .filter(Boolean);

export function EmployerRegistrationSettings() {
  const configuration = api.registration.adminConfiguration.useQuery();
  const [draft, setDraft] = useState<PackageDraft>();

  if (configuration.isPending) {
    return (
      <Card>
        <CardContent>
          <Item>
            <Spinner />
            <ItemContent>
              <ItemTitle>Loading registration settings…</ItemTitle>
            </ItemContent>
          </Item>
        </CardContent>
      </Card>
    );
  }

  if (configuration.error || !configuration.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {configuration.error?.message ??
            "Employer registration settings could not be loaded."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registration packages</CardTitle>
          <CardAction>
            <Button onClick={() => setDraft({ ...emptyPackage })} size="sm">
              <Plus />
              Add package
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {configuration.data.packages.length > 0 ? (
            <ItemGroup>
              {configuration.data.packages.map((registrationPackage) => (
                <Item key={registrationPackage.id} variant="muted">
                  <ItemContent>
                    <ItemTitle className="flex items-center gap-2">
                      {registrationPackage.title}
                      <Badge
                        variant={
                          registrationPackage.enabled ? "default" : "outline"
                        }
                      >
                        {registrationPackage.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </ItemTitle>
                    <ItemDescription>
                      {registrationPackage.stripePriceIds.join(", ")}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      aria-label={`Edit ${registrationPackage.title}`}
                      onClick={() =>
                        setDraft(packageDraft(registrationPackage))
                      }
                      size="icon-sm"
                      variant="outline"
                    >
                      <Pencil />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Item variant="muted">
              <ItemContent>
                <ItemTitle>No packages configured</ItemTitle>
                <ItemDescription>
                  Add a package and its Stripe Price IDs to open employer
                  registration.
                </ItemDescription>
              </ItemContent>
            </Item>
          )}
        </CardContent>
      </Card>

      <EventFormSettings
        initialPriceId={configuration.data.additionalRepresentativePriceId}
      />

      <PackageDialog
        draft={draft}
        onOpenChange={(open) => !open && setDraft(undefined)}
      />
    </div>
  );
}

function EventFormSettings({ initialPriceId }: { initialPriceId: string }) {
  const [priceId, setPriceId] = useState(initialPriceId);
  const [editing, setEditing] = useState(false);
  const utils = api.useUtils();
  const savePrice =
    api.registration.saveAdditionalRepresentativePrice.useMutation({
      onSuccess: async () => {
        setEditing(false);
        await utils.registration.adminConfiguration.invalidate();
        await utils.registration.configuration.invalidate();
      },
    });

  useEffect(() => setPriceId(initialPriceId), [initialPriceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await savePrice.mutateAsync({ priceId }).catch(() => undefined);
  }

  function cancelEditing() {
    setPriceId(initialPriceId);
    setEditing(false);
    savePrice.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event form settings</CardTitle>
        {!editing ? (
          <CardAction>
            <Button
              onClick={() => setEditing(true)}
              size="sm"
              variant="outline"
            >
              <Pencil />
              Edit
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(savePrice.error)}>
              <FieldLabel htmlFor="additional-representative-price">
                Additional representative Stripe Price ID
              </FieldLabel>
              <Input
                disabled={!editing || savePrice.isPending}
                id="additional-representative-price"
                onChange={(event) => setPriceId(event.target.value)}
                required
                value={priceId}
              />
              <FieldDescription>
                This charge applies to each representative above the two
                included with registration.
              </FieldDescription>
              {savePrice.error ? (
                <FieldError>{savePrice.error.message}</FieldError>
              ) : null}
            </Field>
            {editing ? (
              <div className="flex justify-end gap-2">
                <Button
                  disabled={savePrice.isPending}
                  onClick={cancelEditing}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={savePrice.isPending || !priceId.trim()}
                  type="submit"
                >
                  {savePrice.isPending ? <Spinner /> : null}
                  Save settings
                </Button>
              </div>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function PackageDialog({
  draft,
  onOpenChange,
}: {
  draft?: PackageDraft;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState<PackageDraft>(emptyPackage);
  const utils = api.useUtils();
  const savePackage = api.registration.savePackage.useMutation({
    onSuccess: async () => {
      await utils.registration.adminConfiguration.invalidate();
      await utils.registration.configuration.invalidate();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (draft) setValue(draft);
  }, [draft]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await savePackage
      .mutateAsync({
        id: value.id,
        title: value.title,
        stripePriceIds: parsePriceIds(value.priceIds),
        enabled: value.enabled,
        sortOrder: value.sortOrder,
      })
      .catch(() => undefined);
  }

  return (
    <Dialog open={Boolean(draft)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {value.id ? "Edit package" : "Add package"}
            </DialogTitle>
            <DialogDescription>
              Set the package title and the Stripe Price IDs for its tiers.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="package-title">Package title</FieldLabel>
                <Input
                  id="package-title"
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Employer lunch"
                  required
                  value={value.title}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="package-price-ids">
                  Stripe Price IDs
                </FieldLabel>
                <Textarea
                  id="package-price-ids"
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      priceIds: event.target.value,
                    }))
                  }
                  placeholder={"price_…\nprice_…"}
                  required
                  rows={4}
                  value={value.priceIds}
                />
                <FieldDescription>
                  Add one Price ID per line in the order tiers should appear.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="package-sort-order">Sort order</FieldLabel>
                <Input
                  id="package-sort-order"
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={value.sortOrder}
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  checked={value.enabled}
                  id="package-enabled"
                  onCheckedChange={(checked) =>
                    setValue((current) => ({ ...current, enabled: checked }))
                  }
                />
                <div>
                  <FieldLabel htmlFor="package-enabled">Enabled</FieldLabel>
                  <FieldDescription>
                    Enabled packages appear on the registration form.
                  </FieldDescription>
                </div>
              </Field>
              {savePackage.error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {savePackage.error.message}
                  </AlertDescription>
                </Alert>
              ) : null}
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={savePackage.isPending} type="submit">
              {savePackage.isPending ? <Spinner /> : null}
              Save package
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
