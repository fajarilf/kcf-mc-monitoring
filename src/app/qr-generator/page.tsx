import { QrGenerator } from "@/components/qr/QrGenerator";

export default function QrGeneratorPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">QR Generator</h2>
        <p className="text-sm text-muted-foreground">
          Generate a QR code from any text or URL and download it as a JPEG.
        </p>
      </div>
      <QrGenerator />
    </div>
  );
}
