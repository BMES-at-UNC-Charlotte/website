"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDonationUsd } from "@/lib/donation";
import { formatSponsorshipDate } from "@/lib/sponsorship";
import { api } from "@/trpc/react";
import { SponsorshipDetails } from "./sponsorship-details";

export function SponsorshipManager() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string>();
  const sponsors = api.sponsorship.list.useQuery(
    { page },
    { refetchInterval: 60_000 },
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5">
          {sponsors.isPending ? (
            <div className="flex items-center gap-2" role="status">
              <Spinner /> Loading sponsors…
            </div>
          ) : sponsors.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {sponsors.error.message}
                <Button variant="link" onClick={() => void sponsors.refetch()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : sponsors.data.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Sponsored</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.data.items.map((sponsor) => (
                  <TableRow
                    key={sponsor.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(sponsor.id)}
                  >
                    <TableCell>
                      <Button
                        variant="link"
                        onClick={() => setSelected(sponsor.id)}
                        aria-label={`View ${sponsor.companyName}`}
                      >
                        {sponsor.companyName}
                      </Button>
                    </TableCell>
                    <TableCell>{sponsor.packageName}</TableCell>
                    <TableCell>{formatDonationUsd(sponsor.amount)}</TableCell>
                    <TableCell>
                      {formatSponsorshipDate(sponsor.sponsoredAt)}
                    </TableCell>
                    <TableCell>
                      <div>{sponsor.contactName}</div>
                      <Typography variant="caption">{sponsor.email}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-2 py-6">
              <Typography variant="h3">
                {page ? "No more sponsorships" : "No sponsors yet"}
              </Typography>
              <Typography>
                {page
                  ? "Return to the previous page to see earlier results."
                  : "Companies will appear here after their sponsorship payment is confirmed."}
              </Typography>
            </div>
          )}
          {page > 0 || sponsors.data?.hasMore ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Typography variant="caption">Page {page + 1}</Typography>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!page || sponsors.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!sponsors.data?.hasMore || sponsors.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Button
        variant="outline"
        render={<Link href="/admin/sponsorship/config" />}
        nativeButton={false}
      >
        <Settings /> Sponsorship settings
      </Button>
      {selected ? (
        <SponsorshipDetails
          id={selected}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </div>
  );
}
