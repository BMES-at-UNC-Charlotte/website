"use client";

import { ExternalLink, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { formatEmbeddedPageDate } from "@/lib/embeds";
import { api } from "@/trpc/react";
import { EmbeddedPageEditor, type EmbeddedPage } from "./embed-editor";
import { EmbeddedPageSharing } from "./embed-sharing";

export function EmbeddedPageManager() {
  const pages = api.embed.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const utils = api.useUtils();
  const [editing, setEditing] = useState<EmbeddedPage | null>();
  const [sharing, setSharing] = useState<EmbeddedPage>();
  const [removing, setRemoving] = useState<EmbeddedPage>();
  const [message, setMessage] = useState("");
  const setLive = api.embed.setLive.useMutation({
    onSuccess: async () => {
      await utils.embed.list.invalidate();
    },
  });
  const remove = api.embed.remove.useMutation({
    onSuccess: async () => {
      await utils.embed.list.invalidate();
      setRemoving(undefined);
      setMessage("Page deleted.");
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Embedded pages</CardTitle>
          <CardDescription>
            Share a link or QR code. Use the switch to control who can access
            each page.
          </CardDescription>
          <CardAction>
            <Button onClick={() => setEditing(null)}>
              <Plus />
              New page
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          {pages.isLoading && (
            <div className="flex items-center gap-2" role="status">
              <Spinner />
              Loading pages…
            </div>
          )}
          {pages.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Unable to load pages.{" "}
                <Button variant="link" onClick={() => pages.refetch()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {setLive.error && (
            <Alert variant="destructive">
              <AlertDescription>{setLive.error.message}</AlertDescription>
            </Alert>
          )}
          {pages.data?.length === 0 && (
            <div className="space-y-2 py-6">
              <Typography variant="h3">No pages yet</Typography>
              <Typography variant="caption">
                Embed a form, presentation, or other page with a short,
                shareable link.
              </Typography>
            </div>
          )}
          <ItemGroup className="gap-3">
            {pages.data?.map((page) => (
              <Item key={page.id} variant="muted" className="flex-wrap">
                <ItemContent className="min-w-0 basis-full sm:basis-0">
                  <ItemTitle className="max-w-full flex-wrap">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      /s/{page.path}
                    </span>
                    <Badge variant={page.live ? "default" : "outline"}>
                      {page.live ? "Live" : "Off"}
                    </Badge>
                  </ItemTitle>
                  {page.comment && (
                    <ItemDescription className="whitespace-pre-line">
                      {page.comment}
                    </ItemDescription>
                  )}
                  <Typography variant="caption">
                    {page.closesOn
                      ? `Closes ${formatEmbeddedPageDate(page.closesOn)} at 11:59 PM EST`
                      : "No close date"}
                  </Typography>
                </ItemContent>
                <ItemActions className="flex-wrap">
                  <Field orientation="horizontal" className="w-auto">
                    <FieldLabel htmlFor={`live-${page.id}`}>
                      Live<span className="sr-only"> /s/{page.path}</span>
                    </FieldLabel>
                    <Switch
                      id={`live-${page.id}`}
                      checked={page.live}
                      disabled={setLive.isPending}
                      onCheckedChange={(live) => {
                        setLive.mutate({ id: page.id, live });
                      }}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open /s/${page.path}`}
                    nativeButton={false}
                    render={
                      <Link
                        href={`/s/${page.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        prefetch={false}
                      />
                    }
                  >
                    <ExternalLink />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Share /s/${page.path}`}
                    onClick={() => setSharing(page)}
                  >
                    <QrCode />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit /s/${page.path}`}
                    onClick={() => setEditing(page)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Delete /s/${page.path}`}
                    onClick={() => {
                      remove.reset();
                      setRemoving(page);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
          {message && <p role="status">{message}</p>}
        </CardContent>
      </Card>
      {editing !== undefined && (
        <EmbeddedPageEditor
          page={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {sharing && (
        <EmbeddedPageSharing
          page={pages.data?.find((page) => page.id === sharing.id) ?? sharing}
          onClose={() => setSharing(undefined)}
        />
      )}
      {removing && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !remove.isPending) setRemoving(undefined);
          }}
        >
          <DialogContent className="gap-6">
            <DialogHeader>
              <DialogTitle>Delete page?</DialogTitle>
              <DialogDescription>
                Delete “/s/{removing.path}”? Its short link and QR code will
                stop working. The original page will remain available at its
                source.
              </DialogDescription>
            </DialogHeader>
            {remove.error && (
              <Alert variant="destructive">
                <AlertDescription>{remove.error.message}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => setRemoving(undefined)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: removing.id })}
              >
                {remove.isPending && <Spinner />}Delete page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
