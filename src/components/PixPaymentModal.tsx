import { useState } from "react";
import { Copy, Check, QrCode, ArrowRight, AlertCircle } from "lucide-react";
import { Participant, PixKey, Settlement } from "@/types/expense";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParticipantAvatar, getParticipantById } from "@/components/ParticipantAvatar";
import { useSettings } from "@/contexts/SettingsContext";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement;
  participants: Participant[];
  groupName?: string;
  onMarkAsPaid?: () => void;
}

function formatCurrency(value: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Generates a PIX "Copia e Cola" EMV code
 * This is a simplified version - real PIX codes have CRC16 validation
 */
function generatePixCode(
  pixKey: string,
  pixKeyType: string,
  amount: number,
  recipientName: string,
  description: string
): string {
  // EMV format for PIX
  // This is a simplified representation
  const merchantAccountInfo = `0014BR.GOV.BCB.PIX01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
  const transactionAmount = amount.toFixed(2);
  const additionalData = `05${description.length.toString().padStart(2, '0')}${description}`;
  
  // Build EMV payload
  const payload = [
    "000201", // Payload Format Indicator
    "010212", // Point of Initiation Method (12 = dynamic QR)
    `26${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}`, // Merchant Account Info
    "52040000", // Merchant Category Code
    "5303986", // Transaction Currency (986 = BRL)
    `54${transactionAmount.length.toString().padStart(2, '0')}${transactionAmount}`, // Transaction Amount
    "5802BR", // Country Code
    `59${Math.min(recipientName.length, 25).toString().padStart(2, '0')}${recipientName.slice(0, 25).toUpperCase()}`, // Merchant Name
    "6008BRASILIA", // Merchant City
    `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`, // Additional Data
    "6304", // CRC16 placeholder
  ].join("");

  // Calculate CRC16 (simplified - in production use proper CRC16-CCITT)
  const crc = calculateCRC16(payload);
  
  return payload + crc;
}

function calculateCRC16(str: string): string {
  // CRC16-CCITT polynomial
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function PixPaymentModal({
  open,
  onOpenChange,
  settlement,
  participants,
  groupName = "Grupo",
  onMarkAsPaid,
}: PixPaymentModalProps) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");

  const payer = getParticipantById(participants, settlement.from);
  const recipient = getParticipantById(participants, settlement.to);

  const recipientPixKeys = recipient?.pixKeys || [];
  const hasPixKeys = recipientPixKeys.length > 0;

  const selectedKey = recipientPixKeys.find((k) => k.id === selectedKeyId) || recipientPixKeys[0];

  const pixCode = selectedKey
    ? generatePixCode(
        selectedKey.key,
        selectedKey.type,
        settlement.amount,
        recipient?.name || "Recebedor",
        `DivideAi ${groupName}`.slice(0, 25)
      )
    : "";

  const handleCopy = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleMarkAsPaid = () => {
    onMarkAsPaid?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Realizar Pagamento via Pix
          </DialogTitle>
          <DialogDescription>
            Copie o código Pix e cole no app do seu banco
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="flex items-center justify-center gap-3 p-4 bg-accent/50 rounded-xl">
            <div className="flex flex-col items-center gap-1">
              <ParticipantAvatar participant={payer} size="lg" />
              <span className="text-sm font-medium">{payer?.name}</span>
              <span className="text-xs text-muted-foreground">Pagador</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-primary">
                {formatCurrency(settlement.amount, settings.currency)}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <ParticipantAvatar participant={recipient} size="lg" />
              <span className="text-sm font-medium">{recipient?.name}</span>
              <span className="text-xs text-muted-foreground">Recebedor</span>
            </div>
          </div>

          {!hasPixKeys ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Chave Pix não cadastrada</p>
                <p className="text-muted-foreground">
                  {recipient?.name} ainda não cadastrou uma chave Pix. Peça para adicionar na aba de Pessoas.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Key Selection */}
              {recipientPixKeys.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chave Pix do recebedor</label>
                  <Select 
                    value={selectedKeyId || recipientPixKeys[0]?.id} 
                    onValueChange={setSelectedKeyId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientPixKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.label || key.type.toUpperCase()}: {key.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* PIX Code Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pix Copia e Cola</label>
                <div className="relative">
                  <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all max-h-24 overflow-y-auto">
                    {pixCode}
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <Button 
                onClick={handleCopy} 
                className="w-full gap-2"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Código Pix
                  </>
                )}
              </Button>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground space-y-1 text-center">
                <p>1. Copie o código acima</p>
                <p>2. Abra o app do seu banco</p>
                <p>3. Escolha "Pix Copia e Cola" e cole o código</p>
                <p>4. Confirme o pagamento</p>
              </div>
            </>
          )}

          {/* Mark as Paid */}
          {onMarkAsPaid && (
            <Button
              variant="outline"
              onClick={handleMarkAsPaid}
              className="w-full"
            >
              Já fiz o pagamento - Marcar como pago
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
