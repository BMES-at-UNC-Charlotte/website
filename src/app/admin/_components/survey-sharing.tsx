"use client";

import { Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";

import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldTitle } from "@/components/ui/field";
import { type Survey } from "./survey-editor";

export function SurveySharing({
  survey,
  onClose,
}: {
  survey: Survey;
  onClose: () => void;
}) {
  const url = `${window.location.origin}/s/${survey.path}`;
  const qr = useRef<SVGSVGElement>(null);
  const surveyLink = useRef<HTMLAnchorElement>(null);
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      if (surveyLink.current) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(surveyLink.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setMessage("Select and copy the link above.");
    }
  }

  function download() {
    if (!qr.current) return;
    const blob = new Blob([new XMLSerializer().serializeToString(qr.current)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${survey.path}-qr.svg`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share survey</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">
            /s/{survey.path}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <Field>
            <FieldTitle>Survey link</FieldTitle>
            <div className="flex min-w-0 items-center gap-2">
              <a
                ref={surveyLink}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 break-all underline underline-offset-4"
              >
                {url}
              </a>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Copy survey link"
                onClick={copyLink}
              >
                <Copy />
              </Button>
            </div>
          </Field>
          <div className="flex justify-center">
            <QRCodeSVG
              ref={qr}
              value={url}
              size={240}
              marginSize={4}
              level="M"
              title={`QR code for /s/${survey.path}`}
            />
          </div>
          {!survey.live && (
            <Alert>
              <AlertDescription>
                This link is off. Turn it on before sharing it with visitors.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={download}>
              <Download />
              Download QR code
            </Button>
          </div>
          <Typography variant="caption">
            The QR code uses this short link, so you can update the survey URL
            without printing a new code.
          </Typography>
          <p role="status">{message}</p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
