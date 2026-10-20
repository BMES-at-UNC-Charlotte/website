"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createCheckoutKey, formatDonationUsd } from "@/lib/donation";
import { sponsorshipPriceIdsSchema } from "@/lib/sponsorship";
import { api, type RouterOutputs } from "@/trpc/react";

type Configuration = RouterOutputs["sponsorship"]["configuration"];

export function SponsorshipSettings() {
  const configuration = api.sponsorship.configuration.useQuery();
  if (configuration.isPending)
    return (
      <div role="status">
        <Spinner />
        Loading sponsorship prices
      </div>
    );
  if (configuration.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{configuration.error.message}</AlertDescription>
        <Button variant="outline" onClick={() => void configuration.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  return <PriceEditor initial={configuration.data} />;
}

function PriceEditor({ initial }: { initial: Configuration }) {
  const [rows, setRows] = useState(() =>
    initial.priceIds.map((priceId) => ({
      id: createCheckoutKey(),
      priceId,
    })),
  );
  const [catalog, setCatalog] = useState(initial);
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState("");
  const save = api.sponsorship.save.useMutation();
  const utils = api.useUtils();
  const busy = save.isPending;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configured Price IDs</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setMessage("");
              setValidation("");
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
                const result = await save.mutateAsync({
                  priceIds: parsed.data,
                });
                setCatalog(result);
                setMessage("Sponsorship prices saved.");
                await utils.sponsorship.configuration.invalidate();
              } catch {
                /* The mutation error is displayed below. */
              }
            }}
          >
            {rows.length ? (
              rows.map((row, index) => (
                <Field key={row.id}>
                  <FieldLabel htmlFor={`price-${row.id}`}>
                    Price ID {index + 1}
                  </FieldLabel>
                  <div className="flex items-center gap-3">
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
                        setMessage("");
                        setValidation("");
                        save.reset();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove price ${index + 1}`}
                      disabled={busy}
                      onClick={() => {
                        setRows((current) =>
                          current.filter((item) => item.id !== row.id),
                        );
                        setMessage("");
                        setValidation("");
                        save.reset();
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Field>
              ))
            ) : (
              <Typography>
                No paid sponsorships configured. Visitors can still email us
                about sponsorships.
              </Typography>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy || rows.length >= 50}
                onClick={() => {
                  setRows((current) => [
                    ...current,
                    { id: createCheckoutKey(), priceId: "" },
                  ]);
                  setMessage("");
                  setValidation("");
                  save.reset();
                }}
              >
                <Plus />
                Add price
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner /> : null}Save prices
              </Button>
            </div>
            {validation || save.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {validation || save.error?.message}
                </AlertDescription>
              </Alert>
            ) : null}
            {message ? <p role="status">{message}</p> : null}
          </form>
        </CardContent>
      </Card>
      {catalog.errors.map((error) => (
        <Alert key={error.priceId} variant="destructive">
          <AlertDescription>
            {error.message} This price is hidden from sponsors until it is fixed
            or removed.
          </AlertDescription>
        </Alert>
      ))}
      {catalog.tiers.length ? (
        <section className="space-y-4" aria-labelledby="published-tiers">
          <Typography variant="h2" id="published-tiers">
            Published sponsorships
          </Typography>
          {catalog.tiers.map((tier) => (
            <Card key={tier.priceId} size="sm">
              <CardHeader>
                <CardTitle>
                  {tier.name} · {formatDonationUsd(tier.amount)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Typography>{tier.description}</Typography>
                <Typography>{tier.priceId}</Typography>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
