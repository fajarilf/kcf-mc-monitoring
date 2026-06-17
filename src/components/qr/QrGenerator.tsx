"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputGroupDropdown } from "./InputGroupDropdown";

interface GeneratedQr {
  text: string;
  url: string;
}

interface QrFailure {
  text: string;
  message: string;
}

/** Rendered resolution of the QR code — also the size of the downloaded file. */
const QR_PIXEL_SIZE = 512;

/** Derives a friendly download filename from the QR value. */
function makeFilename(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug ? `qr-${slug}.jpg` : "qr-code.jpg";
}

export function QrGenerator() {
  const [value, setValue] = useState("");
  const [qr, setQr] = useState<GeneratedQr | null>(null);
  const [failure, setFailure] = useState<QrFailure | null>(null);

  const text = value.trim();

  useEffect(() => {
    if (!text) return;

    let cancelled = false;
    // Render onto an off-screen canvas so we can export it as JPEG.
    const canvas = document.createElement("canvas");

    QRCode.toCanvas(canvas, text, {
      width: QR_PIXEL_SIZE,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(() => {
        if (cancelled) return;
        // Export as JPEG so the preview matches the downloaded file exactly.
        setQr({ text, url: canvas.toDataURL("image/jpeg", 0.95) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFailure({
          text,
          message:
            err instanceof Error
              ? err.message
              : "Could not generate a QR code for this value.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  // Only treat a result as current when it matches the latest input.
  const activeQr = qr && qr.text === text ? qr : null;
  const activeFailure = failure && failure.text === text ? failure : null;

  function handleDownload() {
    if (!activeQr) return;
    const link = document.createElement("a");
    link.href = activeQr.url;
    link.download = makeFilename(activeQr.text);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
        <CardDescription>
          Enter any text or URL, then download the QR code as a JPEG image.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Value</Label>
          <InputGroupDropdown onValueChange={(v) => setValue(v || "")}/>
        </div>

        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-4">
          {!text ? (
            <p className="px-6 text-center text-sm text-muted-foreground">
              Your QR code will appear here
            </p>
          ) : activeFailure ? (
            <p className="px-6 text-center text-sm text-destructive">
              {activeFailure.message}
            </p>
          ) : activeQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeQr.url}
              alt={`QR code for ${text}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Generating…</p>
          )}
        </div>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={!activeQr}
          className="w-full"
        >
          <Download />
          Download JPEG
        </Button>
      </CardContent>
    </Card>
  );
}
