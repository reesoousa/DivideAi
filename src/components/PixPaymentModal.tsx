import { useState } from "react";
import { Copy, Check, ArrowRight, AlertCircle, CreditCard, Upload } from "lucide-react";
import { Participant, PixKey, Settlement } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  onConfirmPayment: (amount: number, receiptUrl?: string, note?: string) => void;
}

function formatCurrency(value: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Removes accents and special characters, keeping only ASCII
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, 25);
}

/**
 * Creates an EMV TLV field
 */
function createTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

/**
 * Calculates CRC16-CCITT-FALSE checksum
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
function calculateCRC16CCITT(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generates a valid PIX EMV code following Brazilian Central Bank specifications
 * Reference: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */
function generatePixEMVCode(
  pixKey: string,
  amount: number,
  recipientName: string,
  city: string,
  description: string
): string {
  // Field 00: Payload Format Indicator (mandatory, fixed "01")
  const field00 = createTLV("00", "01");
  
  // Field 01: Point of Initiation Method
  // "11" = Static QR (can be used multiple times)
  // "12" = Dynamic QR (single use)
  const field01 = createTLV("01", "12");
  
  // Field 26: Merchant Account Information (PIX)
  // Sub-field 00: GUI (mandatory) = "br.gov.bcb.pix"
  // Sub-field 01: Chave PIX
  const gui = createTLV("00", "br.gov.bcb.pix");
  const chavePix = createTLV("01", pixKey);
  const merchantAccountInfo = gui + chavePix;
  const field26 = createTLV("26", merchantAccountInfo);
  
  // Field 52: Merchant Category Code (mandatory)
  // "0000" = Not specified
  const field52 = createTLV("52", "0000");
  
  // Field 53: Transaction Currency (mandatory)
  // "986" = BRL (Brazilian Real)
  const field53 = createTLV("53", "986");
  
  // Field 54: Transaction Amount (optional, but we include it)
  const amountStr = amount.toFixed(2);
  const field54 = createTLV("54", amountStr);
  
  // Field 58: Country Code (mandatory)
  // "BR" = Brazil
  const field58 = createTLV("58", "BR");
  
  // Field 59: Merchant Name (mandatory, max 25 chars)
  const normalizedName = normalizeText(recipientName);
  const field59 = createTLV("59", normalizedName);
  
  // Field 60: Merchant City (mandatory, max 15 chars)
  const normalizedCity = normalizeText(city).slice(0, 15);
  const field60 = createTLV("60", normalizedCity);
  
  // Field 62: Additional Data Field Template
  // Sub-field 05: Reference Label (TXID) - max 25 chars
  const txId = normalizeText(description).slice(0, 25);
  const additionalDataContent = createTLV("05", txId || "***");
  const field62 = createTLV("62", additionalDataContent);
  
  // Build payload without CRC
  const payloadWithoutCRC = 
    field00 + 
    field01 + 
    field26 + 
    field52 + 
    field53 + 
    field54 + 
    field58 + 
    field59 + 
    field60 + 
    field62;
  
  // Field 63: CRC16 (mandatory, must be last)
  // Add "6304" (field ID + length) before calculating CRC
  const payloadForCRC = payloadWithoutCRC + "6304";
  const crc = calculateCRC16CCITT(payloadForCRC);
  
  return payloadForCRC + crc;
}

export function PixPaymentModal({
  open,
  onOpenChange,
  settlement,
  participants,
  groupName = "Grupo",
  onConfirmPayment,
}: PixPaymentModalProps) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState(settlement.amount.toFixed(2));
  const [receiptUrl, setReceiptUrl] = useState("");
  const [note, setNote] = useState("");

  const payer = getParticipantById(participants, settlement.from);
  const recipient = getParticipantById(participants, settlement.to);

  const recipientPixKeys = recipient?.pixKeys || [];
  const hasPixKeys = recipientPixKeys.length > 0;

  const selectedKey = recipientPixKeys.find((k) => k.id === selectedKeyId) || recipientPixKeys[0];

  const pixCode = selectedKey
    ? generatePixEMVCode(
        selectedKey.key,
        parseFloat(paymentAmount) || settlement.amount,
        recipient?.name || "Recebedor",
        "BRASILIA",
        `DivideAi ${groupName}`
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

  const handleConfirm = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    onConfirmPayment(amount, receiptUrl || undefined, note || undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Reset state when modal opens with new settlement
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPaymentAmount(settlement.amount.toFixed(2));
      setReceiptUrl("");
      setNote("");
      setCopied(false);
      setSelectedKeyId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Realizar Pagamento
          </DialogTitle>
          <DialogDescription>
            {payer?.name} pagando para {recipient?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* PIX Copy & Paste Section - Top Priority */}
          {hasPixKeys ? (
            <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">Pix Copia e Cola</span>
              </div>
              
              {/* Key Selection */}
              {recipientPixKeys.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Chave Pix do recebedor</Label>
                  <Select 
                    value={selectedKeyId || recipientPixKeys[0]?.id} 
                    onValueChange={setSelectedKeyId}
                  >
                    <SelectTrigger className="h-9 text-sm">
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

              {recipientPixKeys.length === 1 && (
                <div className="text-xs text-muted-foreground">
                  Chave: <span className="font-medium text-foreground">{selectedKey?.key}</span>
                </div>
              )}

              {/* PIX Code Display */}
              <div className="relative">
                <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all max-h-20 overflow-y-auto border">
                  {pixCode}
                </div>
              </div>

              {/* Copy Button */}
              <Button 
                onClick={handleCopy} 
                className="w-full gap-2"
                variant={copied ? "secondary" : "default"}
                size="default"
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

              {/* Quick Instructions */}
              <p className="text-xs text-muted-foreground text-center">
                Cole o código no app do seu banco para realizar o pagamento
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Chave Pix não cadastrada</p>
                <p className="text-muted-foreground">
                  {recipient?.name} ainda não cadastrou uma chave Pix. Peça para adicionar na aba de Pessoas.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Summary */}
          <div className="flex items-center justify-center gap-3 py-3 border-y border-border/50">
            <div className="flex flex-col items-center gap-1">
              <ParticipantAvatar participant={payer} size="md" />
              <span className="text-xs font-medium max-w-[80px] truncate">{payer?.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-bold text-primary">
                {formatCurrency(parseFloat(paymentAmount) || settlement.amount, settings.currency)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <ParticipantAvatar participant={recipient} size="md" />
              <span className="text-xs font-medium max-w-[80px] truncate">{recipient?.name}</span>
            </div>
          </div>

          {/* Payment Details Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Valor do Pagamento
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiptUrl" className="flex items-center gap-1.5 text-sm">
                <Upload className="h-3.5 w-3.5" />
                URL do Comprovante
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="receiptUrl"
                type="url"
                placeholder="https://..."
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm">
                Observação
                <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
              </Label>
              <Input
                id="note"
                placeholder="Ex: Pagamento via Pix"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-base"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row pt-2">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="w-full sm:w-auto"
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
