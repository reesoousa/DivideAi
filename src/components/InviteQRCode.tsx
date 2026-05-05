import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

interface InviteQRCodeProps {
  inviteCode: string;
  size?: number;
}

export function InviteQRCode({ inviteCode, size = 180 }: InviteQRCodeProps) {
  const url = `${window.location.origin}/join/${inviteCode}`;

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-background border border-border rounded-lg">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <QrCode className="h-3.5 w-3.5" />
        <span>Escaneie para entrar no grupo</span>
      </div>
      <div className="p-3 bg-white rounded-md">
        <QRCodeSVG value={url} size={size} level="M" />
      </div>
    </div>
  );
}
