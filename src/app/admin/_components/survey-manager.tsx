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
import { formatSurveyDate } from "@/lib/surveys";
import { api } from "@/trpc/react";
import { SurveyEditor, type Survey } from "./survey-editor";
import { SurveySharing } from "./survey-sharing";

export function SurveyManager() {
  const surveys = api.survey.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const utils = api.useUtils();
  const [editing, setEditing] = useState<Survey | null>();
  const [sharing, setSharing] = useState<Survey>();
  const [removing, setRemoving] = useState<Survey>();
  const [message, setMessage] = useState("");
  const setLive = api.survey.setLive.useMutation({
    onSuccess: async () => {
      await utils.survey.list.invalidate();
    },
  });
  const remove = api.survey.remove.useMutation({
    onSuccess: async () => {
      await utils.survey.list.invalidate();
      setRemoving(undefined);
      setMessage("Survey deleted.");
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Survey pages</CardTitle>
          <CardDescription>
            Share a link or QR code. Use the switch to control who can access
            each page.
          </CardDescription>
          <CardAction>
            <Button onClick={() => setEditing(null)}>
              <Plus />
              New survey
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          {surveys.isLoading && (
            <div className="flex items-center gap-2" role="status">
              <Spinner />
              Loading surveys…
            </div>
          )}
          {surveys.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Unable to load surveys.{" "}
                <Button variant="link" onClick={() => surveys.refetch()}>
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
          {surveys.data?.length === 0 && (
            <div className="space-y-2 py-6">
              <Typography variant="h3">No surveys yet</Typography>
              <Typography variant="caption">
                Create a survey page to give your form a short, shareable link.
              </Typography>
            </div>
          )}
          <ItemGroup className="gap-3">
            {surveys.data?.map((survey) => (
              <Item key={survey.id} variant="muted" className="flex-wrap">
                <ItemContent className="min-w-0 basis-full sm:basis-0">
                  <ItemTitle className="max-w-full flex-wrap">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      /s/{survey.path}
                    </span>
                    <Badge variant={survey.live ? "default" : "outline"}>
                      {survey.live ? "Live" : "Off"}
                    </Badge>
                  </ItemTitle>
                  {survey.comment && (
                    <ItemDescription className="whitespace-pre-line">
                      {survey.comment}
                    </ItemDescription>
                  )}
                  <Typography variant="caption">
                    {survey.closesOn
                      ? `Closes ${formatSurveyDate(survey.closesOn)} at 11:59 PM (Charlotte time)`
                      : "No close date"}
                  </Typography>
                </ItemContent>
                <ItemActions className="flex-wrap">
                  <Field orientation="horizontal" className="w-auto">
                    <FieldLabel htmlFor={`live-${survey.id}`}>
                      Live<span className="sr-only"> /s/{survey.path}</span>
                    </FieldLabel>
                    <Switch
                      id={`live-${survey.id}`}
                      checked={survey.live}
                      disabled={setLive.isPending}
                      onCheckedChange={(live) => {
                        setLive.mutate({ id: survey.id, live });
                      }}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open /s/${survey.path}`}
                    nativeButton={false}
                    render={
                      <Link
                        href={`/s/${survey.path}`}
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
                    aria-label={`Share /s/${survey.path}`}
                    onClick={() => setSharing(survey)}
                  >
                    <QrCode />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit /s/${survey.path}`}
                    onClick={() => setEditing(survey)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Delete /s/${survey.path}`}
                    onClick={() => {
                      remove.reset();
                      setRemoving(survey);
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
        <SurveyEditor survey={editing} onClose={() => setEditing(undefined)} />
      )}
      {sharing && (
        <SurveySharing
          survey={
            surveys.data?.find((survey) => survey.id === sharing.id) ?? sharing
          }
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
              <DialogTitle>Delete survey?</DialogTitle>
              <DialogDescription>
                Delete “/s/{removing.path}”? Its short link and QR code will
                stop working. Responses in your form provider will remain there.
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
                {remove.isPending && <Spinner />}Delete survey
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
