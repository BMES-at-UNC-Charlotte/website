"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createCheckoutKey, formatDonationUsd } from "@/lib/donation";
import { sponsorshipPriceIdsSchema } from "@/lib/sponsorship";
import { api, type RouterOutputs } from "@/trpc/react";

type Configuration = RouterOutputs["sponsorship"]["configuration"];
function configurationRows(catalog: Configuration) {
  return [
    ...catalog.tiers.map((tier) => tier.priceId),
    ...catalog.errors.map((error) => error.priceId),
  ].map((priceId) => ({
    id: createCheckoutKey(),
    priceId,
    originalPriceId: priceId,
  }));
}

export function SponsorshipSettings() {
  const configuration = api.sponsorship.configuration.useQuery();
  if (configuration.isPending)
    return (
      <div className="flex items-center gap-2" role="status">
        <Spinner /> Loading sponsorship packages…
      </div>
    );
  if (configuration.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {configuration.error.message}
          <Button variant="link" onClick={() => void configuration.refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  return <PackageSettings initial={configuration.data} />;
}

function PackageSettings({ initial }: { initial: Configuration }) {
  const [editing, setEditing] = useState(false);
  const catalog = initial;
  const [rows, setRows] = useState(() => configurationRows(initial));
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState("");
  const save = api.sponsorship.save.useMutation();
  const utils = api.useUtils();
  const busy = save.isPending;

  function clearError() {
    setMessage("");
    setValidation("");
    save.reset();
  }

  return (
    <div className="space-y-6">
      {!editing ? (
        <>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit sponsorship packages"
              onClick={() => {
                setRows(configurationRows(catalog));
                clearError();
                setEditing(true);
              }}
            >
              <Pencil />
            </Button>
          </div>
          {catalog.tiers.length ? (
            catalog.tiers.map((tier) => (
              <a
                key={tier.priceId}
                href={tier.stripeProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label={`Open ${tier.name} in Stripe`}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardAction>
                      <ExternalLink aria-hidden="true" />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Typography variant="h3" as="p">
                      {formatDonationUsd(tier.amount)}
                    </Typography>
                    {tier.description ? (
                      <Typography>{tier.description}</Typography>
                    ) : null}
                  </CardContent>
                </Card>
              </a>
            ))
          ) : (
            <Typography>No paid sponsorship packages configured.</Typography>
          )}
          {catalog.errors.map((error) => (
            <Alert key={error.priceId} variant="destructive">
              <AlertDescription>
                {error.message} Edit packages to replace or remove this price.
              </AlertDescription>
            </Alert>
          ))}
        </>
      ) : (
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            clearError();
            const parsed = sponsorshipPriceIdsSchema.safeParse(
              rows.map((row) => row.priceId),
            );
            if (!parsed.success) {
              setValidation(
                parsed.error.issues[0]?.message ?? "Check the Price IDs.",
              );
              return;
            }
            try {
              const result = await save.mutateAsync({ priceIds: parsed.data });
              utils.sponsorship.configuration.setData(undefined, result);
              setRows(configurationRows(result));
              setEditing(false);
              setMessage("Sponsorship packages saved.");
              await utils.sponsorship.configuration.invalidate();
            } catch {
              /* The mutation error is displayed below. */
            }
          }}
        >
          {rows.map((row, index) => {
            const tier = catalog.tiers.find(
              (item) => item.priceId === row.originalPriceId,
            );
            return (
              <Card key={row.id}>
                <CardHeader>
                  <CardTitle>
                    {tier?.name ??
                      (row.originalPriceId
                        ? "Unavailable package"
                        : "New package")}
                  </CardTitle>
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={`Remove ${tier?.name ?? `package ${index + 1}`}`}
                      onClick={() => {
                        setRows((current) =>
                          current.filter((item) => item.id !== row.id),
                        );
                        clearError();
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-5">
                  {tier ? (
                    <div className="space-y-3">
                      <Typography variant="h3" as="p">
                        {formatDonationUsd(tier.amount)}
                      </Typography>
                      {tier.description ? (
                        <Typography>{tier.description}</Typography>
                      ) : null}
                    </div>
                  ) : null}
                  <Field>
                    <FieldLabel htmlFor={`price-${row.id}`}>
                      Stripe Price ID
                    </FieldLabel>
                    <Input
                      id={`price-${row.id}`}
                      value={row.priceId}
                      placeholder="price_..."
                      pattern="price_[a-zA-Z0-9]+"
                      title="Enter a Stripe Price ID beginning with price_."
                      required
                      disabled={busy}
                      onChange={(event) => {
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, priceId: event.target.value }
                              : item,
                          ),
                        );
                        clearError();
                      }}
                    />
                  </Field>
                </CardContent>
              </Card>
            );
          })}
          {!rows.length ? (
            <Typography>
              No paid packages. Custom sponsorships will still be available by
              email.
            </Typography>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={busy || rows.length >= 50}
            onClick={() => {
              setRows((current) => [
                ...current,
                { id: createCheckoutKey(), priceId: "", originalPriceId: "" },
              ]);
              clearError();
            }}
          >
            <Plus /> Add package
          </Button>
          <Typography variant="caption">
            Names, descriptions, and amounts come from Stripe. Use active,
            one-time USD prices of at least $1.
          </Typography>
          {validation || save.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {validation || save.error?.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : null} Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setRows(configurationRows(catalog));
                clearError();
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
