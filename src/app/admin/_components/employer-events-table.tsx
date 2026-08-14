"use client";

import {
  DataTable,
  Pagination,
  type ColumnDef,
  type PageSize,
} from "@/app/_components/data-table";
import { Typography } from "@/app/_components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toTitleCase } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type Registration =
  RouterOutputs["registration"]["list"]["registrations"][number];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

const columns: ColumnDef<Registration>[] = [
  {
    header: "Company",
    value: (registration) => (
      <div>
        <Typography as="div">{registration.companyName}</Typography>
        <Typography as="div" variant="caption">
          {registration.email}
        </Typography>
      </div>
    ),
  },
  { header: "Contact", value: "contactName" },
  { header: "Package", value: "tierName" },
  {
    header: "Representatives",
    value: "representativeCount",
    float: "right",
  },
  {
    header: "Payment",
    value: (registration) => (
      <Badge
        variant={
          registration.paymentStatus === "SUCCEEDED"
            ? "default"
            : registration.paymentStatus === "FAILED"
              ? "destructive"
              : "secondary"
        }
      >
        {toTitleCase(registration.paymentStatus)}
      </Badge>
    ),
  },
  {
    header: "Total",
    value: (registration) =>
      formatCurrency(registration.amount, registration.currency),
    float: "right",
  },
  {
    header: "Registered",
    value: (registration) => dateFormatter.format(registration.createdAt),
    float: "right",
  },
];

function Detail({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === "") return null;

  return (
    <FieldContent>
      <FieldTitle>{label}</FieldTitle>
      <FieldDescription>{children}</FieldDescription>
    </FieldContent>
  );
}

function ListDetail({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return <Detail label={label}>{values.join(", ")}</Detail>;
}

function RegistrationDetails({ registration }: { registration: Registration }) {
  const address = [
    registration.addressStreet,
    registration.addressCity,
    registration.addressState,
    registration.addressPostalCode,
    registration.addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle>{registration.companyName}</DialogTitle>
          <Badge
            variant={
              registration.paymentStatus === "SUCCEEDED"
                ? "default"
                : registration.paymentStatus === "FAILED"
                  ? "destructive"
                  : "secondary"
            }
          >
            {toTitleCase(registration.paymentStatus)}
          </Badge>
        </div>
        <DialogDescription>
          Employer registration submitted{" "}
          {dateFormatter.format(registration.createdAt)}
        </DialogDescription>
        <Button
          className="mt-2 self-start"
          nativeButton={false}
          size="sm"
          variant="outline"
          render={
            <a
              href={`https://dashboard.stripe.com/payments/${registration.stripePaymentIntentId}`}
              rel="noreferrer"
              target="_blank"
            />
          }
        >
          View in Stripe
          <ExternalLink data-icon="inline-end" />
        </Button>
      </DialogHeader>

      <DialogBody className="space-y-6">
        <Separator />
        <section className="space-y-3">
          <Typography variant="h6">Contact</Typography>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Name">{registration.contactName}</Detail>
            <Detail label="Title">{registration.title}</Detail>
            <Detail label="Division">{registration.division}</Detail>
            <Detail label="Email">
              <a href={`mailto:${registration.email}`}>{registration.email}</a>
            </Detail>
            <Detail label="Phone">{registration.phone}</Detail>
            <Detail label="Fax">{registration.fax}</Detail>
            <Detail label="Address">{address}</Detail>
            <Detail label="Website">
              {registration.website && (
                <a href={registration.website} rel="noreferrer" target="_blank">
                  {registration.website}
                </a>
              )}
            </Detail>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <Typography variant="h6">Company & recruiting</Typography>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Third-party recruiter">
              {registration.thirdPartyRecruiter ? "Yes" : "No"}
            </Detail>
            <Detail label="Alumni">
              {registration.alumni == null
                ? "Not provided"
                : registration.alumni
                  ? "Yes"
                  : "No"}
            </Detail>
            <ListDetail
              label="Majors recruiting"
              values={registration.majorsRecruiting}
            />
            <ListDetail
              label="Degree levels"
              values={registration.degreeLevels}
            />
            <ListDetail
              label="Positions available"
              values={registration.positionsAvailable}
            />
            <ListDetail
              label="Work authorizations"
              values={registration.workAuthorizations}
            />
            <Detail label="Other work authorization">
              {registration.workAuthorizationOther}
            </Detail>
            <div className="sm:col-span-2">
              <Detail label="Company overview">{registration.overview}</Detail>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <Typography variant="h6">Registration & payment</Typography>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Package">{registration.tierName}</Detail>
            <Detail label="Representatives">
              {registration.representativeCount}
            </Detail>
            <Detail label="Additional representatives">
              {registration.additionalRepCount}
            </Detail>
            <Detail label="Additional representative rate">
              {formatCurrency(
                registration.additionalRepUnitAmount,
                registration.currency,
              )}
            </Detail>
            <Detail label="Total">
              {formatCurrency(registration.amount, registration.currency)}
            </Detail>
            <Detail label="Last updated">
              {dateFormatter.format(registration.updatedAt)}
            </Detail>
          </div>
        </section>
      </DialogBody>
    </>
  );
}

export function EmployerEventsTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(25);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const registrations = api.registration.list.useQuery({ page, limit });

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Employer Registrations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            className="rounded-none border-x-0"
            columns={columns}
            data={registrations.data?.registrations ?? []}
            onRowClick={setSelectedRegistration}
            loading={registrations.isLoading}
            error={registrations.error ? "Unable to load registrations." : null}
          />
          <Pagination
            page={page}
            total={registrations.data?.total ?? 0}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
          />
        </CardContent>
      </Card>

      <Dialog
        open={selectedRegistration !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRegistration(null);
        }}
      >
        <DialogContent size="xl">
          {selectedRegistration && (
            <RegistrationDetails registration={selectedRegistration} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
